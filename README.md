# Clipo AI 🎬

**Turn long videos into scroll-stopping short clips with AI.**

Clipo is a local-first AI clip studio that turns long-form video into
social-ready short clips. Add a video file or a YouTube URL, and let the
pipeline transcribe the source, find the high-retention moments, and export
the clips for you.

---

## ✨ Features

- **Multiple inputs** — upload MP4, MOV, MKV, or AVI files, or paste a YouTube URL.
- **Local transcription** — speech-to-text with Faster Whisper, including word-level timestamps.
- **AI moment detection** — Gemini finds the strongest hooks, stories, insights, and emotional beats.
- **Auto clip generation** — FFmpeg cuts the selected moments and exports them as downloadable clips.
- **Job dashboard** — a responsive React UI to create, track, preview, and download jobs.

---

## 🛠 Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React, Vite, Tailwind CSS   |
| Backend    | FastAPI, Uvicorn, Pydantic  |
| Transcription | Faster Whisper / CTranslate2 |
| AI analysis | Google GenAI (Gemini)      |
| Video processing | FFmpeg, yt-dlp        |

---

## 📋 Requirements

- Python **3.10+**
- Node.js **18+**
- **FFmpeg** available on your system `PATH`
- A **Gemini API key**
- *(Optional, recommended)* An NVIDIA GPU with CUDA for faster transcription

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/SACHINN122/ClipcutterAvailable.git
cd ClipcutterAvailable
```

### 2. Set up the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Set up the frontend

```powershell
cd frontend
npm install
npm run dev
```

### 4. Run it

Start the backend (it also serves the clips):

```powershell
cd backend
python main.py
```

Open the app at **http://127.0.0.1:5173**.
The API runs at **http://127.0.0.1:8000** and its docs are at **http://127.0.0.1:8000/docs**.

---

## 🔄 How the Pipeline Works

1. Create a job by uploading a file or pasting a YouTube link.
2. Start processing from the dashboard.
3. The source is downloaded (if YouTube), audio is extracted, and speech is transcribed.
4. Gemini ranks the most clip-worthy moments from the transcript.
5. FFmpeg cuts the clips and generates thumbnails.
6. Preview or download the exported clips from the results screen.

---

## 📡 API Overview

| Method      | Endpoint             | Description |
|-------------|----------------------|------------------|
| `POST` | `/api/upload` | Upload a video and create a job |
| `POST` | `/api/youtube` | Create a job from a YouTube URL |
| `POST` | `/api/generate/{job_id}` | Start the processing pipeline |
| `GET` | `/api/status/{job_id}` | Read live job and step status |
| `GET` | `/api/clips/{job_id}` | List completed clips |
| `GET` | `/api/download/{job_id}/{filename}` | Download an exported clip |

---

## 📁 Project Structure

```
backend/
├── routes/
│   └── api.py              # HTTP endpoints
├── services/
│   ├── upload_service.py   # File upload handling
│   ├── youtube_service.py  # YouTube video download
│   ├── audio_service.py    # Extract audio from video
│   ├── transcription_service.py  # Whisper-based STT
│   ├── ai_service.py       # Gemini AI analysis
│   ├── clip_service.py     # FFmpeg clip generation
│   └── pipeline_service.py # Job orchestration
├── models/
│   └── schemas.py          # Pydantic request/response models
├── main.py                 # FastAPI app entry point
└── config.py               # Application configuration

frontend/
├── src/
│   ├── components/
│   │   ├── Upload.jsx      # Video upload UI
│   │   ├── Processing.jsx  # Job tracking dashboard
│   │   ├── Results.jsx     # Generated clips view
│   │   └── Player.jsx      # Video player
│   └── main.jsx            # React root component
├── index.html              # HTML entry point
└── vite.config.js          # Vite configuration

Runtime data (auto-created):
├── uploads/                 # Original video files
├── clips/                   # Generated short clips
├── transcripts/             # Transcription outputs
├── audio/                   # Extracted audio files
└── temp/                    # Temporary processing files
```

---

## ⚙️ GPU / CUDA Setup (Recommended for faster-whisper)

For best transcription performance, an NVIDIA GPU with CUDA support is recommended.

```powershell
# Step 1: Install latest NVIDIA drivers
# Download from https://www.nvidia.com/Download/index.aspx
# Verify with: nvidia-smi in Command Prompt

# Step 2: Install CUDA Toolkit
# Download from https://developer.nvidia.com/cuda-downloads
# Or via Chocolatey: choco install cuda --version=12.4.0

# Step 3: Install cuDNN
# Download from https://developer.nvidia.com/rdp/cudnn-download
# Extract to your CUDA installation's bin folder

# Step 4: Verify installation
python -c "import torch; print(f'PyTorch CUDA available: {torch.cuda.is_available()}')"
# Should output: PyTorch CUDA available: True

# Step 5: Confirm .env settings
# WHISPER_DEVICE=cuda
# WHISPER_COMPUTE_TYPE=float16
```

### Why This Matters
- Without CUDA support, transcription uses CPU which is **5-10x slower**
- GPU acceleration enables real-time transcription and faster processing of long videos
- The system falls back to CPU automatically if no GPU is detected

---

## 🔧 Environment Variables Reference

All configurable settings are loaded from `.env` in your project root.

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | `""` | Your Gemini API key (required) |
| `WHISPER_MODEL` | `"small"` | Model: `"small"`, `"base"`, `"medium"`, `"large-v1/v2/v3"` |
| `WHISPER_DEVICE` | `"cuda"` | Device: `"cuda"` or `"cpu"` |
| `WHISPER_COMPUTE_TYPE` | `"float16"` | Precision: `"float16"` (GPU), `"int8"` (CPU) |
| `GEMINI_MAX_RETRIES` | `4` | Retry attempts for API failures |
| `GEMINI_RETRY_BASE_SECONDS` | `2.0` | Base delay before retry |
| `GEMINI_RETRY_MAX_SECONDS` | `30.0` | Maximum retry delay |

### Performance Tuning Tips
- Low VRAM GPU → `WHISPER_MODEL=small` with `WHISPER_COMPUTE_TYPE=float16`
- Best accuracy → `WHISPER_MODEL=large-v3` on GPU
- CPU-only → `WHISPER_DEVICE=cpu` and `WHISPER_COMPUTE_TYPE=int8`

---

## ⚠️ Notes

- Jobs are held in application memory; restarting the backend clears job state
- Processing time varies with source duration, hardware, and API latency
- This project is intended for local development and personal MVP use