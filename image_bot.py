import os
import re
import uuid
import time
import tempfile
import subprocess
import asyncio
from typing import List, Optional, Dict, Any
import shutil
from pathlib import Path
import traceback
import hashlib

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pyppeteer import launch
import matplotlib.pyplot as plt
from mistralai import Mistral
from dotenv import load_dotenv

print("Starting image_bot.py - Initializing system...")

# Load environment variables
load_dotenv()
print("Environment variables loaded from .env file")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    print("ERROR: MISTRAL_API_KEY environment variable is missing!")
    raise ValueError("MISTRAL_API_KEY environment variable is required")
else:
    print(f"Found MISTRAL_API_KEY: {MISTRAL_API_KEY[:4]}...{MISTRAL_API_KEY[-4:]}")

# Initialize Mistral client
print("Initializing Mistral client...")
mistral_client = Mistral(api_key=MISTRAL_API_KEY)
print("Mistral client initialized successfully")

# Create directories for storing images and code
IMAGES_DIR = Path("images")
CODE_DIR = Path("generated_code")
print(f"Setting up images directory at: {IMAGES_DIR.absolute()}")
print(f"Setting up code directory at: {CODE_DIR.absolute()}")

# Create directories if they don't exist
if not IMAGES_DIR.exists():
    print(f"Directory {IMAGES_DIR} does not exist, creating it...")
    try:
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {IMAGES_DIR}")
    except Exception as e:
        print(f"Error creating directory: {e}")
        # Fallback to a directory we know will work
        IMAGES_DIR = Path.cwd() / "images"
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created fallback directory: {IMAGES_DIR}")
else:
    print(f"Directory {IMAGES_DIR} already exists")

if not CODE_DIR.exists():
    print(f"Directory {CODE_DIR} does not exist, creating it...")
    try:
        CODE_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {CODE_DIR}")
    except Exception as e:
        print(f"Error creating directory: {e}")
        # Fallback to a directory we know will work
        CODE_DIR = Path.cwd() / "generated_code"
        CODE_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created fallback directory: {CODE_DIR}")
else:
    print(f"Directory {CODE_DIR} already exists")

print(f"Images directory ready: {IMAGES_DIR.exists()}")

# Verify the directory is writable
try:
    test_file = IMAGES_DIR / "test_write.tmp"
    test_file.write_text("test")
    test_file.unlink()  # Remove the test file
    print(f"Directory {IMAGES_DIR} is writable")
except Exception as e:
    print(f"WARNING: Directory {IMAGES_DIR} is not writable: {e}")
    # Fallback to a directory we know will work
    IMAGES_DIR = Path.cwd() / "images"
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Using fallback directory: {IMAGES_DIR}")

# Paper context storage (session_id -> paper_content)
PAPER_CONTEXTS = {}
print("In-memory paper context storage initialized")

# Initialize FastAPI
print("Initializing FastAPI application...")
app = FastAPI(title="Image Generation API")
print("FastAPI application initialized")

# Add CORS middleware
print("Setting up CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS middleware configured")

# Serve static files
print(f"Mounting static files directory for images: {str(IMAGES_DIR)}")
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")
print("Static files mounted successfully")

# Request and Response models
print("Defining request and response models...")
class ImageRequest(BaseModel):
    prompt: str
    mode: Optional[str] = None  # can be "html", "graph", or "plot"
    session_id: Optional[str] = None
    document_url: Optional[str] = None

class PaperContextRequest(BaseModel):
    document_url: str
    session_id: str

class ImageResponse(BaseModel):
    image_url: str
    session_id: str
    mode: str
print("Models defined successfully")

