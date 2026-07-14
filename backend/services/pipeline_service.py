"""
Pipeline Service — orchestrates the full processing pipeline as a background task.
Manages job state and coordinates all services.
"""

import asyncio
import traceback
from datetime import datetime, timezone
from pathlib import Path
from faster_whisper import WhisperModel

from config import AUDIO_DIR
from models.schemas import JobStatus, StepInfo
from services.audio_service import extract_audio
from services.transcription_service import transcribe
from services.ai_service import detect_clips
from services.clip_service import generate_clips
from services.youtube_service import download_video


# In-memory job store (single-user, no persistence needed)
jobs: dict[str, dict] = {}


def create_job(job_id: str, source_type: str, **kwargs) -> dict:
    """Create a new job entry in the store."""
    job = {
        "job_id": job_id,
        "status": JobStatus.PENDING,
        "source_type": source_type,  # "file" or "youtube"
        "video_path": kwargs.get("video_path"),
        "youtube_url": kwargs.get("youtube_url"),
        "video_title": kwargs.get("video_title", ""),
        "created_at": datetime.now(timezone.utc),
        "duration": None,
        "current_step": "Waiting",
        "steps": _build_steps(source_type),
        "clips": [],
        "error": None,
    }
    jobs[job_id] = job
    return job


def _build_steps(source_type: str) -> list[dict]:
    """Build the step list based on input type."""
    steps = []
    if source_type == "youtube":
        steps.append({"name": "Downloading Video", "status": "pending", "message": None})
    steps.extend([
        {"name": "Extracting Audio", "status": "pending", "message": None},
        {"name": "Transcribing Video", "status": "pending", "message": None},
        {"name": "Finding Best Moments", "status": "pending", "message": None},
        {"name": "Generating Clips", "status": "pending", "message": None},
    ])
    return steps


def _update_step(job: dict, step_name: str, status: str, message: str = None):
    """Update a specific step's status."""
    for step in job["steps"]:
        if step["name"] == step_name:
            step["status"] = status
            if message:
                step["message"] = message
            break
    job["current_step"] = step_name


def get_job(job_id: str) -> dict | None:
    """Get job info from the store."""
    return jobs.get(job_id)


def get_processing_status(job_id: str) -> dict | None:
    """Get the current processing status for a job."""
    job = jobs.get(job_id)
    if not job:
        return None
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "current_step": job["current_step"],
        "steps": [StepInfo(**s) for s in job["steps"]],
        "error": job["error"],
        "video_title": job["video_title"],
        "source_type": job["source_type"],
        "created_at": job["created_at"],
        "duration": job["duration"],
    }


async def run_pipeline(job_id: str, whisper_model: WhisperModel):
    """
    Run the full processing pipeline as a background task.

    Steps:
    1. (YouTube only) Download video
    2. Extract audio from video
    3. Transcribe audio with Whisper
    4. Analyze transcript with Gemini AI
    5. Generate video clips with FFmpeg
    """
    job = jobs.get(job_id)
    if not job:
        return

    try:
        # --- Step 0 (YouTube only): Download Video ---
        if job["source_type"] == "youtube":
            job["status"] = JobStatus.DOWNLOADING
            _update_step(job, "Downloading Video", "running", "Downloading from YouTube...")

            video_path, title = await download_video(job["youtube_url"], job_id)
            job["video_path"] = str(video_path)
            job["video_title"] = title

            _update_step(job, "Downloading Video", "completed", f"Downloaded: {title}")

        video_path = Path(job["video_path"])

        # --- Step 1: Extract Audio ---
        job["status"] = JobStatus.EXTRACTING_AUDIO
        _update_step(job, "Extracting Audio", "running", "Extracting audio track...")

        audio_path = AUDIO_DIR / f"{job_id}.wav"
        await extract_audio(video_path, audio_path)

        _update_step(job, "Extracting Audio", "completed", "Audio extracted successfully")

        # --- Step 2: Transcribe ---
        job["status"] = JobStatus.TRANSCRIBING
        _update_step(job, "Transcribing Video", "running", "Running speech-to-text...")

        transcript = await transcribe(audio_path, whisper_model, job_id)
        job["duration"] = transcript.get("duration")

        _update_step(
            job, "Transcribing Video", "completed",
            f"Transcribed {transcript.get('duration', 0):.0f}s of audio"
        )

        # --- Step 3: AI Analysis ---
        job["status"] = JobStatus.ANALYZING
        _update_step(job, "Finding Best Moments", "running", "AI is analyzing transcript...")

        def update_analysis_retry(message: str):
            _update_step(job, "Finding Best Moments", "running", message)

        clip_timestamps = await detect_clips(
            transcript,
            job_id,
            on_retry=update_analysis_retry,
        )

        _update_step(
            job, "Finding Best Moments", "completed",
            f"Found {len(clip_timestamps)} interesting moments"
        )

        # --- Step 4: Generate Clips ---
        job["status"] = JobStatus.GENERATING_CLIPS
        _update_step(job, "Generating Clips", "running", f"Generating {len(clip_timestamps)} clips...")

        clips_info = await generate_clips(video_path, clip_timestamps, job_id)
        job["clips"] = [c.model_dump() for c in clips_info]

        _update_step(job, "Generating Clips", "completed", f"Generated {len(clips_info)} clips")

        # --- Done ---
        job["status"] = JobStatus.COMPLETED
        job["current_step"] = "Complete"

        # --- Cleanup: remove temporary audio file ---
        try:
            audio_path.unlink(missing_ok=True)
        except Exception:
            pass  # Non-critical cleanup

    except Exception as e:
        job["status"] = JobStatus.FAILED
        job["error"] = str(e)
        job["current_step"] = "Failed"

        # Mark current running step as failed
        for step in job["steps"]:
            if step["status"] == "running":
                step["status"] = "failed"
                step["message"] = str(e)
                break

        traceback.print_exc()
