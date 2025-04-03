import json
from pathlib import Path

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