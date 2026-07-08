"""
Transcription Service — runs faster-whisper for speech-to-text with timestamps.
"""

import asyncio
import json
import functools
from pathlib import Path
from faster_whisper import WhisperModel

from config import TRANSCRIPT_DIR


def _transcribe_sync(audio_path: str, model: WhisperModel) -> dict:
    """
    Run Whisper transcription synchronously.
    This is called via run_in_executor to avoid blocking the event loop.
    """
    segments_raw, info = model.transcribe(
        audio_path,
        word_timestamps=True,
        vad_filter=True,       # Filter out silence for better timestamps
        vad_parameters=dict(
            min_silence_duration_ms=500,
        ),
    )

    segments = []
    full_text_parts = []

    for segment in segments_raw:
        seg_data = {
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip(),
        }

        # Include word-level timestamps if available
        if segment.words:
            seg_data["words"] = [
                {
                    "word": w.word.strip(),
                    "start": round(w.start, 2),
                    "end": round(w.end, 2),
                }
                for w in segment.words
            ]

        segments.append(seg_data)
        full_text_parts.append(segment.text.strip())

    return {
        "text": " ".join(full_text_parts),
        "segments": segments,
        "language": info.language,
        "duration": info.duration,
    }


async def transcribe(audio_path: Path, model: WhisperModel, job_id: str) -> dict:
    """
    Transcribe audio file using faster-whisper.
    Runs in a thread executor to keep the event loop responsive.
    Saves transcript JSON for debugging/reuse.
    """
    loop = asyncio.get_running_loop()

    # Run the CPU/GPU-heavy transcription in a thread
    result = await loop.run_in_executor(
        None,  # Uses default ThreadPoolExecutor
        functools.partial(_transcribe_sync, str(audio_path), model),
    )

    # Save transcript to disk
    transcript_path = TRANSCRIPT_DIR / f"{job_id}_transcript.json"
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return result