# Function to extract text from document URLs using Mistral OCR
def perform_ocr_from_url(url: str) -> str:
    """Call Mistral OCR and extract markdown if available, else fallback to plain text blocks."""
    print(f"Starting OCR extraction from URL: {url}")
    try:
        resp = mistral_client.ocr.process(
            model="mistral-ocr-latest",
            document={"type": "document_url", "document_url": url},
            include_image_base64=False
        )
        print(f"OCR response received, processing content...")
        
        contents: List[str] = []
        page_count = len(getattr(resp, "pages", []))
        print(f"Document has {page_count} pages")
        
        # If response has markdown pages
        for i, page in enumerate(getattr(resp, "pages", [])):
            print(f"Processing page {i+1}/{page_count}")
            md = getattr(page, "markdown", None)
            if md:
                print(f"Page {i+1}: Found markdown content ({len(md)} chars)")
                contents.append(md)
            else:
                # fallback to blocks
                blocks = getattr(page, "blocks", [])
                print(f"Page {i+1}: No markdown, extracting from {len(blocks)} blocks")
                for j, block in enumerate(blocks):
                    text = getattr(block, "text", None)
                    if text:
                        print(f"Page {i+1}, Block {j+1}: Extracted {len(text)} chars")
                        contents.append(text)
        
        full_text = "\n\n".join(contents)
        print(f"OCR extraction complete. Total extracted text: {len(full_text)} chars")
        return full_text
    except Exception as e:
        print(f"ERROR during OCR extraction: {str(e)}")
        raise

# Extract paper summary for context
def extract_paper_summary(paper_text: str) -> str:
    """Extract a concise summary of the paper to use as context."""
    print(f"Generating paper summary from {len(paper_text)} chars of text")
    
    prompt = """
    You are an AI assistant that summarizes academic papers. 
    Please extract the key information from the following paper, 
    focusing on the main research question, methodology, key findings, and conclusions.
    Keep the summary focused on factual information that could be useful for creating visualizations.
    Limit your response to 600 words.
    """
    
    # Use a smaller chunk if the paper is very large
    max_chunk_size = 15000
    if len(paper_text) > max_chunk_size:
        print(f"Paper is large ({len(paper_text)} chars), truncating to {max_chunk_size} chars")
        paper_chunk = paper_text[:max_chunk_size]
    else:
        paper_chunk = paper_text
    
    print("Calling Mistral API to generate paper summary...")
    try:
        resp = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": paper_chunk}
            ],
            temperature=0.1,
            max_tokens=1000
        )
        
        summary = resp.choices[0].message.content
        print(f"Summary generated successfully: {len(summary)} chars")
        return summary
    except Exception as e:
        print(f"ERROR generating summary: {str(e)}")
        raise

# Utility to extract code from LLM response
def extract_code(response: str, tag: str) -> str:
    print(f"Extracting {tag} code from LLM response ({len(response)} chars)")
    pattern = rf"```{tag}(.*?)```"
    match = re.search(pattern, response, re.DOTALL)
    if match:
        code = match.group(1).strip()
        print(f"Successfully extracted {len(code)} chars of {tag} code")
        return code
    else:
        print(f"WARNING: No {tag} code block found in the response")
        return ''

# HTML to PNG conversion
async def html_to_png(html_path, output_path):
    print(f"Converting HTML to PNG: {html_path} -> {output_path}")
    try:
        print("Launching headless browser...")
        browser = await launch(args=['--no-sandbox'])
        print("Browser launched, creating new page...")
        page = await browser.newPage()
        print(f"Loading HTML file: {html_path}")
        await page.goto(f'file://{html_path}')
        print(f"Taking screenshot and saving to: {output_path}")
        await page.screenshot({'path': output_path, 'fullPage': True})
        print("Screenshot taken successfully")
        await browser.close()
        print("Browser closed")
        return output_path
    except Exception as e:
        print(f"ERROR during HTML to PNG conversion: {str(e)}")
        raise

