import { useState, useRef, useCallback } from 'react';
import { uploadVideo, submitYouTubeUrl } from '../lib/api';
import {
  requestNotificationPermission,
  supportsNotifications,
} from '../lib/notifications';
import StudioHeader from './StudioHeader';

const ACCEPTED_TYPES = '.mp4,.mov,.mkv,.avi';
const MAX_SIZE_GB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_GB * 1024 * 1024 * 1024;

const FEATURE_CARDS = [
  {
    label: 'Transcription',
    value: 'Local Whisper',
    note: 'Speech-to-text runs locally with timestamps and silence filtering.',
  },
  {
    label: 'Analysis',
    value: 'AI moment search',
    note: 'Gemini finds hooks, insights, and emotional beats worth clipping.',
  },
  {
    label: 'Export',
    value: 'Instant FFmpeg cuts',
    note: 'Short clips and thumbnails are generated automatically for download.',
  },
];

const WORKFLOW = [
  {
    step: '01',
    title: 'Upload or paste',
    description: 'Choose a local file or drop in a YouTube URL to start the pipeline.',
  },
  {
    step: '02',
    title: 'Analyze the transcript',
    description: 'The backend extracts audio, transcribes it, and ranks the strongest moments.',
  },
  {
    step: '03',
    title: 'Preview and download',
    description: 'Review the generated clips, then download the ones you want to keep.',
  },
];

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)[\w-]+/.test(url.trim());
}

