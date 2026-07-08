"""
ClipForge AI — FastAPI Backend Entry Point.
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager
import asyncio
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from faster_whisper import WhisperModel

from config import WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE, CLIP_DIR
from routes.api import router as api_router


# Global whisper model — loaded once on startup
whisper_model: WhisperModel = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the Whisper model on startup, cleanup on shutdown."""
    global whisper_model

    print(f"Loading Whisper model '{WHISPER_MODEL}' on {WHISPER_DEVICE} ({WHISPER_COMPUTE_TYPE})...")
    whisper_model = WhisperModel(
        WHISPER_MODEL,
        device=WHISPER_DEVICE,
        compute_type=WHISPER_COMPUTE_TYPE,
    )
    print("Whisper model loaded successfully!")

    yield

    # Cleanup
    print("Shutting down...")
    whisper_model = None


app = FastAPI(
    title="ClipForge AI",
    description="Convert long-form videos into engaging short-form clips using AI.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve clips as static files for video preview/streaming
CLIP_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/clips", StaticFiles(directory=str(CLIP_DIR)), name="clips")

# Register API routes
app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "ClipForge AI Backend is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
