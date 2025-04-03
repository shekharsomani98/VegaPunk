# import requests
# import json

# # Base URL of your FastAPI application
# BASE_URL = "http://localhost:8000"

# def test_analyze_url():
#     url = f"{BASE_URL}/analyze/url"
#     data = {
#         "url": "https://arxiv.org/pdf/2003.08934.pdf",
#         "student_level": "2"  # 2 for Masters student
#     }
#     response = requests.post(url, data=data)
    
#     print("URL Analysis Response:")
#     # print(json.dumps(response.json(), indent=2))
#     print(f"Status Code: {response.status_code}")

    
# def test_analyze_pdf():
#     url = f"{BASE_URL}/analyze/pdf"
#     pdf_file_path = "path/to/your/paper.pdf"  # Replace with the path to your PDF file
    
#     with open(pdf_file_path, "rb") as pdf_file:
#         files = {"file": ("paper.pdf", pdf_file, "application/pdf")}
#         data = {"student_level": "3"}  # 3 for Undergraduate student
        
#         response = requests.post(url, files=files, data=data)
    
#     print("\nPDF Analysis Response:")
#     print(json.dumps(response.json(), indent=2))
#     print(f"Status Code: {response.status_code}")

# if __name__ == "__main__":
#     test_analyze_url()
#     # test_analyze_pdf()


import requests
import json
import os
import time
from pathlib import Path

# Base URL for the FastAPI application
BASE_URL = "http://localhost:8000"

# Create necessary directories if they don't exist
os.makedirs("test_files", exist_ok=True)

