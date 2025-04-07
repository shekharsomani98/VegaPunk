import os
import json
import base64
import io
import re
import asyncio
from PIL import Image
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Form
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uvicorn
from mistralai import Mistral
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Academic Paper OCR Gallery", docs_url="/gallery-docs")
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create data directories
OUTPUT_DIR = "data/figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mount static files directory
app.mount("/figures", StaticFiles(directory=OUTPUT_DIR), name="figures")

# Initialize Mistral client
def get_mistral_client():
    api_key = os.getenv("MISTRAL_API_KEY", "")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY environment variable is not set")
    client = Mistral(api_key=api_key)
    print(f"Mistral client initialized with API key: {api_key[:5]}*****")
    return client

# Utility functions
def extract_figure_tag(markdown, image_id):
    """Extract figure caption from markdown text"""
    pattern = fr'!\[{image_id}\]\({image_id}\)[^\n]*\n+(?:Figure \d+:|Figure \d+\.)?\s*([^\n]+)'
    match = re.search(pattern, markdown)
    if match:
        return match.group(1).strip()
    return None

def process_ocr_response(ocr_response, output_dir=OUTPUT_DIR):
    """Process OCR response to extract images and tables"""
    data = {
        "images": [],
        "tables": []
    }
    
    figures_metadata = {}
    
    # Combine all markdown for better pattern matching across page boundaries
    all_markdown = ""
    for page in ocr_response.pages:
        all_markdown += getattr(page, "markdown", "") + "\n\n"
    
    # Process each page for images
    for page in ocr_response.pages:
        page_index = getattr(page, "index", 0)
        markdown = getattr(page, "markdown", "")
        images = getattr(page, "images", [])
        
        # Extract and save images
        for i, image in enumerate(images):
            image_id = getattr(image, "id", f"figure_{page_index}_{i}.jpeg")
            img_data = getattr(image, "image_base64", None)
            
            if img_data:
                # Remove header if present
                if ',' in img_data:
                    img_data = img_data.split(',', 1)[1]
                
                # Decode base64 to image
                img_bytes = base64.b64decode(img_data)
                img = Image.open(io.BytesIO(img_bytes))
                
                # Ensure image filename doesn't include subfolders
                image_filename = os.path.basename(image_id)
                save_path = os.path.join(output_dir, image_filename)
                
                # Save the image
                img.save(save_path)
                
                # Extract caption
                caption = extract_figure_tag(markdown, image_id)
                
                # Add to metadata
                figure_key = caption or f"Figure_{page_index}_{i}"
                figures_metadata[figure_key] = save_path.replace("\\", "/")
                
                # Add to our data structure
                data["images"].append({
                    "id": image_id,
                    "path": save_path.replace("\\", "/"),
                    "caption": caption
                })
    
    # Extract tables from the combined markdown
    table_pattern = r"Table\s+(\d+):[^\n]*\n+(\|(?:[^\n]*\|)+\n+)+"
    for match in re.finditer(table_pattern, all_markdown, re.MULTILINE):
        table_content = match.group(0)
        
        # Get table number
        table_num = match.group(1)
        
        # Extract title - first line up to the newline
        title_match = re.match(r"([^\n]+)", table_content)
        title = title_match.group(1).strip() if title_match else f"Table {table_num}"
        
        # Extract table rows (all lines starting with |)
        table_rows = re.findall(r"\|(?:[^\n]*\|)+", table_content)
        
        if table_rows:
            # Process headers (first row)
            headers = [cell.strip() for cell in table_rows[0].split('|')[1:-1]]
            
            # Check if second row is a separator (contains only -, :, |)
            if len(table_rows) > 1 and all(c in ' -:|' for c in table_rows[1].replace('|', '')):
                data_start = 2
                subheaders = []
            else:
                # Second row might be subheaders
                data_start = 2 if len(table_rows) > 1 else 1
                subheaders = [] if data_start == 1 else [cell.strip() for cell in table_rows[1].split('|')[1:-1]]
            
            # Process data rows
            rows = []
            for i in range(data_start, len(table_rows)):
                cells = [cell.strip() for cell in table_rows[i].split('|')[1:-1]]
                if cells:
                    rows.append(cells)
            
            data["tables"].append({
                "title": title,
                "headers": headers,
                "subheaders": subheaders,
                "rows": rows
            })
    
    # Save the image metadata
    metadata_path = os.path.join(output_dir, "figures_metadata.json")
    with open(metadata_path, "w") as meta_file:
        json.dump(figures_metadata, meta_file, indent=4)
    
    # Save the complete data
    images_json_path = os.path.join(output_dir, "images.json")
    with open(images_json_path, "w") as f:
        json.dump(data, f, indent=2)
    
    return data

