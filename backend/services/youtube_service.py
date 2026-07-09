"""
YouTube Service — downloads YouTube videos via yt-dlp.
Uses subprocess.run in a thread executor for Windows compatibility.
"""

import re
import asyncio
import json
import subprocess
import functools
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


def _get_video_info_sync(url: str) -> dict:
    """Fetch video metadata without downloading (sync, runs in executor)."""
    result = subprocess.run(
        ["yt-dlp", "--dump-json", "--no-download", url],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to fetch video info: {result.stderr.strip()}")
    return json.loads(result.stdout)


def _download_video_sync(url: str, output_path: str) -> None:
    """Download video using yt-dlp (sync, runs in executor)."""
    result = subprocess.run(
        [
            "yt-dlp",
            "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "--merge-output-format", "mp4",
            "-o", output_path,
            "--no-playlist",
            "--no-warnings",
            url,
        ],
        capture_output=True,
        text=True,
        timeout=600,  # 10 minute timeout for large videos
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to download video: {result.stderr.strip()}")


async def get_video_info(url: str) -> dict:
    """Fetch video metadata without downloading."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, functools.partial(_get_video_info_sync, url)
    )


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

    # Download in executor
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None, functools.partial(_download_video_sync, url, str(output_path))
    )

    if not output_path.exists():
        raise RuntimeError("Download completed but file not found.")

    return output_path, title
