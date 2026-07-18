"""
API Routes for Clipo AI.
"""

import asyncio
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from config import CLIP_DIR
from models.schemas import (
    UploadResponse,
    YouTubeRequest,
    ProcessingStatus,
    ClipInfo,
    JobStatus,
    StepInfo,
)
from services.upload_service import save_upload
from services.youtube_service import validate_youtube_url
from services.pipeline_service import (
    create_job,
    get_job,
    get_processing_status,
    run_pipeline,
    jobs,
)
from services.caption_service import generate_captioned_clip, list_styles


router = APIRouter(prefix="/api")


@router.post("/upload", response_model=UploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file and create a processing job."""
    job_id, file_path = await save_upload(file)

    create_job(
        job_id,
        source_type="file",
        video_path=str(file_path),
        video_title=file.filename,
    )

    return UploadResponse(
        job_id=job_id,
        filename=file.filename,
        status=JobStatus.PENDING,
    )


@router.post("/youtube", response_model=UploadResponse)
async def submit_youtube_url(request: YouTubeRequest):
    """Accept a YouTube URL and create a processing job."""
    url = validate_youtube_url(request.url)

    # Generate job ID
    import uuid
    job_id = uuid.uuid4().hex[:12]

    create_job(
        job_id,
        source_type="youtube",
        youtube_url=url,
        video_title="YouTube Video",
    )

    return UploadResponse(
        job_id=job_id,
        filename="YouTube Video",
        status=JobStatus.PENDING,
    )


@router.post("/generate/{job_id}")
async def start_processing(job_id: str):
    """Trigger the processing pipeline for a job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] not in (JobStatus.PENDING,):
        raise HTTPException(
            status_code=400,
            detail=f"Job is already {job['status'].value}. Cannot start again."
        )

    # Get the whisper model from app state
    from main import whisper_model

    # Launch pipeline as a background task
    asyncio.create_task(run_pipeline(job_id, whisper_model))

    return {"message": "Processing started", "job_id": job_id}


@router.get("/status/{job_id}", response_model=ProcessingStatus)
async def get_status(job_id: str):
    """Get current processing status for a job."""
    status = get_processing_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@router.get("/clips/{job_id}", response_model=list[ClipInfo])
async def get_clips(job_id: str):
    """Get all generated clips for a job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed yet. Current status: {job['status'].value}"
        )

    return [ClipInfo(**c) for c in job["clips"]]


@router.get("/caption-styles")
async def caption_styles():
    """List available caption style variations."""
    return list_styles()


@router.post("/captions/{job_id}/{clip_id}")
async def create_captions(job_id: str, clip_id: int, style: str = "classic"):
    """
    Burn word-level captions into a clip using the requested style.

    On-demand and additive: the original clip is untouched and the captioned
    version is returned separately. No AI call is made.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed yet. Current status: {job['status'].value}"
        )

    clip = next((c for c in job["clips"] if c["id"] == clip_id), None)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    try:
        result = generate_captioned_clip(job_id, clip_id, style)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Point the clip at the captioned file so the frontend just swaps the URL.
    clip["filename"] = result.filename
    clip["video_url"] = result.video_url

    return ClipInfo(**clip)


@router.get("/download/{job_id}/{filename}")
async def download_clip(job_id: str, filename: str):
    """Download a specific clip file."""
    clip_path = CLIP_DIR / job_id / filename

    if not clip_path.exists():
        raise HTTPException(status_code=404, detail="Clip not found")

    # Security: ensure the path doesn't escape the clips directory
    try:
        clip_path.resolve().relative_to(CLIP_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        path=str(clip_path),
        filename=filename,
        media_type="video/mp4",
    )
