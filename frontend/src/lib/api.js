/**
 * API client for Clipo AI backend.
 */

const API_BASE = 'http://localhost:8001';

/**
 * Upload a video file with progress tracking.
 */
export function uploadVideo(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `${API_BASE}/api/upload`);
    xhr.send(formData);
  });
}

/**
 * Submit a YouTube URL for processing.
 */
export async function submitYouTubeUrl(url) {
  const res = await fetch(`${API_BASE}/api/youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit YouTube URL');
  }

  return res.json();
}

/**
 * Start the processing pipeline for a job.
 */
export async function startProcessing(jobId) {
  const res = await fetch(`${API_BASE}/api/generate/${jobId}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to start processing');
  }

  return res.json();
}

/**
 * Get all processing jobs.
 */
export async function getAllJobs() {
  const res = await fetch(`${API_BASE}/api/jobs`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to get jobs');
  }

  return res.json();
}

/**
 * Get current processing status.
 */
export async function getStatus(jobId) {
  const res = await fetch(`${API_BASE}/api/status/${jobId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to get status');
  }

  return res.json();
}

/**
 * Get all generated clips for a job.
 */
export async function getClips(jobId) {
  const res = await fetch(`${API_BASE}/api/clips/${jobId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to get clips');
  }

  return res.json();
}

/**
 * Get the download URL for a clip.
 */
export function getDownloadUrl(jobId, filename) {
  return `${API_BASE}/api/download/${jobId}/${filename}`;
}

/**
 * Get the full URL for a static asset (thumbnail, video preview).
 */
export function getStaticUrl(path) {
  return `${API_BASE}${path}`;
}

/**
 * List available caption style variations.
 */
export async function getCaptionStyles() {
  const res = await fetch(`${API_BASE}/api/caption-styles`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load caption styles');
  }
  return res.json();
}

/**
 * Burn captions into a clip with the requested style (on-demand, no AI).
 */
export async function generateCaptions(jobId, clipId, style) {
  const res = await fetch(
    `${API_BASE}/api/captions/${jobId}/${clipId}?style=${encodeURIComponent(style)}`,
    { method: 'POST' },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate captions');
  }

  return res.json();
}
