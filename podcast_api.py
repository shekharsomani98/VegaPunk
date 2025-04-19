from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from melo.api import TTS
from pydub import AudioSegment
import shutil
from pathlib import Path
import importlib.metadata
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import configs
from config import (
    TTS_CONFIG,
    PATHS,
    PODCAST_SYSTEM_PROMPT,
    PAUSE_DURATION,
    QUESTION_MODIFIER,
    TONE_MODIFIER,
    LANGUAGE_MODIFIER,
    LENGTH_MODIFIERS
)

from mistralai import Mistral

# Get Mistral API key from .env file
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
if not MISTRAL_API_KEY:
    print("WARNING: MISTRAL_API_KEY not found in .env file. API calls will fail.")

# Ensure podcast directory exists
Path("podcast").mkdir(exist_ok=True)
Path("data/metedata").mkdir(parents=True, exist_ok=True)

# Models
class DialogueItem(BaseModel):
    speaker: str  
    text: str

class PodcastDialogue(BaseModel):
    scratchpad: str
    name_of_guest: str
    dialogue: List[DialogueItem]

class PodcastRequest(BaseModel):
    document_url: str
    prompt_modifiers: Optional[Dict[str, str]] = None

class PodcastResponse(BaseModel):
    podcast_url: str
    transcript_url: str
    dialogue: PodcastDialogue

# Initialize FastAPI
app = FastAPI(title="Podcast Generator API", 
              description="API for generating podcasts from documents",
              version=importlib.metadata.version("fastapi"))

# Initialize Mistral client
if not MISTRAL_API_KEY:
    print("WARNING: MISTRAL_API_KEY is not set. API calls will fail.")
else:
    print(f"Initializing Mistral client with API key: {MISTRAL_API_KEY[:5]}...")
    
client = Mistral(api_key=MISTRAL_API_KEY) if MISTRAL_API_KEY else None

