"""
Centralized configuration for ClipForge AI backend.
Reads settings from environment variables / .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

# --- Directory Paths ---
UPLOAD_DIR = PROJECT_ROOT / "uploads"
AUDIO_DIR = PROJECT_ROOT / "audio"
TRANSCRIPT_DIR = PROJECT_ROOT / "transcripts"
CLIP_DIR = PROJECT_ROOT / "clips"
TEMP_DIR = PROJECT_ROOT / "temp"

# Create directories on import
for d in [UPLOAD_DIR, AUDIO_DIR, TRANSCRIPT_DIR, CLIP_DIR, TEMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# --- Whisper Settings ---
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cuda")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")

# --- Gemini Settings ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash"

# --- Clip Constraints ---
MIN_CLIP_DURATION = 15   # seconds
MAX_CLIP_DURATION = 120  # seconds
TARGET_CLIP_MIN = 5
TARGET_CLIP_MAX = 20

# --- Upload Constraints ---
MAX_UPLOAD_SIZE_GB = 5
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_GB * 1024 * 1024 * 1024
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".mkv", ".avi"}

# --- YouTube Constraints ---
MAX_YOUTUBE_DURATION = 3 * 60 * 60  # 3 hours in seconds
