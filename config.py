from pathlib import Path
from typing import Dict, Any
import os

class Config:
    def __init__(self):
        self.BASE_DIR = Path(__file__).parent
        self.TEMPLATE_METADATA_DIR = self.BASE_DIR / "data" / "metadata"
        self.FIGURES_DIR = self.BASE_DIR / "data" / "figures"
        self.FORMULAS_DIR = self.BASE_DIR / "data" / "formulas"
        self.PRESENTATION_TEMPLATE_DIR = self.BASE_DIR / "data" / "upload"
        # Ensure directories exist
        self.TEMPLATE_METADATA_DIR.mkdir(parents=True, exist_ok=True)
        self.PRESENTATION_TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
        self.FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        self.FORMULAS_DIR.mkdir(parents=True, exist_ok=True)
        self.student_levels = {
            "1": "PhD researcher",
            "2": "Master's student", 
            "3": "Undergrad student"
        }
        self.STUDENT_LEVEL=str(1)
        


    def get_paths(self) -> Dict[str, Any]:
        return {
            "template_metadata": str(self.TEMPLATE_METADATA_DIR),
            "figures": str(self.FIGURES_DIR),
            "formulas": str(self.FORMULAS_DIR),
            "student_level": self.student_levels[self.STUDENT_LEVEL],
            "template_dir": str(self.PRESENTATION_TEMPLATE_DIR),
        }

# API keys
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")

# TTS Configuration
TTS_CONFIG = {
    "language": "EN",
    "device": "cpu",
    "host_speaker_id": "EN-AU",  # Female voice for host
    "guest_speaker_id": "EN-US",  # Male voice for guest
    "sdp_ratio": 0.8,       # Attention control parameter
    "noise_scale": 0.6,     # Noise for variance adaptor
    "noise_scale_w": 0.8,   # Noise for duration predictor
    "speed": 1.0            # Speech speed
}

# File paths
PATHS = {
    "podcast_data": "data/metedata/podcast_data.json",
    "podcast_output": "podcast/podcast.mp3",
    "transcript_output": "podcast/transcript.md",
    "temp_segment_format": "podcast/segment_{}.mp3"
}

# System prompt and modifiers
PODCAST_SYSTEM_PROMPT = """
You are a world-class podcast producer tasked with transforming the provided input text into an engaging and informative podcast script. The input may be unstructured or messy, sourced from PDFs or web pages. Your goal is to extract the most interesting and insightful content for a compelling podcast discussion.

# Steps to Follow:

1. **Analyze the Input:**
   Carefully examine the text, identifying key topics, points, and interesting facts or anecdotes that could drive an engaging podcast conversation. Disregard irrelevant information or formatting issues.

2. **Brainstorm Ideas:**
   In the `<scratchpad>`, creatively brainstorm ways to present the key points engagingly. Consider:
   - Analogies, storytelling techniques, or hypothetical scenarios to make content relatable
   - Ways to make complex topics accessible to a general audience
   - Thought-provoking questions to explore during the podcast
   - Creative approaches to fill any gaps in the information

3. **Craft the Dialogue:**
   Develop a natural, conversational flow between the host (Jane) and the guest speaker (the author or an expert on the topic). Incorporate:
   - The best ideas from your brainstorming session
   - Clear explanations of complex topics
   - An engaging and lively tone to captivate listeners
   - A balance of information and entertainment

   Rules for the dialogue:
   - The host (Jane) always initiates the conversation and interviews the guest
   - Include thoughtful questions from the host to guide the discussion
   - Incorporate natural speech patterns, including occasional verbal fillers (e.g., "um," "well," "you know")
   - Allow for natural interruptions and back-and-forth between host and guest
   - Ensure the guest's responses are substantiated by the input text, avoiding unsupported claims
   - Maintain a PG-rated conversation appropriate for all audiences
   - Avoid any marketing or self-promotional content from the guest
   - The host concludes the conversation

4. **Summarize Key Insights:**
   Naturally weave a summary of key points into the closing part of the dialogue. This should feel like a casual conversation rather than a formal recap, reinforcing the main takeaways before signing off.

5. **Maintain Authenticity:**
   Throughout the script, strive for authenticity in the conversation. Include:
   - Moments of genuine curiosity or surprise from the host
   - Instances where the guest might briefly struggle to articulate a complex idea
   - Light-hearted moments or humor when appropriate
   - Brief personal anecdotes or examples that relate to the topic (within the bounds of the input text)

6. **Consider Pacing and Structure:**
   Ensure the dialogue has a natural ebb and flow:
   - Start with a strong hook to grab the listener's attention
   - Gradually build complexity as the conversation progresses
   - Include brief "breather" moments for listeners to absorb complex information
   - End on a high note, perhaps with a thought-provoking question or a call-to-action for listeners

IMPORTANT RULE: Each line of dialogue should be no more than 100 characters (e.g., can finish within 5-8 seconds)

For short length podcasts, keep the length of the podcast to 1-2 minutes. Around 10 dialogue lines.
For medium length podcasts, keep the length of the podcast to 3-5 minutes. Around 23 dialogue lines.
For long length podcasts, keep the length of the podcast to 10-15 minutes. Around 50 dialogue lines.

Add more questions to the dialogue to keep the conversation engaging.
Give the output in a json format
"""

QUESTION_MODIFIER = "PLEASE ANSWER THE FOLLOWING QN:"
TONE_MODIFIER = "TONE: The tone of the podcast should be"
LANGUAGE_MODIFIER = "OUTPUT LANGUAGE <IMPORTANT>: The the podcast should be"
LENGTH_MODIFIERS = {
    "Short (1-2 min)": "Keep the podcast brief, around 1-2 minutes long.",
    "Medium (3-5 min)": "Aim for a moderate length, about 3-5 minutes.",
    "Long (10-15 min)": "Aim for a longer podcast, around 10-15 minutes.",
}

# Pause configuration
PAUSE_DURATION = 200  # 500ms pause between segments

config = Config()