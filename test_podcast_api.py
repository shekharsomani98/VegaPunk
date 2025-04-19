import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API endpoint
API_URL = "http://0.0.0.0:8000"

# 1. Generate a podcast from a URL
def generate_podcast():
    url = f"{API_URL}/generate-podcast/"
    payload = {
        "document_url": "https://arxiv.org/pdf/2402.18679",
        "prompt_modifiers": {
            "tone": "fun and engaging",
            "length": "Medium (3-5 min)",
            "language": "English"
        }
    }
    
    print(f"Sending request to {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, json=payload)
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Podcast generated successfully!")
        print(f"Podcast URL: {result['podcast_url']}")
        print(f"Transcript URL: {result['transcript_url']}")
        return result
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

# 2. Download the generated podcast
def download_podcast(podcast_filename="podcast.mp3"):
    url = f"{API_URL}/podcast/{podcast_filename}"
    
    print(f"Downloading podcast from {url}")
    response = requests.get(url)
    
    if response.status_code == 200:
        output_file = f"downloaded_{podcast_filename}"
        with open(output_file, "wb") as f:
            f.write(response.content)
        print(f"Podcast downloaded as '{output_file}'")
    else:
        print(f"Error downloading podcast: {response.status_code}")
        print(response.text)

# Execute the requests
if __name__ == "__main__":
    print("Testing Podcast Generator API...")
    result = generate_podcast()
    if result:
        # Extract filename from the podcast_url
        podcast_filename = result["podcast_url"].split("/")[-1]
        download_podcast(podcast_filename)