# Templates for different image generation modes
print("Setting up prompt templates for image generation...")
TEMPLATES = {
    'html': (
        "You are an assistant that generates complete and visually pleasing HTML code for layout presentation. "
        "Make sure the layout fills the entire page width in a clean and responsive manner. "
        "Use inline CSS if needed. Add proper spacing, typography, and a headline if appropriate. "
        "Avoid cramped elements and ensure visual balance. "
        "Use the paper context provided to create relevant and accurate visualizations. "
        "Respond with exactly one ```html``` code block, and nothing else.\n\n"
        "Image name: {image_name}\n"
        "Paper context:\n{paper_context}\n\n"
        "User request: {user_query}"
    ),
    'graph': (
        "You are an assistant that writes Python code using graphviz.Digraph to draw a structured diagram. "
        "The code should save a PNG image in the current directory. Do NOT generate a PDF. "
        "Use the paper context provided to create relevant and accurate visualizations. "
        "Respond with exactly one ```python``` code block, and nothing else.\n\n"
        "Image name: {image_name}\n"
        "Paper context:\n{paper_context}\n\n"
        "User request: {user_query}"
    ),
    'plot': (
        "You are an assistant that writes Python code using matplotlib to create charts. "
        "The code should save the figure as a PNG in the current directory. "
        "Use the paper context provided to create relevant and accurate visualizations. "
        "If the paper contains numerical data or statistics, try to incorporate those into your visualization. "
        "Respond with exactly one ```python``` code block, and nothing else.\n\n"
        "Image name: {image_name}\n"
        "Paper context:\n{paper_context}\n\n"
        "User request: {user_query}"
    )
}
print("Templates defined successfully")

# Route request to determine the best visualization mode
def llm_route(prompt: str) -> str:
    print(f"Auto-detecting visualization mode for prompt: '{prompt[:50]}...'")
    routing_prompt = (
        "Classify the user request into one of: html, graph, plot.\n"
        "- html: layout-based visuals (cards, tables, UI)\n"
        "- graph: structured relationships (trees, flowcharts)\n"
        "- plot: numerical/statistical charts\n"
        "Respond with exactly one word (html or graph or plot)."
    )
    try:
        print("Calling Mistral API for visualization mode detection...")
        resp = mistral_client.chat.complete(
            model="mistral-tiny-latest",
            messages=[
                {'role': 'system', 'content': routing_prompt},
                {'role': 'user',   'content': f'User request: {prompt}'}
            ],
            temperature=0.0,
            max_tokens=1
        )
        mode = resp.choices[0].message.content.strip().lower()
        print(f"Mode detection result: '{mode}'")
        return mode
    except Exception as e:
        print(f"ERROR during mode detection: {str(e)}")
        print("Defaulting to 'html' mode due to error")
        return 'html'

# Generate HTML and convert to PNG
async def generate_html_image(prompt: str, output_path: str, paper_context: str = "", image_name: str = "") -> str:
    """Generate HTML visualization for prompt and convert to PNG."""
    print(f"Generating HTML visualization for prompt: '{prompt[:50]}...'")
    print(f"Paper context available: {len(paper_context) > 0}, length: {len(paper_context)} chars")
    print(f"Using image name: {image_name}")
    
    # Use the image name in the template
    template = TEMPLATES['html'].format(
        user_query=prompt, 
        paper_context=paper_context,
        image_name=image_name
    )
    print(f"Template prepared, total length: {len(template)} chars")
    
    try:
        print("Calling Mistral API to generate HTML code...")
        resp = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {'role': 'system', 'content': 'Mode: html'},
                {'role': 'user',   'content': template}
            ],
            temperature=0.2
        )
        print("Response received from Mistral API")
        
        html_code = extract_code(resp.choices[0].message.content, 'html')
        
        if not html_code:
            print("ERROR: No HTML code generated")
            raise ValueError("Failed to generate HTML code")
        
        # Create a persistent filename based on image_name
        filename = f"html_{image_name}.html"
        html_path = CODE_DIR / filename
        
        print(f"Creating HTML file at: {html_path}")
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_code)
        print(f"HTML code written to file ({len(html_code)} chars)")
        
        print("Converting HTML to PNG...")
        # Make sure output_path is directly in IMAGES_DIR
        if not str(output_path).startswith(str(IMAGES_DIR)):
            filename = os.path.basename(output_path)
            output_path = str(IMAGES_DIR / filename)
            print(f"Adjusted output path to be in IMAGES_DIR: {output_path}")
            
        await html_to_png(str(html_path), output_path)
        print(f"HTML successfully converted to PNG: {output_path}")
        
        # Leave the HTML file for reference, don't delete it
        
        return output_path
    except Exception as e:
        print(f"ERROR during HTML generation: {str(e)}")
        traceback.print_exc()
        raise

