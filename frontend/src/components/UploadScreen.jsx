import { useState, useRef, useCallback } from 'react';
import { uploadVideo, submitYouTubeUrl } from '../lib/api';

const ACCEPTED_TYPES = '.mp4,.mov,.mkv,.avi';
const MAX_SIZE_GB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_GB * 1024 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)[\w\-]+/.test(url.trim());
}

export default function UploadScreen({ onProcessingStart }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'youtube'
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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
        setError('This doesn\'t look like a valid YouTube URL.');
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
    setUploading(true);
    setUploadProgress(0);

    try {
      let response;

      if (activeTab === 'file') {
        response = await uploadVideo(file, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        setUploadProgress(50); // Indeterminate
        response = await submitYouTubeUrl(youtubeUrl.trim());
        setUploadProgress(100);
      }

      onProcessingStart(response.job_id);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-pattern" />

      <div className="w-full max-w-2xl fade-in-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ClipForge AI
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Transform long-form videos into engaging short clips with AI
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8 fade-in-up fade-in-up-delay-1">
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => { setActiveTab('file'); setError(''); }}
              disabled={uploading}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube URL
              </span>
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="glass-card p-8 fade-in-up fade-in-up-delay-2">
          {activeTab === 'file' ? (
            /* File Upload Tab */
            <div
              className={`gradient-border p-10 text-center cursor-pointer transition-all
                ${dragover ? 'dragover' : ''}
                ${file ? 'active' : ''}`}
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
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-lg mb-1">{file.name}</p>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {formatFileSize(file.size)}
                  </p>
                  {!uploading && (
                    <p className="text-[var(--color-text-muted)] text-xs mt-3">
                      Click to change file
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--color-bg-input)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="font-medium text-lg mb-1">
                    Drop your video here
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-3">
                    or click to browse files
                  </p>
                  <p className="text-[var(--color-text-muted)] text-xs">
                    MP4, MOV, MKV, AVI • Max {MAX_SIZE_GB} GB
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* YouTube URL Tab */
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-[var(--color-youtube)]" viewBox="0 0 24 24" fill="currentColor">
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
                    className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    disabled={uploading}
                  />
                </div>
                <button
                  className="btn-secondary whitespace-nowrap"
                  onClick={handlePaste}
                  disabled={uploading}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                  Paste
                </button>
              </div>
              <p className="text-[var(--color-text-muted)] text-xs">
                Supports youtube.com and youtu.be links • Max 3 hours
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6 space-y-2">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[var(--color-text-secondary)] text-sm text-center">
                {activeTab === 'file'
                  ? `Uploading... ${uploadProgress}%`
                  : 'Submitting URL...'
                }
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-6 flex justify-center">
            <button
              className="btn-primary text-lg px-8 py-3"
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                  Generate Clips
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
