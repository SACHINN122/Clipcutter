import { useState, useEffect } from 'react';
import { getClips, getDownloadUrl, getStaticUrl } from '../lib/api';
import StudioHeader from './StudioHeader';
import VideoPlayer from './VideoPlayer';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ClipCard({ clip, jobId, onPlay }) {
  const thumbUrl = getStaticUrl(clip.thumbnail_url);
  const downloadUrl = getDownloadUrl(jobId, clip.filename);

  return (
    <article className="clip-card fade-in-up">
      <button
        type="button"
        className="group block w-full text-left"
        onClick={() => onPlay(clip)}
      >
        <div className="relative aspect-video overflow-hidden bg-black/40">
          <img
            src={thumbUrl}
            alt={clip.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="clip-chip">Clip {String(clip.id).padStart(2, '0')}</span>
            <span className="clip-chip">{formatDuration(clip.duration)}</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md">
              <svg className="ml-1 h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug">
            {clip.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Ready for preview, download, or a quick rewatch.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex-1 justify-center" onClick={() => onPlay(clip)}>
            Preview
          </button>
          <a
            href={downloadUrl}
            download
            className="btn-download flex-1 justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ResultsScreen({ jobId, onReset }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingClip, setPlayingClip] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    getClips(jobId)
      .then((data) => {
        setClips(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [jobId]);

  const totalClips = clips.length;
  const averageDuration = totalClips
    ? clips.reduce((sum, clip) => sum + clip.duration, 0) / totalClips
    : 0;
  const longestClip = totalClips
    ? Math.max(...clips.map((clip) => clip.duration))
    : 0;
  const jobLabel = jobId ? jobId.slice(0, 8).toUpperCase() : 'PENDING';

  if (loading) {
    return (
      <div className="page-shell px-4 py-4 sm:px-6 lg:px-8">
        <div className="bg-pattern" />
        <div className="page-frame flex min-h-screen items-center justify-center">
          <div className="surface-card flex flex-col items-center gap-4 px-8 py-10">
            <div className="spinner spinner-lg" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Loading your generated clips...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell px-4 py-4 sm:px-6 lg:px-8">
        <div className="bg-pattern" />
        <div className="page-frame flex min-h-screen items-center justify-center">
          <div className="surface-card max-w-xl p-6 text-center sm:p-8">
            <p className="section-label">Something went wrong</p>
            <h2 className="section-title mt-3 text-2xl sm:text-3xl">Could not load clips</h2>
            <p className="section-copy mt-4">{error}</p>
            <button className="btn-primary mt-6" onClick={onReset}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell px-4 py-4 sm:px-6 lg:px-8">
      <div className="bg-pattern" />

      <div className="page-frame flex min-h-screen flex-col gap-5">
        <StudioHeader
          eyebrow="ClipForge AI"
          statusLabel="Processing complete"
          statusValue={`${totalClips} clips ready`}
          rightSlot={(
            <button className="btn-secondary" onClick={onReset}>
              New job
            </button>
          )}
        />

        <main className="space-y-6">
          <section className="surface-card p-6 sm:p-7 lg:p-8 fade-in-up">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="section-label">Results</p>
                <h1 className="section-title mt-3 text-3xl sm:text-4xl">
                  Your clips are ready.
                </h1>
                <p className="section-copy mt-4 max-w-2xl">
                  Preview the moments the AI flagged, then download the ones you want to keep.
                  You can start another pass anytime.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="control-chip">Job {jobLabel}</span>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-card">
              <p className="stat-label">Clips ready</p>
              <p className="stat-value">{totalClips}</p>
              <p className="stat-note">The AI selected the strongest short-form moments from the source video.</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Average length</p>
              <p className="stat-value">{totalClips ? formatDuration(averageDuration) : '0:00'}</p>
              <p className="stat-note">A quick pulse on how long the final clips are running.</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Longest clip</p>
              <p className="stat-value">{totalClips ? formatDuration(longestClip) : '0:00'}</p>
              <p className="stat-note">Useful when you want to compare the broader moments against the tightest cuts.</p>
            </div>
          </div>

          {clips.length ? (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {clips.map((clip, i) => (
                <div key={clip.id} style={{ animationDelay: `${i * 0.08}s` }}>
                  <ClipCard clip={clip} jobId={jobId} onPlay={setPlayingClip} />
                </div>
              ))}
            </section>
          ) : (
            <section className="surface-card p-8 text-center">
              <p className="section-label">No clips returned</p>
              <h2 className="section-title mt-3 text-2xl">The model did not surface any usable moments.</h2>
              <p className="section-copy mt-4 max-w-2xl mx-auto">
                Try a longer or more speech-heavy video, or generate again with a different source.
              </p>
              <button className="btn-primary mt-6" onClick={onReset}>
                Start new job
              </button>
            </section>
          )}
        </main>
      </div>

      {playingClip && (
        <VideoPlayer
          src={playingClip.video_url}
          title={playingClip.title}
          onClose={() => setPlayingClip(null)}
        />
      )}
    </div>
  );
}
