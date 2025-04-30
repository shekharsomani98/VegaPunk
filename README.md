# 🎓 VegaPunk: From Research Paper to Presentation with a Few Clicks

**VegaPunk** is an intelligent tool that helps you convert your **PDF or research paper URL** into a well-structured **PowerPoint presentation** effortlessly.

With just a few clicks, users can:
- Select content type and slide length according to their needs
- Listen to an **auto-generated podcast** summarizing the paper
- Extract **tables, charts, and formulas**
- Use a **live chatbot** tailored to the specific paper for interactive Q&A
- Leverage AI **agents** to generate reliable, well-designed presentations with minimal effort

---

## 🛠️ Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/Rishbah-76/VegaPunk
cd VegaPunk
```

### 2. Setup Frontend (Presentation App)
```bash
cd presentation_app_two
npm install
npm start
```

---

## 🧠 Setup Python Backend (Two Separate Conda Environments)

> Make sure you're back in the **VegaPunk root directory** before proceeding.
```bash
cd ..
```
---

### 🔹 A. Base Environment (for `app` and `podcast`)
```bash
conda env create -f environment_base.yaml -n papergen
# If this fails, try the manual steps below
```

<details>
<summary>🔧 Manual Setup If Above Fails</summary>

```bash
# Step 1: Create and activate environment
conda create -n papergen python=3.9
conda activate papergen

# Step 2: Setup MeloTTS
git clone https://github.com/myshell-ai/MeloTTS.git
cd MeloTTS
pip install -e .
python -m unidic download
cd ..

# Step 3: Install Python dependencies
pip install -r melotts_requirements.txt

> 💡 If you run into system issues, try:
- brew install ... (macOS)
- apt-get install ... (Ubuntu)
- .exe installer or pip install ... (Windows)

```
</details>

---

### 🔸 B. Advanced Environment (for `chat_bot` and `imager`)
```bash
conda env create -f environment_advance.yaml -n papergen_adv
```

---

## 🔑 API Key & Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```
MISTRAL_API_KEY=your_own_api_key_here
MODEL_NAME=mistral-small-latest
EXECUTION_AGENT_ID=ag:b3a9e6f1:20250329:execution-agent:8bfa62a0
MODEL_NAME_OCR=mistral-ocr-latest
ENHANCE_AGENT_ID=ag:b3a9e6f1:20250403:untitled-agent:e4afc82a

SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

> 🔐 Make sure to use your own valid `MISTRAL_API_KEY`.

---

## 🚀 Running the Full System (In Separate Terminals)

Run each of the following in its **own terminal window**:

### ➤ Base Environment (`papergen`)
```bash
# Terminal 1: Main API
conda activate papergen
uvicorn app:app --port 8000 --reload

# Terminal 2: Podcast Generator
conda activate papergen
uvicorn podcast_api:app --port 8002 --reload
```

### ➤ Advanced Environment (`papergen_adv`)
```bash
# Terminal 3: Image & Table Extractor
conda activate papergen_adv
uvicorn imager:app --port 8001 --reload

# Terminal 4: Chatbot for Q&A Interaction
conda activate papergen_adv
uvicorn chat_bot:app --port 8003 --reload
```

---

## 🔄 Upcoming Features

- ⚡ **Faster PPT generation**
- 🧠 **RL + Agent-based layout optimization**
- 🌍 **Multilingual podcast voices with natural tone**
- 📊 **Smart table & image embedding into slides**
