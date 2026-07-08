"""
YouTube Service — downloads YouTube videos via yt-dlp.
"""

import re
import asyncio
import json
from pathlib import Path
from fastapi import HTTPException

from config import UPLOAD_DIR, MAX_YOUTUBE_DURATION


YOUTUBE_URL_PATTERN = re.compile(
    r"(https?://)?(www\.)?"
    r"(youtube\.com/(watch\?v=|shorts/|embed/|v/)|youtu\.be/)"
    r"[\w\-]+"
)


def validate_youtube_url(url: str) -> str:
    """Validate that the URL is a valid YouTube URL."""
    url = url.strip()
    if not YOUTUBE_URL_PATTERN.match(url):
        raise HTTPException(
            status_code=400,
            detail="Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link."
        )
    return url


async def get_video_info(url: str) -> dict:
    """Fetch video metadata without downloading."""
    proc = await asyncio.create_subprocess_exec(
        "yt-dlp",
        "--dump-json",
        "--no-download",
        url,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        error_msg = stderr.decode().strip()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch video info: {error_msg}"
        )

    return json.loads(stdout.decode())


async def download_video(url: str, job_id: str) -> tuple[Path, str]:
    """
    Download a YouTube video using yt-dlp.
    Returns (file_path, video_title).
    """
    url = validate_youtube_url(url)

    # Get video info first to check duration
    info = await get_video_info(url)
    duration = info.get("duration", 0)
    title = info.get("title", "YouTube Video")

    if duration > MAX_YOUTUBE_DURATION:
        hours = MAX_YOUTUBE_DURATION // 3600
        raise HTTPException(
            status_code=400,
            detail=f"Video is too long ({duration // 60} min). Maximum allowed is {hours} hours."
        )

    output_path = UPLOAD_DIR / f"{job_id}.mp4"

    # Download best quality MP4 up to 1080p
    proc = await asyncio.create_subprocess_exec(
        "yt-dlp",
        "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", str(output_path),
        "--no-playlist",
        "--no-warnings",
        url,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        error_msg = stderr.decode().strip()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download video: {error_msg}"
        )

    if not output_path.exists():
        raise HTTPException(
            status_code=500,
            detail="Download completed but file not found."
        )

    return output_path, title
