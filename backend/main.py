"""
Clipo AI — FastAPI Backend Entry Point.
"""

import os
import sys
from pathlib import Path

# --- Add NVIDIA CUDA DLLs to PATH (required on Windows for ctranslate2/faster-whisper) ---
# Must happen before any imports that load CUDA (ctranslate2, faster_whisper)
_venv_nvidia = Path(__file__).parent / "venv" / "Lib" / "site-packages" / "nvidia"
if _venv_nvidia.exists() and sys.platform == "win32":
    _dll_dirs = []
    for subdir in _venv_nvidia.iterdir():
        bin_dir = subdir / "bin"
        if bin_dir.exists():
            _dll_dirs.append(str(bin_dir))
            os.add_dll_directory(str(bin_dir))
    if _dll_dirs:
        os.environ["PATH"] = ";".join(_dll_dirs) + ";" + os.environ.get("PATH", "")

from contextlib import asynccontextmanager

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
    title="Clipo AI",
    description="Convert long-form videos into engaging short-form clips using AI.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server.
# Vite auto-increments the port when the default is busy (5173, 5174, 5175, ...),
# so allow a range of local dev ports on both localhost and 127.0.0.1.
_DEV_PORTS = [3000, 4173, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 8080]
_DEV_ORIGINS = [f"http://localhost:{p}" for p in _DEV_PORTS] + [f"http://127.0.0.1:{p}" for p in _DEV_PORTS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_DEV_ORIGINS,
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
    return {"message": "Clipo AI Backend is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
