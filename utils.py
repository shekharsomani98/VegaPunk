import json
from pathlib import Path
import re

def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError(f"❌ Invalid JSON format in file: {path}")

    if isinstance(parsed, str):
        try:
            parsed = json.loads(parsed)
        except json.JSONDecodeError:
            raise ValueError(f"❌ File contains a string, but it's not valid JSON inside: {path}")

    return parsed

def save_json(data, path: Path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def extract_json(text):
            match = re.search(r'```json(.*?)```', text, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError as e:
                    print(f"JSON Decoding Error: {e}")
                    return None
            else:
                # Try to directly parse if it's already JSON
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    print("No JSON block found in the agent output and direct parsing failed.")
                    return None