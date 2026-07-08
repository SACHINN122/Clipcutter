"""
AI Service — uses Gemini 2.5 Flash to detect interesting clip moments from transcript.
"""

import json
from pathlib import Path
from google import genai
from google.genai.types import GenerateContentConfig

from config import GEMINI_API_KEY, GEMINI_MODEL, TRANSCRIPT_DIR, MIN_CLIP_DURATION, MAX_CLIP_DURATION
from models.schemas import ClipTimestamp


SYSTEM_PROMPT = """You are an expert video editor and content strategist. Your job is to analyze a video transcript and identify the most engaging, interesting, and shareable moments that would make great short-form clips (like YouTube Shorts, Instagram Reels, or TikTok).

PRIORITIZE moments that have:
- Strong hooks that grab attention in the first 3 seconds
- Compelling storytelling with a clear narrative arc
- Valuable advice or actionable insights
- Business insights and lessons learned
- Emotional moments that create connection
- Funny or entertaining moments
- Surprising facts or counterintuitive ideas
- Controversial or bold opinions
- Motivational and inspiring moments
- Educational insights that teach something new

AVOID segments that contain:
- Greetings and introductions ("Hey guys, welcome to...")
- Sponsorship reads or ad segments
- Outros and subscription requests
- Long uncomfortable pauses or dead air
- Small talk with no substance
- Filler conversation ("um", "you know", "like")
- Repeated information already covered
- Technical difficulties or off-topic tangents

RULES:
- Each clip should be between {min_duration} and {max_duration} seconds long.
- Aim for 30-60 seconds per clip, but allow up to 90 seconds if the moment truly demands it.
- Choose 5-20 clips depending on how much quality content exists.
- Ensure clips start with a strong hook — never start mid-sentence.
- Ensure clips end at a natural conclusion — never cut off mid-thought.
- Clips should NOT overlap with each other.
- Timestamps must be in seconds (integer or float).
- Provide a short, catchy title for each clip (suitable as a YouTube Shorts title).
- Explain briefly why each moment is interesting.
"""


def _build_user_prompt(transcript: dict) -> str:
    """Build the user prompt with the transcript text."""
    text = transcript["text"]
    duration = transcript.get("duration", 0)

    # Include segment timestamps for context
    segments_text = ""
    for seg in transcript.get("segments", []):
        start = seg["start"]
        end = seg["end"]
        segments_text += f"[{start:.1f}s - {end:.1f}s] {seg['text']}\n"

    return f"""Analyze this video transcript and identify the best moments for short-form clips.

Video Duration: {duration:.0f} seconds ({duration/60:.1f} minutes)

TRANSCRIPT WITH TIMESTAMPS:
{segments_text}

Return a JSON array of the best clip moments. Each clip should have: title, start (seconds), end (seconds), reason."""


async def detect_clips(transcript: dict, job_id: str) -> list[ClipTimestamp]:
    """
    Send transcript to Gemini 2.5 Flash and get back interesting clip timestamps.
    Uses structured output with Pydantic schema.
    """
    client = genai.Client(api_key=GEMINI_API_KEY)

    system_instruction = SYSTEM_PROMPT.format(
        min_duration=MIN_CLIP_DURATION,
        max_duration=MAX_CLIP_DURATION,
    )

    user_prompt = _build_user_prompt(transcript)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_prompt,
        config=GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=list[ClipTimestamp],
            temperature=0.7,
        ),
    )

    clips = response.parsed

    if not clips:
        raise RuntimeError("Gemini returned no clips. The video may not have enough interesting content.")

    # Validate and sanitize timestamps
    video_duration = transcript.get("duration", float("inf"))
    validated = []
    for clip in clips:
        # Clamp to video bounds
        clip.start = max(0, clip.start)
        clip.end = min(video_duration, clip.end)

        # Enforce minimum duration
        if (clip.end - clip.start) < MIN_CLIP_DURATION:
            continue

        # Enforce maximum duration
        if (clip.end - clip.start) > MAX_CLIP_DURATION:
            clip.end = clip.start + MAX_CLIP_DURATION

        validated.append(clip)

    # Sort by start time
    validated.sort(key=lambda c: c.start)

    # Remove overlapping clips (keep the earlier one)
    non_overlapping = []
    for clip in validated:
        if non_overlapping and clip.start < non_overlapping[-1].end:
            continue
        non_overlapping.append(clip)

    # Save AI response
    clips_path = TRANSCRIPT_DIR / f"{job_id}_clips.json"
    with open(clips_path, "w", encoding="utf-8") as f:
        json.dump([c.model_dump() for c in non_overlapping], f, indent=2)

    return non_overlapping