def generate_podcast(document_url: str, prompt_modifiers: Optional[Dict[str, str]] = None):
    """Generate podcast from document URL"""
    
    # Check if Mistral client is initialized
    if not client:
        raise ValueError("Mistral client is not initialized. Please set MISTRAL_API_KEY.")
    
    print(f"Generating podcast from document URL: {document_url}")
    
    # Create system prompt with modifiers if provided
    system_prompt = PODCAST_SYSTEM_PROMPT
    
    # Apply standard modifiers
    if prompt_modifiers:
        print("Applying prompt modifiers:")
        # Handle question modifier
        if "question" in prompt_modifiers:
            question_text = prompt_modifiers.get("question", "")
            if question_text:
                modified_text = f"{QUESTION_MODIFIER} {question_text}"
                system_prompt = system_prompt + "\n\n" + modified_text
                print(f"  - Added question: {modified_text}")
        
        # Handle tone modifier
        if "tone" in prompt_modifiers:
            tone_text = prompt_modifiers.get("tone", "")
            if tone_text:
                modified_text = f"{TONE_MODIFIER} {tone_text}"
                system_prompt = system_prompt + "\n\n" + modified_text
                print(f"  - Added tone: {modified_text}")
        
        # Handle language modifier
        if "language" in prompt_modifiers:
            language_text = prompt_modifiers.get("language", "")
            if language_text:
                modified_text = f"{LANGUAGE_MODIFIER} {language_text}"
                system_prompt = system_prompt + "\n\n" + modified_text
                print(f"  - Added language: {modified_text}")
        
        # Handle length modifier
        if "length" in prompt_modifiers:
            length_key = prompt_modifiers.get("length", "")
            length_text = LENGTH_MODIFIERS.get(length_key, "")
            if length_text:
                system_prompt = system_prompt + "\n\n" + length_text
                print(f"  - Added length: {length_text}")
        
        # Handle any other custom modifiers
        for key, value in prompt_modifiers.items():
            if key not in ["question", "tone", "language", "length"] and key in system_prompt:
                old_text = key
                new_text = value
                system_prompt = system_prompt.replace(old_text, new_text)
                print(f"  - Replaced '{old_text}' with '{new_text}'")
    
    print(f"Final prompt length: {len(system_prompt)} characters")
    
    try:
        # Generate dialogue using Mistral
        print("Calling Mistral API...")
        response = client.chat.parse(
            model="mistral-large-latest",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": system_prompt},
                    {"type": "document_url", "document_url": document_url}
                ]
            }],
            response_format=PodcastDialogue
        )
        
        print("Received response from Mistral API")
        dialogue_text = response.choices[0].message.content
        
        # Save dialogue to file
        print(f"Saving dialogue to {PATHS['podcast_data']}")
        with open(PATHS["podcast_data"], 'w') as file:
            json.dump(dialogue_text, file, indent=2)
        
        # Load dialogue from file (sometimes needed to handle JSON string within JSON)
        with open(PATHS["podcast_data"], "r") as file:
            dialogue_json = json.load(file)
        
        # Handle nested JSON if needed
        if isinstance(dialogue_json, str):
            print("Dialogue is a string, parsing as JSON")
            dialogue_json = json.loads(dialogue_json)
        
        print(f"Dialogue loaded with {len(dialogue_json.get('dialogue', []))} items")
        print(f"Guest name: {dialogue_json.get('name_of_guest', 'Unknown')}")
    except Exception as e:
        print(f"Error in Mistral API call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in Mistral API call: {str(e)}")

    # Create audio segments and transcript
    audio_segments = []
    transcript = ""

    # Create TTS model once to avoid reloading
    print(f"Initializing TTS model with language={TTS_CONFIG['language']}, device={TTS_CONFIG['device']}")
    model = TTS(language=TTS_CONFIG["language"], device=TTS_CONFIG["device"])
    
    # Get available speaker IDs from the model
    available_speakers = model.hps.data.spk2id
    print(f"Available speaker IDs: {available_speakers}")
    
    for i, line in enumerate(dialogue_json.get("dialogue", [])):
        speaker = line.get("speaker", "Unknown")
        text = line.get("text", "")
        
        print(f"Processing dialogue item {i+1}/{len(dialogue_json.get('dialogue', []))}: {speaker[:10]}...")
        
        # Add to transcript
        if speaker == "Jane":
            transcript += f"**Host**: {text}\n\n"
        else:
            transcript += f"**{dialogue_json.get('name_of_guest', 'Guest')}**: {text}\n\n"

        # Set speaker ID from config
        try:
            if speaker == "Jane":
                speaker_id = model.hps.data.spk2id[TTS_CONFIG["host_speaker_id"]]
                print(f"Using host speaker ID: {TTS_CONFIG['host_speaker_id']} -> {speaker_id}")
            else:
                speaker_id = model.hps.data.spk2id[TTS_CONFIG["guest_speaker_id"]]
                print(f"Using guest speaker ID: {TTS_CONFIG['guest_speaker_id']} -> {speaker_id}")

            # Generate speech segment
            temp_file = PATHS["temp_segment_format"].format(i)
            print(f"Generating audio for segment {i+1} to {temp_file}")
            model.tts_to_file(
                text=text,
                speaker_id=speaker_id,
                output_path=temp_file,
                sdp_ratio=TTS_CONFIG["sdp_ratio"],
                noise_scale=TTS_CONFIG["noise_scale"],
                noise_scale_w=TTS_CONFIG["noise_scale_w"],
                speed=TTS_CONFIG["speed"]
            )
            
            # Combine audio files
            print(f"Loading audio segment from {temp_file}")
            segment = AudioSegment.from_file(temp_file)
            audio_segments.append(segment)
            
            # Add pause between segments
            print(f"Adding {PAUSE_DURATION}ms pause")
            pause = AudioSegment.silent(duration=PAUSE_DURATION)
            audio_segments.append(pause)
        except Exception as e:
            print(f"Error processing segment {i}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing segment {i}: {str(e)}")

    # Combine and save audio segments
    if audio_segments:
        print(f"Combining {len(audio_segments)} audio segments")
        combined_audio = sum(audio_segments)
        
        print(f"Exporting podcast to {PATHS['podcast_output']}")
        combined_audio.export(PATHS["podcast_output"], format="mp3")
        
        # Save transcript
        print(f"Saving transcript to {PATHS['transcript_output']}")
        with open(PATHS["transcript_output"], "w") as f:
            f.write(transcript)
    else:
        print("No audio segments generated")
    
    print("Podcast generation completed successfully")
    return {
        "podcast_url": PATHS["podcast_output"],
        "transcript_url": PATHS["transcript_output"],
        "dialogue": dialogue_json
    }

@app.post("/generate-podcast/", response_model=PodcastResponse)
async def create_podcast(background_tasks: BackgroundTasks, request: PodcastRequest):
    """
    Generate a podcast from a document URL.
    
    - **document_url**: URL to the document (e.g., PDF, web page)
    - **prompt_modifiers**: Optional modifiers for the system prompt
    """
    try:
        print(f"Received podcast generation request for URL: {request.document_url}")
        # Run podcast generation
        result = generate_podcast(request.document_url, request.prompt_modifiers)
        return result
    except Exception as e:
        print(f"Error generating podcast: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate podcast: {str(e)}")

@app.get("/podcast/{filename}")
async def get_podcast(filename: str):
    """Get podcast file"""
    file_path = f"podcast/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Podcast not found")
    return FileResponse(file_path)

@app.post("/upload-document/")
async def upload_document(file: UploadFile = File(...)):
    """Upload document for podcast generation"""
    try:
        # Save uploaded file
        file_path = f"data/upload/{file.filename}"
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"filename": file.filename, "path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("podcast_api:app", host="0.0.0.0", port=8000, reload=True) 