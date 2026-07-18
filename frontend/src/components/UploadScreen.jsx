import { useState, useRef, useCallback } from 'react';
import { uploadVideo, submitYouTubeUrl } from '../lib/api';
import { requestNotificationPermission, supportsNotifications } from '../lib/notifications';
import StudioHeader from './StudioHeader';

const ACCEPTED_TYPES = '.mp4,.mov,.mkv,.avi';
const MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
const PIPELINE = [
  ['Upload', 'arrow'], ['Transcribe', 'wave'], ['AI analysis', 'spark'], ['Generate clips', 'clip'], ['Export', 'export'],
];
const BENEFITS = [
  ['01', 'Fast, local processing', 'Your footage stays on your machine.'],
  ['02', 'Private by default', 'No creative work leaves your workflow.'],
  ['03', 'GPU accelerated', 'Built for longer videos and faster turnaround.'],
  ['04', 'Viral moment detection', 'AI identifies hooks worth sharing.'],
  ['05', 'One-click export', 'Social-ready clips, ready to publish.'],
];

function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    upload: <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16.5v2.25A2.25 2.25 0 0 0 6.25 21h11.5A2.25 2.25 0 0 0 20 18.75V16.5" />,
    link: <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" />,
    play: <path fill="currentColor" stroke="none" d="M8 5v14l11-7z" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    wave: <path d="M4 12h2l2-6 4 12 2-7 2 3h4" />,
    spark: <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm6.5 12 .6 2 1.9.5-1.9.6-.6 1.9-.5-1.9-2-.6 2-.5.5-2Z" />,
    clip: <path d="M7 4v16m10-16v16M7 8h10M7 16h10" />,
    export: <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13.5v5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-5" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3v-.1A1.7 1.7 0 0 0 10.7 18.64a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.06 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3h.1A1.7 1.7 0 0 0 7.06 9.94a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z" /></>,
  };
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">{paths[name]}</svg>;
}

const formatFileSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const validYoutube = (value) => /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)[\w-]+/.test(value.trim());