export default function UploadScreen({ onProcessingStart }) {
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notifyWhenComplete, setNotifyWhenComplete] = useState(false);
  const fileInputRef = useRef(null);
  const notificationsSupported = supportsNotifications();

  const handleFile = useCallback((selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!['.mp4', '.mov', '.mkv', '.avi'].includes(ext)) {
      setError(`Unsupported format "${ext}". Use MP4, MOV, MKV, or AVI.`);
      return;
    }
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`File is too large (${formatFileSize(selectedFile.size)}). Maximum is ${MAX_SIZE_GB} GB.`);
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragover(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragover(false);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && isValidYouTubeUrl(text)) {
        setYoutubeUrl(text);
        setError('');
      } else if (text) {
        setYoutubeUrl(text);
        setError('This does not look like a valid YouTube URL.');
      }
    } catch {
      setError('Failed to read clipboard. Please paste manually.');
    }
  }, []);

  const canGenerate = activeTab === 'file'
    ? file !== null
    : youtubeUrl.trim() && isValidYouTubeUrl(youtubeUrl);

  const handleGenerate = async () => {
    setError('');
    setNotificationMessage('');
    setUploading(true);
    setUploadProgress(0);

    try {
      let notificationsEnabled = notifyWhenComplete;

      if (notificationsEnabled) {
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
          notificationsEnabled = false;
          setNotifyWhenComplete(false);

          if (permission === 'unsupported') {
            setNotificationMessage('Desktop notifications are not supported in this browser.');
          } else if (permission === 'denied') {
            setNotificationMessage('Notifications are blocked in your browser settings.');
          } else {
            setNotificationMessage('Notifications were not enabled, so keep the tab open for results.');
          }
        }
      }

      let response;

      if (activeTab === 'file') {
        response = await uploadVideo(file, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        setUploadProgress(50);
        response = await submitYouTubeUrl(youtubeUrl.trim());
        setUploadProgress(100);
      }

      onProcessingStart(response.job_id, {
        notifyWhenComplete: notificationsEnabled,
      });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="page-shell px-4 py-4 sm:px-6 lg:px-8">
      <div className="bg-pattern" />

      <div className="page-frame flex min-h-screen flex-col gap-5">
        <StudioHeader
          eyebrow="ClipForge AI"
          statusLabel="Local-first"
          statusValue="GPU-aware pipeline"
        />

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <section className="hero-shell p-6 sm:p-8 lg:p-10 fade-in-up">
            <div className="relative z-10">
              <span className="hero-badge">AI clip studio</span>

              <div className="mt-6 max-w-3xl">
                <h1 className="hero-title">
                  Make one long video feel instantly social-ready.
                </h1>
                <p className="hero-copy mt-5 max-w-2xl">
                  Upload a file or paste a YouTube link. ClipForge transcribes the audio,
                  finds the strongest moments, and exports short clips you can preview right away.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {FEATURE_CARDS.map((card) => (
                  <div key={card.label} className="stat-card">
                    <p className="stat-label">{card.label}</p>
                    <p className="stat-value">{card.value}</p>
                    <p className="stat-note">{card.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 content-panel p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="section-label">How it works</p>
                    <h2 className="section-title mt-2 text-xl sm:text-2xl">
                      A simple three-step pipeline
                    </h2>
                  </div>
                  <span className="control-chip">
                    Long jobs can keep running in the background
                  </span>
                </div>

                <div className="workflow-list mt-5">
                  {WORKFLOW.map((item) => (
                    <div key={item.step} className="workflow-item">
                      <div className="workflow-step">{item.step}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="section-copy mt-5 text-sm">
                  Turn on notifications in the form panel if you want a browser alert when the
                  clips are done.
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6 lg:p-7 fade-in-up fade-in-up-delay-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Create a job</p>
                <h2 className="section-title mt-2 text-2xl sm:text-3xl">
                  Drop in a video source
                </h2>
                <p className="section-copy mt-3 max-w-lg text-sm sm:text-base">
                  Switch between a file upload and a YouTube URL. Once submitted, the pipeline
                  takes over and keeps the screen updated.
                </p>
              </div>
              <span className="control-chip hidden sm:inline-flex">
                Max {MAX_SIZE_GB} GB upload
              </span>
            </div>

            <div className="mt-6 flex justify-start">
              <div className="tab-switcher">
                <button
                  className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('file'); setError(''); }}
                  disabled={uploading}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload File
                  </span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'youtube' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('youtube'); setError(''); }}
                  disabled={uploading}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube URL
                  </span>
                </button>
              </div>
            </div>

            {activeTab === 'file' ? (
              <div
                className={`mt-6 rounded-[1.5rem] border border-dashed p-5 sm:p-6 transition-all ${
                  dragover
                    ? 'border-[var(--color-accent)] bg-[rgba(56,189,248,0.08)] shadow-[0_0_0_1px_rgba(56,189,248,0.22)]'
                    : 'border-[var(--color-border)] bg-[rgba(255,255,255,0.03)]'
                } ${file ? 'border-[rgba(56,189,248,0.36)]' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[rgba(56,189,248,0.18)] bg-gradient-to-br from-cyan-400/20 to-sky-500/20">
                      <svg className="h-8 w-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold">{file.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {formatFileSize(file.size)}
                      </p>
                      {!uploading && (
                        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                          Click anywhere in this box to replace the file.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-input)]">
                      <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold">Drop your video here</p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        or click to browse files
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="control-chip">MP4</span>
                        <span className="control-chip">MOV</span>
                        <span className="control-chip">MKV</span>
                        <span className="control-chip">AVI</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="h-5 w-5 text-[var(--color-youtube)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => {
                        setYoutubeUrl(e.target.value);
                        setError('');
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg-input)] py-3.5 pl-11 pr-4 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent)]"
                      disabled={uploading}
                    />
                  </div>
                  <button
                    className="btn-secondary whitespace-nowrap"
                    onClick={handlePaste}
                    disabled={uploading}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    Paste
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Supports youtube.com and youtu.be links. Max 3 hours.
                </p>
              </div>
            )}

            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-[var(--color-text-secondary)]">
                  {activeTab === 'file'
                    ? `Uploading... ${uploadProgress}%`
                    : 'Submitting URL...'
                  }
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-[1rem] border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.08)] p-4 text-sm text-[var(--color-error)]">
                {error}
              </div>
            )}

            <div className="mt-5 rounded-[1.15rem] border border-[var(--color-border)] bg-white/5 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  id="notify-complete"
                  type="checkbox"
                  checked={notifyWhenComplete}
                  onChange={(e) => {
                    setNotifyWhenComplete(e.target.checked);
                    setNotificationMessage('');
                    setError('');
                  }}
                  disabled={uploading || !notificationsSupported}
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                    Notify me when complete
                  </span>
                  <span className="mt-1 block text-xs leading-6 text-[var(--color-text-secondary)]">
                    Useful for longer videos. We&apos;ll ask your browser for permission when
                    you start processing.
                  </span>
                </span>
              </label>
            </div>

            {notificationMessage && (
              <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                {notificationMessage}
              </p>
            )}

            <div className="mt-6">
              <button
                className="btn-primary w-full justify-center text-lg"
                disabled={!canGenerate || uploading}
                onClick={handleGenerate}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    Generate Clips
                  </>
                )}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
