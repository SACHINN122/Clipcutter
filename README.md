# Clipcutter AI 🎬

Clipcutter is a local-first AI clip studio for turning long-form video into
social-ready short clips. Add a video file or YouTube URL, then let the
pipeline transcribe the source, identify high-retention moments, and export
the resulting clips.

## What it does

- Accepts MP4, MOV, MKV, and AVI uploads, plus YouTube URLs.
- Transcribes speech locally with Faster Whisper and word-level timestamps.
- Uses Gemini to find strong hooks, stories, insights, and emotional beats.
- Cuts selected moments with FFmpeg and makes them available to preview or download.
- Provides a responsive React dashboard for creating and tracking jobs.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Uvicorn, Pydantic |
| Transcription | Faster Whisper / CTranslate2 |
| AI analysis | Google GenAI (Gemini) |
| Video processing | FFmpeg, yt-dlp |

## Requirements

- Python 3.10 or later
- Node.js 18 or later
- FFmpeg available on your system `PATH`
- A Gemini API key
- An NVIDIA GPU with CUDA is optional, but recommended for transcription speed

## Quick start

Clone the repository and configure the backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the project root (or configure the equivalent runtime
environment variable):

```env
GEMINI_API_KEY=your_api_key_here
```

Start the API in one terminal:

```powershell
cd backend
python main.py
```

Install and start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173. The API runs at http://127.0.0.1:8000 and its
interactive documentation is available at http://127.0.0.1:8000/docs.

## How the pipeline works

1. Create a job by uploading a file or supplying a YouTube link.
2. Start processing from the dashboard.
3. The source is downloaded if needed, audio is extracted, and speech is transcribed.
4. Gemini ranks clip-worthy moments from the transcript.
5. FFmpeg creates the clips and thumbnails.
6. Preview or download the exported clips from the results screen.

## API overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/upload` | Upload a video and create a job |
| `POST` | `/api/youtube` | Create a job from a YouTube URL |
| `POST` | `/api/generate/{job_id}` | Start the processing pipeline |
| `GET` | `/api/status/{job_id}` | Read live job and step status |
| `GET` | `/api/clips/{job_id}` | List completed clips |
| `GET` | `/api/download/{job_id}/{filename}` | Download an exported clip |

## Project structure

```text
backend/              FastAPI service and processing pipeline
  routes/             HTTP endpoints
  services/           Upload, YouTube, transcription, AI, and clip services
  models/             API schemas
frontend/             React dashboard
  src/components/     Upload, processing, results, and player UI
uploads/              Local source uploads (runtime data)
clips/                Generated clips (runtime data)
transcripts/          Generated transcripts (runtime data)
```

## Notes

- Jobs are currently held in application memory, so restarting the backend
  clears job state.
- Processing time varies with source duration, hardware, and model/API latency.
- This project is intended for local development and personal MVP use.