# Execute Python code to generate image
def execute_python(code: str, output_path: str, image_name: str = "") -> str:
    """Execute Python code to generate image at the specified output path."""
    print(f"Executing Python code to generate image at: {output_path}")
    print(f"Code length: {len(code)} chars")
    print(f"Using image name: {image_name}")
    
    # Ensure output path uses the IMAGES_DIR
    if not str(output_path).startswith(str(IMAGES_DIR)):
        filename = os.path.basename(output_path)
        output_path = str(IMAGES_DIR / filename)
        print(f"Adjusted output path to be in IMAGES_DIR: {output_path}")
    
    # Create a persistent filename based on image_name or timestamp & hash
    if image_name:
        filename = f"python_{image_name}.py"
    else:
        timestamp = int(time.time())
        code_hash = hashlib.md5(code.encode()).hexdigest()[:8]
        filename = f"python_{timestamp}_{code_hash}.py"
        
    py_path = CODE_DIR / filename
    
    # Ensure necessary imports are present
    if 'import matplotlib.pyplot as plt' not in code and 'from matplotlib import pyplot as plt' not in code:
        if 'plt.' in code:
            code = "import matplotlib.pyplot as plt\n" + code
            print("Added matplotlib import")
    
    # Add explicit savefig for matplotlib plots if needed
    if 'plt.' in code and 'plt.savefig' not in code:
        # Use image name for the output filename if provided
        if image_name:
            code = code + f"\nplt.savefig('{image_name}.png')"
            print(f"Added plt.savefig('{image_name}.png')")
        else:
            code = code + f"\nplt.savefig('{os.path.basename(output_path)}')"
            print(f"Added plt.savefig('{os.path.basename(output_path)}')")
    
    # Add render for graphviz if needed
    if 'graphviz' in code:
        # Find the graph object name (usually 'g' or 'graph')
        print("Processing graphviz code")
        match = re.search(r'(\w+)\s*=\s*(?:graphviz\.)?Digraph', code)
        if match:
            graph_name = match.group(1)
            print(f"Found graph object name: {graph_name}")
            
            # Check if render is already present
            if '.render(' not in code:
                print("Adding .render() call")
                # Use image name for the output filename if provided
                if image_name:
                    code = code + f"\n{graph_name}.render('{image_name}', format='png', cleanup=True)"
                    print(f"Added render call: {graph_name}.render('{image_name}', format='png', cleanup=True)")
                else:
                    # Get just the filename without the path for render
                    output_basename = os.path.basename(output_path)
                    # Remove extension for graphviz
                    output_basename_noext = os.path.splitext(output_basename)[0]
                    code = code + f"\n{graph_name}.render('{output_basename_noext}', format='png', cleanup=True)"
                    print(f"Added render call: {graph_name}.render('{output_basename_noext}', format='png', cleanup=True)")
    
    print(f"Creating Python file at: {py_path}")
    with open(py_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Code written to file ({len(code)} chars)")
    
    # Create a copy of the script in IMAGES_DIR for better path resolution
    img_dir_script = IMAGES_DIR / filename
    shutil.copy2(py_path, img_dir_script)
    print(f"Created a copy of the script in IMAGES_DIR: {img_dir_script}")
    
    # Set current working directory temporarily
    original_cwd = os.getcwd()
    try:
        # Change to the IMAGES_DIR directory
        os.chdir(str(IMAGES_DIR))
        print(f"Changed working directory to: {os.getcwd()}")
        
        # Run with higher timeout and capture output
        print(f"Executing Python code from {filename}...")
        process = subprocess.run(
            ['python', filename],
            check=False,  # Don't raise exception on non-zero exit
            timeout=60,   # Give it more time
            capture_output=True,
            text=True
        )
        
        # Print stdout and stderr for debugging
        if process.stdout:
            print(f"STDOUT: {process.stdout}")
        if process.stderr:
            print(f"STDERR: {process.stderr}")
            
        # Check if successful
        if process.returncode == 0:
            print("Python code executed successfully")
        else:
            print(f"WARNING: Python code exited with non-zero status: {process.returncode}")
            # Continue anyway, as the image might still have been created
        
        # Change back to original directory
        os.chdir(original_cwd)
        print(f"Changed working directory back to: {os.getcwd()}")
    except subprocess.TimeoutExpired:
        os.chdir(original_cwd)
        print("ERROR: Python execution timed out after 60 seconds")
    except Exception as e:
        # Change back to original directory on error
        os.chdir(original_cwd)
        print(f"ERROR during Python execution: {str(e)}")
        traceback.print_exc()
    
    # Check for output files regardless of subprocess result
    # Check for various possible filenames based on image_name or output path
    potential_files = [
        output_path,  # Direct path
        IMAGES_DIR / os.path.basename(output_path),  # File in IMAGES_DIR with same basename
    ]
    
    # Add potential files with image_name
    if image_name:
        potential_files.extend([
            IMAGES_DIR / f"{image_name}.png",  # Standard PNG
            IMAGES_DIR / f"{image_name}",  # No extension
            IMAGES_DIR / f"{image_name}.png.png",  # Double extension (graphviz)
        ])
    
    # Add the standard potential files from before
    output_basename = os.path.basename(output_path)
    output_basename_noext = os.path.splitext(output_basename)[0]
    potential_files.extend([
        IMAGES_DIR / f"{output_basename_noext}.png",  # Without extension
        IMAGES_DIR / f"{output_basename}.png",  # With additional .png (graphviz)
    ])
    
    found_file = None
    for file_path in potential_files:
        if os.path.exists(str(file_path)):
            found_file = str(file_path)
            print(f"Found output file at: {found_file}")
            break
    
    if found_file:
        # If we found a file but it's not at the expected output_path, move it there
        if found_file != output_path:
            print(f"Moving file from {found_file} to {output_path}")
            shutil.copy2(found_file, output_path)
    else:
        print(f"WARNING: No output image found at any expected paths")
    
    # Final verification
    if os.path.exists(output_path):
        print(f"Verified output image exists: {output_path}")
        return output_path
    else:
        print(f"ERROR: Failed to generate or find image at {output_path}")
        raise Exception(f"Failed to generate image at {output_path}")

# Generate graph visualization
def generate_graph_image(prompt: str, output_path: str, paper_context: str = "", image_name: str = "") -> str:
    """Generate graph/diagram visualization for prompt."""
    print(f"Generating graph visualization for prompt: '{prompt[:50]}...'")
    print(f"Paper context available: {len(paper_context) > 0}, length: {len(paper_context)} chars")
    print(f"Using image name: {image_name}")
    
    # Use the image name in the template
    template = TEMPLATES['graph'].format(
        user_query=prompt, 
        paper_context=paper_context,
        image_name=image_name
    )
    print(f"Template prepared, total length: {len(template)} chars")
    
    try:
        print("Calling Mistral API to generate graph code...")
        resp = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {'role': 'system', 'content': 'Mode: graph'},
                {'role': 'user',   'content': template}
            ],
            temperature=0.2
        )
        print("Response received from Mistral API")
        
        python_code = extract_code(resp.choices[0].message.content, 'python')
        
        if not python_code:
            print("ERROR: No Python graph code generated")
            raise ValueError("Failed to generate Python graph code")
        
        # Make sure graphviz is imported
        if 'import graphviz' not in python_code:
            python_code = "import graphviz\n" + python_code
            print("Added graphviz import to graph code")
        
        # Make sure output path is used in render call
        output_basename = os.path.basename(output_path)
        output_basename_noext = os.path.splitext(output_basename)[0]
        
        # Let execute_python add the render call if needed
        # Pass the image name to execute_python
        
        print("Executing graph code...")
        return execute_python(python_code, output_path, image_name)
    except Exception as e:
        print(f"ERROR during graph generation: {str(e)}")
        traceback.print_exc()
        # Re-raise the exception
        raise

