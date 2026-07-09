"""
Clip Service — generates video clips and thumbnails using FFmpeg.
Uses subprocess.run in a thread executor for Windows compatibility.
"""

import asyncio
import subprocess
import functools
from pathlib import Path

from config import CLIP_DIR
from models.schemas import ClipTimestamp, ClipInfo


def _run_ffmpeg_sync(args: list[str], timeout: int = 120) -> subprocess.CompletedProcess:
    """Run an FFmpeg command synchronously (called via executor)."""
    return subprocess.run(
        ["ffmpeg"] + args,
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def _generate_single_clip_sync(
    video_path: str,
    start: float,
    end: float,
    clip_path: str,
) -> None:
    """Generate a single clip using FFmpeg (sync, runs in executor)."""
    duration = end - start

    # Try stream copy first (fast, no quality loss)
    result = _run_ffmpeg_sync([
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        "-y",
        clip_path,
    ])

    # If stream copy fails, fall back to re-encoding
    if result.returncode != 0 or not Path(clip_path).exists():
        result = _run_ffmpeg_sync([
            "-ss", str(start),
            "-i", video_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-c:a", "aac",
            "-b:a", "192k",
            "-y",
            clip_path,
        ])
        if result.returncode != 0:
            last_line = result.stderr.strip().split("\n")[-1]
            raise RuntimeError(f"FFmpeg clip generation failed: {last_line}")


def _generate_thumbnail_sync(clip_path: str, thumb_path: str) -> None:
    """Generate a thumbnail from a clip (sync, runs in executor)."""
    # Try at 1 second mark
    result = _run_ffmpeg_sync([
        "-i", clip_path,
        "-ss", "1",
        "-vframes", "1",
        "-q:v", "2",
        "-y",
        thumb_path,
    ])

    # If that fails (clip shorter than 1s), try at 0s
    if not Path(thumb_path).exists():
        _run_ffmpeg_sync([
            "-i", clip_path,
            "-ss", "0",
            "-vframes", "1",
            "-q:v", "2",
            "-y",
            thumb_path,
        ])


async def generate_clips(
    video_path: Path,
    timestamps: list[ClipTimestamp],
    job_id: str,
) -> list[ClipInfo]:
    """
    Generate all video clips and thumbnails from the timestamps.
    Returns a list of ClipInfo with URLs for the frontend.
    """
    output_dir = CLIP_DIR / job_id
    output_dir.mkdir(parents=True, exist_ok=True)
    loop = asyncio.get_running_loop()

    clips_info = []

    for i, ts in enumerate(timestamps, start=1):
        clip_filename = f"clip_{i:02d}.mp4"
        clip_path = output_dir / clip_filename
        duration = ts.end - ts.start

        # Generate clip in executor
        await loop.run_in_executor(
            None,
            functools.partial(
                _generate_single_clip_sync,
                str(video_path), ts.start, ts.end, str(clip_path),
            ),
        )

        # Generate thumbnail in executor
        thumb_filename = f"thumb_{i:02d}.jpg"
        thumb_path = output_dir / thumb_filename
        await loop.run_in_executor(
            None,
            functools.partial(
                _generate_thumbnail_sync, str(clip_path), str(thumb_path),
            ),
        )

        clip_info = ClipInfo(
            id=i,
            title=ts.title,
            filename=clip_filename,
            duration=round(duration, 1),
            thumbnail_url=f"/static/clips/{job_id}/{thumb_filename}",
            video_url=f"/static/clips/{job_id}/{clip_filename}",
        )
        clips_info.append(clip_info)

    return clips_info
