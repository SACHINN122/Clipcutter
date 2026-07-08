"""
Audio Service — extracts audio from video using FFmpeg.
"""

import asyncio
from pathlib import Path


async def extract_audio(video_path: Path, output_path: Path) -> Path:
    """
    Extract audio from a video file as 16kHz mono WAV (optimal for Whisper).
    Uses asyncio subprocess to avoid blocking the event loop.
    """
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-i", str(video_path),
        "-vn",              # No video
        "-ar", "16000",     # 16kHz sample rate (Whisper optimal)
        "-ac", "1",         # Mono
        "-f", "wav",        # WAV format
        "-y",               # Overwrite output
        str(output_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        error_msg = stderr.decode().strip().split("\n")[-1]
        raise RuntimeError(f"FFmpeg audio extraction failed: {error_msg}")

    if not output_path.exists():
        raise RuntimeError("Audio extraction completed but output file not found.")

    return output_path