# Generate plot/chart
def generate_plot_image(prompt: str, output_path: str, paper_context: str = "", image_name: str = "") -> str:
    """Generate plot/chart visualization for prompt."""
    print(f"Generating plot/chart for prompt: '{prompt[:50]}...'")
    print(f"Paper context available: {len(paper_context) > 0}, length: {len(paper_context)} chars")
    print(f"Using image name: {image_name}")
    
    # Use the image name in the template
    template = TEMPLATES['plot'].format(
        user_query=prompt, 
        paper_context=paper_context,
        image_name=image_name
    )
    print(f"Template prepared, total length: {len(template)} chars")
    
    try:
        print("Calling Mistral API to generate plot code...")
        resp = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {'role': 'system', 'content': 'Mode: plot'},
                {'role': 'user',   'content': template}
            ],
            temperature=0.2
        )
        print("Response received from Mistral API")
        
        python_code = extract_code(resp.choices[0].message.content, 'python')
        
        if not python_code:
            print("ERROR: No Python plot code generated")
            raise ValueError("Failed to generate Python plot code")
        
        # Make sure matplotlib is imported
        if 'import matplotlib.pyplot as plt' not in python_code and 'from matplotlib import pyplot as plt' not in python_code:
            python_code = "import matplotlib.pyplot as plt\n" + python_code
            print("Added matplotlib import to plot code")
        
        # Make sure output path is properly handled
        output_basename = os.path.basename(output_path)
        if 'plt.savefig' not in python_code:
            python_code += f"\n\nplt.savefig('{output_basename}')"
            print(f"Added plt.savefig('{output_basename}') to save plot")
        
        print("Executing plot code...")
        # Pass the image name to execute_python
        return execute_python(python_code, output_path, image_name)
    except Exception as e:
        print(f"ERROR during plot generation: {str(e)}")
        traceback.print_exc()
        # Return a fallback image path or re-raise
        raise

