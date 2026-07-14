"""
Pydantic models for request/response schemas and internal data structures.
"""

from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    UPLOADING = "uploading"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    GENERATING_CLIPS = "generating_clips"
    COMPLETED = "completed"
    FAILED = "failed"


# --- Request Models ---

class YouTubeRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")


# --- Response Models ---

class UploadResponse(BaseModel):
    job_id: str
    filename: str
    status: JobStatus = JobStatus.PENDING


class StepInfo(BaseModel):
    name: str
    status: str  # "pending", "running", "completed", "failed"
    message: Optional[str] = None


class ProcessingStatus(BaseModel):
    job_id: str
    status: JobStatus
    current_step: str
    steps: list[StepInfo]
    error: Optional[str] = None
    video_title: str = ""
    source_type: str = "file"
    created_at: datetime
    duration: Optional[float] = None


class ClipTimestamp(BaseModel):
    """Schema for Gemini AI response — describes one interesting clip."""
    title: str = Field(..., description="Short, catchy title for the clip")
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    reason: str = Field(..., description="Why this moment is interesting")


class ClipInfo(BaseModel):
    """Metadata for a generated clip, returned to the frontend."""
    id: int
    title: str
    filename: str
    duration: float
    thumbnail_url: str
    video_url: str