export default function UploadScreen({ onProcessingStart }) {
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [notify, setNotify] = useState(false);
  const input = useRef(null);

  const selectFile = useCallback((nextFile) => {
    setError('');
    if (!nextFile) return;
    const ext = `.${nextFile.name.split('.').pop().toLowerCase()}`;
    if (!ACCEPTED_TYPES.includes(ext)) return setError('Choose an MP4, MOV, MKV, or AVI video.');
    if (nextFile.size > MAX_SIZE_BYTES) return setError('This file exceeds the 5 GB upload limit.');
    setFile(nextFile);
  }, []);
  const canGenerate = activeTab === 'file' ? file : validYoutube(youtubeUrl);
  const generate = async () => {
    setUploading(true); setError(''); setUploadProgress(0);
    try {
      let notificationsEnabled = notify;
      if (notify) notificationsEnabled = (await requestNotificationPermission()) === 'granted';
      const response = activeTab === 'file'
        ? await uploadVideo(file, setUploadProgress)
        : await submitYouTubeUrl(youtubeUrl.trim());
      onProcessingStart(response.job_id, {
        notifyWhenComplete: notificationsEnabled,
        videoName: response.filename || (activeTab === 'youtube' ? 'YouTube video' : file?.name),
        sourceType: activeTab,
        createdAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message || 'Unable to create this job. Please try again.'); setUploading(false); }
  };

  return <div className="dashboard-shell">
    <div className="dashboard-aura" />
    <div className="dashboard-frame">
      <StudioHeader rightSlot={<button className="icon-button" aria-label="Settings"><Icon name="settings" /></button>} />
      <main>
        <div className="workspace-grid">
          <section className="upload-workspace">
            <div className="eyebrow">Create a new project</div>
            <h1>Turn one long video<br />into <span>viral clips.</span></h1>
            <p className="workspace-intro">Upload a video or paste a YouTube link. AI detects the best moments, writes captions and exports social-ready clips.</p>
            <div className="source-tabs" role="tablist">
              <button className={activeTab === 'file' ? 'active' : ''} onClick={() => setActiveTab('file')}><Icon name="upload" />Upload file</button>
              <button className={activeTab === 'youtube' ? 'active' : ''} onClick={() => setActiveTab('youtube')}><Icon name="link" />YouTube URL</button>
            </div>
            {activeTab === 'file' ? <div className={`dropzone ${dragover ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`} onClick={() => !uploading && input.current?.click()} onDrop={(e) => { e.preventDefault(); setDragover(false); selectFile(e.dataTransfer.files?.[0]); }} onDragOver={(e) => { e.preventDefault(); setDragover(true); }} onDragLeave={() => setDragover(false)}>
              <input ref={input} className="hidden" type="file" accept={ACCEPTED_TYPES} onChange={(e) => selectFile(e.target.files?.[0])} />
              <div className="drop-icon"><Icon name={file ? 'check' : 'upload'} /></div>
              {file ? <><strong>{file.name}</strong><span>{formatFileSize(file.size)} · Ready to generate</span></> : <><strong>Drop your video here</strong><span>or click to browse from your computer</span></>}
            </div> : <div className="url-entry"><Icon name="play" /><input autoFocus value={youtubeUrl} onChange={(e) => { setYoutubeUrl(e.target.value); setError(''); }} placeholder="Paste a YouTube URL" /><button onClick={async () => { try { setYoutubeUrl(await navigator.clipboard.readText()); } catch { setError('Paste your URL directly into the field.'); } }}>Paste</button></div>}
            <div className="upload-meta"><span>MP4 · MOV · MKV · AVI</span><span>Up to 5 GB</span><span>Video stays local</span></div>
            {uploading && <div className="upload-progress"><span style={{ width: `${uploadProgress}%` }} /></div>}
            {error && <p className="form-error">{error}</p>}
            <div className="generate-row"><button className="generate-button" disabled={!canGenerate || uploading} onClick={generate}>{uploading ? `Uploading ${uploadProgress}%` : <><Icon name="spark" />Generate clips</>}</button><div><strong>Usually ready in 4–8 min</strong><span>depending on video length</span></div></div>
            {supportsNotifications() && <label className="notification-toggle"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /><span />Notify me when exports are ready</label>}
          </section>
          <aside className="pipeline-panel">
            <div><div className="eyebrow">Your workflow</div><h2>From raw footage<br />to ready-to-post.</h2></div>
            <ol className="pipeline-list">{PIPELINE.map(([label, icon], index) => <li key={label} className={index === 0 ? 'current' : ''}><span className="pipeline-icon"><Icon name={icon} /></span><div><strong>{label}</strong><small>{index === 0 ? 'Waiting for your source' : index === 1 ? 'Local, word-level timestamps' : index === 2 ? 'Find moments with momentum' : index === 3 ? 'Cut and caption automatically' : 'Download in one click'}</small></div><em>{index === 0 ? 'Ready' : `0${index + 1}`}</em></li>)}</ol>
            <div className="pipeline-foot"><span className="live-dot" />Local GPU is ready</div>
          </aside>
        </div>
        <section className="recent-section"><div className="section-heading"><div><div className="eyebrow">Library</div><h2>Recent jobs</h2></div><button className="ghost-button">View all <Icon name="arrow" /></button></div><div className="empty-jobs"><div className="empty-art"><i /><i /><i /><b><Icon name="spark" /></b></div><h3>Your Clipo creative queue is clear.</h3><p>Your recent projects will appear here, ready to preview, revisit and export.</p></div></section>
        <section className="benefits"><div><div className="eyebrow">Made for creators</div><h2>Everything between<br />idea and publish.</h2></div><div className="benefit-list">{BENEFITS.map(([number, title, description]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
      </main>
    </div>
  </div>;
}