print("Defining API endpoints...")

@app.post("/init_session")
async def init_session():
    """Initialize a new session and return a session ID."""
    print("Endpoint called: /init_session")
    session_id = str(uuid.uuid4())
    print(f"New session created with ID: {session_id}")
    return {"session_id": session_id}

@app.post("/add_paper_context")
async def add_paper_context(request: PaperContextRequest):
    """Process a paper URL and add its context to the session."""
    print(f"Endpoint called: /add_paper_context with session_id: {request.session_id}")
    print(f"Document URL: {request.document_url}")
    
    try:
        start_time = time.time()
        print("Starting paper context extraction process...")
        
        # Extract text from paper
        print("Extracting text from paper URL...")
        paper_text = perform_ocr_from_url(request.document_url)
        print(f"Text extraction complete. Text length: {len(paper_text)} chars")
        
        # Extract a summary for use as context
        print("Generating paper summary...")
        paper_summary = extract_paper_summary(paper_text)
        print(f"Summary generated. Summary length: {len(paper_summary)} chars")
        
        # Save in our context storage
        print(f"Storing paper context for session {request.session_id}")
        PAPER_CONTEXTS[request.session_id] = paper_summary
        print(f"Paper context stored successfully. Total contexts stored: {len(PAPER_CONTEXTS)}")
        
        processing_time = time.time() - start_time
        print(f"Paper context added in {processing_time:.2f} seconds for session {request.session_id}")
        
        return {
            "status": "success",
            "session_id": request.session_id,
            "processing_time_seconds": processing_time
        }
    
    except Exception as e:
        print(f"ERROR adding paper context: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image", response_model=ImageResponse)
