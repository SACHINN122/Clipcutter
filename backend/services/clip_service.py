"""
Clip Service — generates video clips and thumbnails using FFmpeg.
"""

import asyncio
from pathlib import Path

from config import CLIP_DIR
from models.schemas import ClipTimestamp, ClipInfo


async def _generate_single_clip(
    video_path: Path,
    clip: ClipTimestamp,
    clip_index: int,
    output_dir: Path,
) -> tuple[Path, float]:
    """Generate a single clip using FFmpeg stream copy (fast, lossless)."""
    clip_filename = f"clip_{clip_index:02d}.mp4"
    clip_path = output_dir / clip_filename
    duration = clip.end - clip.start

    # Try stream copy first (fast, no quality loss)
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-ss", str(clip.start),
        "-i", str(video_path),
        "-t", str(duration),
        "-c", "copy",          # Stream copy — no re-encoding
        "-avoid_negative_ts", "make_zero",
        "-y",
        str(clip_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    # If stream copy fails, fall back to re-encoding
    if proc.returncode != 0 or not clip_path.exists():
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-ss", str(clip.start),
            "-i", str(video_path),
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",       # High quality
            "-c:a", "aac",
            "-b:a", "192k",
            "-y",
            str(clip_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()

        if proc.returncode != 0:
            error_msg = stderr.decode().strip().split("\n")[-1]
            raise RuntimeError(f"FFmpeg clip generation failed for clip {clip_index}: {error_msg}")

    return clip_path, duration


async def _generate_thumbnail(clip_path: Path, output_dir: Path, clip_index: int) -> Path:
    """Generate a thumbnail image from the clip (frame at 1 second)."""
    thumb_filename = f"thumb_{clip_index:02d}.jpg"
    thumb_path = output_dir / thumb_filename

    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-i", str(clip_path),
        "-ss", "1",            # Capture frame at 1 second
        "-vframes", "1",       # Only 1 frame
        "-q:v", "2",           # High quality JPEG
        "-y",
        str(thumb_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()

    # If thumbnail at 1s fails (clip shorter than 1s), try at 0s
    if not thumb_path.exists():
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-i", str(clip_path),
            "-ss", "0",
            "-vframes", "1",
            "-q:v", "2",
            "-y",
            str(thumb_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

    return thumb_path


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

    clips_info = []

    for i, ts in enumerate(timestamps, start=1):
        # Generate clip
        clip_path, duration = await _generate_single_clip(
            video_path, ts, i, output_dir
        )

        # Generate thumbnail
        thumb_path = await _generate_thumbnail(clip_path, output_dir, i)

        clip_info = ClipInfo(
            id=i,
            title=ts.title,
            filename=clip_path.name,
            duration=round(duration, 1),
            thumbnail_url=f"/static/clips/{job_id}/{thumb_path.name}",
            video_url=f"/static/clips/{job_id}/{clip_path.name}",
        )
        clips_info.append(clip_info)

    return clips_info