def test_full_workflow():
    print("Starting full workflow test...")
    
    # Step 1: Analyze URL for prerequisites
    print("\n1. Testing /analyze/url endpoint...")
    analyze_url_response = requests.post(
        f"{BASE_URL}/analyze/url",
        data={
            "url": "https://arxiv.org/pdf/1706.03762",
            "student_level": "2"  # Masters student
        }
    )
    
    if analyze_url_response.status_code == 200:
        print("✅ URL analysis successful")
        prerequisites = analyze_url_response.json()["prerequisites"]
        print(f"Found {len(prerequisites)} prerequisite categories")
    else:
        print(f"❌ URL analysis failed: {analyze_url_response.text}")
        return
    
    # Step 2: Extract template layout
    print("\n2. Testing /extract-template-layout endpoint...")
    # First, ensure we have a template file to work with
    if not os.path.exists("data/upload/template.pptx"):
        print("⚠️ Template file not found. Please place a template.pptx file in data/upload directory.")
        return
        
    extract_layout_response = requests.post(
        f"{BASE_URL}/extract-template-layout",
        data={"template_name": "template.pptx"}
    )
    
    if extract_layout_response.status_code == 200:
        print("✅ Template layout extraction successful")
    else:
        print(f"❌ Template layout extraction failed: {extract_layout_response.text}")
        return
    
    # Step 3: Convert placeholders
    print("\n3. Testing /convert-placeholders endpoint...")
    convert_placeholders_response = requests.post(
        f"{BASE_URL}/convert-placeholders",
        data={"layout_extracted_path": "data/metadata/layout_details.json"}
    )
    
    if convert_placeholders_response.status_code == 200:
        print("✅ Placeholder conversion successful")
    else:
        print(f"❌ Placeholder conversion failed: {convert_placeholders_response.text}")
        return
    
    # Step 4: OCR on URL for figures
    print("\n4. Testing /ocr-figure-url endpoint...")
    ocr_url_response = requests.post(
        f"{BASE_URL}/ocr-figure-url",
        data={"document_url": "https://arxiv.org/pdf/1706.03762"}
    )
    
    if ocr_url_response.status_code == 200:
        print("✅ OCR on URL successful")
        ocr_response = ocr_url_response.json()["ocr_response"]
    else:
        print(f"❌ OCR on URL failed: {ocr_url_response.text}")
        return
    
    # Step 5: Save figures from OCR
    print("\n5. Testing /save-figures endpoint...")
    save_figures_response = requests.post(
        f"{BASE_URL}/save-figures",
        json=ocr_response
    )
    
    if save_figures_response.status_code == 200:
        print("✅ Figure saving successful")
        print(f"Saved {len(save_figures_response.json()['figures_metadata'])} figures")
    else:
        print(f"❌ Figure saving failed: {save_figures_response.text}")
        return
    
    # Step 6: Generate slide data
    print("\n6. Testing /slide-data-gen endpoint...")
    slide_data_response = requests.post(
        f"{BASE_URL}/slide-data-gen",
        data={
            "student_level": "masters student",
            "document_url": "https://arxiv.org/pdf/1706.03762",
            "num_slides": 15
        }
    )
    
    if slide_data_response.status_code == 200:
        print("✅ Slide data generation successful")
    else:
        print(f"❌ Slide data generation failed: {slide_data_response.text}")
        return
    
    # Step 7: Process slides data
    print("\n7. Testing /process-slides-data endpoint...")
    process_slides_response = requests.post(f"{BASE_URL}/process-slides-data")
    
    if process_slides_response.status_code == 200:
        print("✅ Slide processing successful")
    else:
        print(f"❌ Slide processing failed: {process_slides_response.text}")
        return
    
    # Step 8: Execute agent parsing
    print("\n8. Testing /execution-agent-parsing endpoint...")
    execution_agent_response = requests.post(
        f"{BASE_URL}/execution-agent-parsing",
        data={"template_name": "template.pptx"}
    )
    
    if execution_agent_response.status_code == 200:
        print("✅ Execution agent parsing successful")
    else:
        print(f"❌ Execution agent parsing failed: {execution_agent_response.text}")
        return
    
    # Step 9: Generate presentation
    print("\n9. Testing /generate-presentation endpoint...")
    generate_presentation_response = requests.post(
        f"{BASE_URL}/generate-presentation",
        data={
            "template_name": "template.pptx",
            "execution_json_filename": "execution_agent.json",
            "output_ppt_filename": "test_presentation.pptx",
            "processed_layout_filename": "processed_layout.json"
        }
    )
    
    if generate_presentation_response.status_code == 200:
        print("✅ Presentation generation successful")
    else:
        print(f"❌ Presentation generation failed: {generate_presentation_response.text}")
        return
    
    # Step 10: Download the presentation
    print("\n10. Testing /download-presentation endpoint...")
    download_response = requests.get(
        f"{BASE_URL}/download-presentation",
        params={"filename": "test_presentation.pptx"}
    )
    
    if download_response.status_code == 200:
        # Save the downloaded file
        download_path = Path("data/output/test_presentation.pptx")
        with open(download_path, "wb") as f:
            f.write(download_response.content)
        print(f"✅ Presentation download successful. Saved to {download_path}")
    else:
        print(f"❌ Presentation download failed: {download_response.text}")
        return
    
    print("\n🎉 Full workflow test completed successfully!")

def test_individual_endpoint(endpoint, data=None, json_data=None, method="post"):
    """Test an individual endpoint"""
    print(f"\nTesting {endpoint} endpoint...")
    
    if method.lower() == "get":
        if data:
            response = requests.get(f"{BASE_URL}/{endpoint}", params=data)
        else:
            response = requests.get(f"{BASE_URL}/{endpoint}")
    else:
        if json_data:
            response = requests.post(f"{BASE_URL}/{endpoint}", json=json_data)
        else:
            response = requests.post(f"{BASE_URL}/{endpoint}", data=data)
    
    if response.status_code == 200:
        print(f"✅ {endpoint} successful")
        return response.json()
    else:
        print(f"❌ {endpoint} failed: {response.text}")
        return None

if __name__ == "__main__":
    # Test the full workflow
    test_full_workflow()