async def generate_html(json_data):
    """Generate HTML gallery from JSON data using Mistral API"""
    client = get_mistral_client()
    model = "mistral-large-latest"
    
    prompt = f"""
    Take this json data of tables and Images and generate me a html code to display every relevant image with caption and tables in a well-formatted way.
    
    Data: {json_data}
    """
    
    response = await client.chat.stream_async(
        model=model,
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    
    # Collect all chunks for complete response
    full_response = ""
    async for chunk in response:
        if chunk.data.choices[0].delta.content is not None:
            content = chunk.data.choices[0].delta.content
            full_response += content
    
    return full_response

def save_html_output(html_content, output_path=os.path.join(OUTPUT_DIR, "gallery.html")):
    """Save HTML content to file"""
    # Extract the actual HTML code if needed (in case there's markdown formatting)
    if "```html" in html_content:
        html_content = html_content.split("```html")[1].split("```")[0].strip()
    
    # Write the HTML to a file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    return output_path

def clean_output_dir():
    """Clean the output directory to prepare for new processing"""
    try:
        # Remove all files except subdirectories
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                os.unlink(file_path)
                print(f"Removed file: {file_path}")
    except Exception as e:
        print(f"Error cleaning output directory: {e}")

async def process_and_generate_gallery(document_url=None, file_path=None):
    """Process document, extract content, and generate gallery"""
    try:
        # Clean output directory first
        clean_output_dir()
        
        client = get_mistral_client()
        
        # Process document with OCR
        if document_url:
            ocr_response = client.ocr.process(
                model="mistral-ocr-latest",
                document={
                    "type": "document_url",
                    "document_url": document_url
                },
                include_image_base64=True
            )
        elif file_path:
            with open(file_path, "rb") as f:
                file_content = f.read()
            ocr_response = client.ocr.process(
                model="mistral-ocr-latest",
                document={
                    "type": "document_content",
                    "document_content": base64.b64encode(file_content).decode()
                },
                include_image_base64=True
            )
        else:
            raise ValueError("Either document_url or file_path must be provided")
        
        # Extract and save images and tables
        data = process_ocr_response(ocr_response)
        
        # Generate HTML gallery
        html_content = await generate_html(data)
        
        # Save HTML content
        gallery_path = save_html_output(html_content)
        
        return {
            "data": data,
            "gallery_path": gallery_path
        }
    except Exception as e:
        print(f"Error in process_and_generate_gallery: {str(e)}")
        raise

# API Models
class DocumentUrlRequest(BaseModel):
    document_url: HttpUrl

# API Routes
@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint redirects to gallery or shows welcome message"""
    gallery_path = os.path.join(OUTPUT_DIR, "gallery.html")
    
    if os.path.exists(gallery_path):
        return RedirectResponse(url="/gallery")
    
    return """
    <html>
        <head>
            <title>Academic Paper OCR Gallery</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #333; }
                .endpoints { margin-top: 20px; }
                .endpoint { background: #f5f5f5; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
                code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Academic Paper OCR Gallery</h1>
                <p>This service extracts images and tables from academic papers and creates a visual gallery.</p>
                
                <div class="endpoints">
                    <h2>Available Endpoints:</h2>
                    <div class="endpoint">
                        <h3>Process paper from URL</h3>
                        <p>POST to <code>/process/url</code> with a JSON body containing <code>{"document_url": "https://arxiv.org/pdf/yourpaper.pdf"}</code></p>
                    </div>
                    
                    <div class="endpoint">
                        <h3>View Gallery</h3>
                        <p>GET <code>/gallery</code> to view the generated gallery</p>
                    </div>
                    
                    <div class="endpoint">
                        <h3>API Documentation</h3>
                        <p>Visit <a href="/gallery-docs">/gallery-docs</a> for full API documentation</p>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """

@app.post("/process/url", response_class=JSONResponse)
async def process_document_url(
    background_tasks: BackgroundTasks, 
    request: DocumentUrlRequest
):
    """Process document from URL and extract content"""
    try:
        # Check that Mistral API key is set
        try:
            get_mistral_client()
        except ValueError as e:
            return JSONResponse(
                status_code=500,
                content={"message": f"API configuration error: {str(e)}"}
            )
        
        # Only process if there isn't already a gallery
        data_path = os.path.join(OUTPUT_DIR, "images.json")
        if os.path.exists(data_path):
            return {"message": "Gallery already exists. Access at /gallery"}
            
        # Add task to background
        background_tasks.add_task(
            process_and_generate_gallery, 
            document_url=str(request.document_url)
        )
        return {"message": "Processing started in background. Check /gallery for results."}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error starting processing: {str(e)}"}
        )

@app.post("/process/file", response_class=JSONResponse)
async def process_document_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Process uploaded document file and extract content"""
    # Save uploaded file
    file_path = os.path.join(OUTPUT_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Add task to background
    background_tasks.add_task(
        process_and_generate_gallery, 
        file_path=file_path
    )
    return {"message": "Processing started in background. Check /gallery for results."}

@app.get("/gallery", response_class=HTMLResponse)
async def get_gallery():
    """Serve the gallery HTML file"""
    gallery_path = os.path.join(OUTPUT_DIR, "gallery.html")
    
    if not os.path.exists(gallery_path):
        raise HTTPException(status_code=404, detail="Gallery not found. Process a document first.")
    
    with open(gallery_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    
    return html_content

@app.get("/data", response_class=JSONResponse)
async def get_data():
    """Get the extracted data JSON"""
    data_path = os.path.join(OUTPUT_DIR, "images.json")
    
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="Data not found. Process a document first.")
    
    with open(data_path, "r") as f:
        data = json.load(f)
    
    return data

# Add this import at the top
from fastapi.responses import RedirectResponse

# Main entrypoint
if __name__ == "__main__":
    # Run on port 8001 since 8000 is already in use
    uvicorn.run(app, host="0.0.0.0", port=8001)