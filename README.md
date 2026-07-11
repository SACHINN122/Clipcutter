# Clipcutter AI 🎬

ClipForge AI is a modular, local-first web application that automatically converts long-form videos (or YouTube URLs) into highly engaging, short-form clips using AI. It handles the entire pipeline: downloading, audio extraction, transcription, intelligent moment detection, and video clipping—all tailored to run locally with GPU acceleration.

## 🚀 Features

- **Dual Ingestion**: Upload local video files (MP4, MKV, MOV, AVI) or simply provide a YouTube URL.
- **Fast, Local Transcription**: Uses `faster-whisper` (Small model) running on CUDA for high-speed, local speech-to-text with word-level timestamps.
- **AI Highlight Detection**: Leverages Gemini 2.5 Flash to strategically identify the most engaging, viral-worthy moments (hooks, storytelling, emotional beats).
- **Automated Clipping**: Uses FFmpeg stream copying (lossless and instant) to slice the long-form video into perfectly timed shorts.
- **Modern UI**: A beautifully crafted, responsive React frontend utilizing TailwindCSS, glassmorphic elements, and smooth state transitions.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), TailwindCSS v4, Axios
- **Backend**: FastAPI, Uvicorn, Python 3.10+
- **AI & Processing**: Faster Whisper (CTranslate2), Google GenAI SDK (Gemini), FFmpeg, yt-dlp

## 📦 Prerequisites

1. **Python 3.10+** (with pip)
2. **Node.js** (v18+ recommended)
3. **FFmpeg**: Must be installed and accessible in your system's PATH.
4. **NVIDIA GPU** (Optional but highly recommended): CUDA 12 toolkit installed for faster-whisper acceleration.

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd clipcutter
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# If you have an NVIDIA GPU, install CUDA dependencies for faster-whisper
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12
```

Create a `.env` file in the `backend` directory:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

Start the backend server:
```bash
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎮 Usage

1. Open your browser and navigate to `http://localhost:5173`.
2. Choose either to **Upload a File** or paste a **YouTube URL**.
3. Click **Generate Clips**.
4. The pipeline will automatically download, transcribe, analyze, and clip the video.
5. Once complete, preview and download your AI-curated shorts!

## 📜 License
This project is for personal MVP use.
