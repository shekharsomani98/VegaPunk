from pathlib import Path
from typing import Dict, Any

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

config = Config()