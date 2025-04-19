# Podcast Generator API

A FastAPI-based backend for generating engaging podcasts from documents and web pages.

## Features

- Convert documents/web pages into engaging podcast-style conversations
- Customizable host and guest voices
- Automatic transcript generation
- Download generated podcasts in MP3 format

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up your environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file and add your Mistral API key.

## Configuration

All configurations are stored in two places:

1. `.env` file - Contains API keys and server settings
2. `config.py` - Contains TTS settings, file paths, and prompt templates

## Usage

### Start the API server

```
python podcast_api.py
```

or

```
uvicorn podcast_api:app --host 0.0.0.0 --port 8000 --reload
```

### Test the API

You can test the API using the included test script:

```
python test_podcast_api.py
```

### API Endpoints

1. **Generate Podcast** - `POST /generate-podcast/`
   ```bash
   curl -X POST "http://localhost:8000/generate-podcast/" \
     -H "Content-Type: application/json" \
     -d '{"document_url": "https://arxiv.org/pdf/2402.18679", "prompt_modifiers": {"tone": "fun and engaging", "length": "Medium (3-5 min)"}}'
   ```

2. **Download Podcast** - `GET /podcast/{filename}`
   ```bash
   curl -X GET "http://localhost:8000/podcast/podcast.mp3" --output podcast.mp3
   ```

3. **Upload Document** - `POST /upload-document/`
   ```bash
   curl -X POST "http://localhost:8000/upload-document/" \
     -F "file=@your_document.pdf"
   ```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Customization

You can customize the podcast generation by modifying:

1. **Prompt Modifiers** in API requests:
   - `tone`: Sets the tone of the podcast (e.g., "fun", "serious", "conversational")
   - `length`: Sets the podcast length, choose from "Short (1-2 min)", "Medium (3-5 min)", or "Long (10-15 min)"
   - `language`: Sets the output language
   - `question`: Adds a specific question to be answered in the podcast

2. **Configuration Files**:
   - Change speaker voices by updating the `TTS_CONFIG` settings in `config.py`
   - Modify prompt templates in `PODCAST_SYSTEM_PROMPT`
   - Adjust output file paths in the `PATHS` dictionary