async def generate_image(request: ImageRequest):
    """Generate an image based on the prompt, mode, and paper context."""
    print(f"Endpoint called: /generate-image")
    print(f"Request details: prompt='{request.prompt[:50]}...', mode={request.mode}, session_id={request.session_id}")
    if request.document_url:
        print(f"Document URL provided: {request.document_url}")
    
    try:
        start_time = time.time()
        
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        if not request.session_id:
            print(f"No session ID provided, generated new ID: {session_id}")
        
        # If a document URL is provided, process it first
        if request.document_url and session_id not in PAPER_CONTEXTS:
            print(f"Processing document URL since context not available for session {session_id}")
            try:
                paper_text = perform_ocr_from_url(request.document_url)
                print(f"Paper text extracted: {len(paper_text)} chars")
                
                paper_summary = extract_paper_summary(paper_text)
                print(f"Paper summary created: {len(paper_summary)} chars")
                
                PAPER_CONTEXTS[session_id] = paper_summary
                print(f"Processed document URL and extracted context for session {session_id}")
            except Exception as e:
                print(f"ERROR extracting paper context: {str(e)}")
                traceback.print_exc()
                # Continue with generation even if context extraction fails
        
        # Get the paper context if available
        paper_context = PAPER_CONTEXTS.get(session_id, "")
        if paper_context:
            print(f"Found paper context for session {session_id}: {len(paper_context)} chars")
        else:
            print(f"No paper context found for session {session_id}")
            if not request.document_url:
                print("WARNING: No paper context and no document URL provided")
        
        # Determine the appropriate mode if not specified
        mode = request.mode
        if not mode:
            print("No visualization mode specified, using auto-detection")
            mode = llm_route(request.prompt)
            print(f"Auto-detected mode: {mode}")
        else:
            print(f"Using specified mode: {mode}")
        
        # Create a unique image name and filename
        timestamp = int(time.time())
        # Create shorter unique ID for the image name (first 8 chars of UUID)
        image_id = str(uuid.uuid4()).split('-')[0]
        image_name = f"{image_id}_{timestamp}"
        filename = f"{image_name}.png"
        output_path = str(IMAGES_DIR / filename)
        print(f"Generated image name: {image_name}")
        print(f"Image will be saved to: {output_path}")
        
        # Generate the image based on the selected mode
        print(f"Starting image generation with mode: {mode}")
        if mode == 'html':
            print("Generating HTML-based visualization...")
            await generate_html_image(request.prompt, output_path, paper_context, image_name)
            print("HTML visualization complete")
        elif mode == 'graph':
            print("Generating graph/diagram visualization...")
            generate_graph_image(request.prompt, output_path, paper_context, image_name)
            print("Graph visualization complete")
        elif mode == 'plot':
            print("Generating plot/chart visualization...")
            generate_plot_image(request.prompt, output_path, paper_context, image_name)
            print("Plot visualization complete")
        else:
            print(f"ERROR: Invalid mode: {mode}")
            raise ValueError(f"Invalid mode: {mode}")
        
        # Create the image URL
        image_url = f"/images/{filename}"
        print(f"Image URL created: {image_url}")
        
        # Verify the file was created successfully
        if not Path(output_path).exists():
            print(f"ERROR: Image file was not created at {output_path}")
            raise Exception("Failed to generate image file")
        else:
            print(f"Successfully verified image file exists at {output_path}")
        
        processing_time = time.time() - start_time
        print(f"Image generated in {processing_time:.2f} seconds using {mode} mode")
        
        return ImageResponse(
            image_url=image_url,
            session_id=session_id,
            mode=mode
        )
    
    except Exception as e:
        print(f"ERROR generating image: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-image/{filename}")
async def get_image(filename: str):
    """Retrieve a generated image by filename."""
    print(f"Endpoint called: /get-image/{filename}")
    file_path = IMAGES_DIR / filename
    print(f"Looking for image at: {file_path}")
    
    if not file_path.exists():
        print(f"ERROR: Image not found at {file_path}")
        raise HTTPException(status_code=404, detail="Image not found")
    
    print(f"Image found, returning file: {file_path}")
    return FileResponse(str(file_path), media_type="image/png")

@app.get("/images/{filename}")
async def direct_image_access(filename: str):
    """Direct access to images for testing."""
    print(f"Direct image access: /images/{filename}")
    file_path = IMAGES_DIR / filename
    if not file_path.exists():
        print(f"ERROR: Image not found at {file_path}")
        raise HTTPException(status_code=404, detail="Image not found")
    
    print(f"Serving image directly: {file_path}")
    return FileResponse(str(file_path), media_type="image/png")

@app.get("/health")
def health_check():
    print("Endpoint called: /health")
    status = {
        "status": "ok",
        "images_dir": str(IMAGES_DIR),
        "images_dir_exists": IMAGES_DIR.exists(),
        "image_count": len(list(IMAGES_DIR.glob("*.png"))) if IMAGES_DIR.exists() else 0,
        "contexts_count": len(PAPER_CONTEXTS)
    }
    print(f"Health check: {status}")
    return status

print("All API endpoints defined")

# Run the server if this file is executed directly
if __name__ == "__main__":
    print("Starting image generation server...")
    import uvicorn
    port = 8004
    print(f"Starting image generation server on port {port}...")
    uvicorn.run("image_bot:app", host="0.0.0.0", port=port, reload=True)
else:
    print("Image bot module imported but not directly executed") 