import { useState, useEffect } from 'react';
import { getClips, getDownloadUrl, getStaticUrl } from '../lib/api';
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
    <div className="glass-card overflow-hidden group fade-in-up">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-black/50 cursor-pointer overflow-hidden"
        onClick={() => onPlay(clip)}
      >
        <img
          src={thumbUrl}
          alt={clip.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
          {formatDuration(clip.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-3 line-clamp-2 leading-snug">{clip.title}</h3>
        <a
          href={downloadUrl}
          download
          className="btn-download w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download
        </a>
      </div>
    </div>
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
      .then((data) => { setClips(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-pattern" />
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-pattern" />
        <div className="text-center">
          <p className="text-[var(--color-error)] mb-4">{error}</p>
          <button className="btn-primary" onClick={onReset}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="bg-pattern" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {clips.length} clips generated
          </div>
          <h2 className="text-3xl font-bold mb-2">Your Clips Are Ready</h2>
          <p className="text-[var(--color-text-secondary)]">Preview and download your AI-generated short clips</p>
        </div>

        {/* Clips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {clips.map((clip, i) => (
            <div key={clip.id} style={{ animationDelay: `${i * 0.08}s` }}>
              <ClipCard clip={clip} jobId={jobId} onPlay={setPlayingClip} />
            </div>
          ))}
        </div>

        {/* Generate Again */}
        <div className="text-center fade-in-up">
          <button className="btn-secondary text-base px-6 py-3" onClick={onReset}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Generate Again
          </button>
        </div>
      </div>

      {/* Video Player Modal */}
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
