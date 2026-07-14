import { useEffect, useMemo, useState } from 'react';
import { getClips, getDownloadUrl, getStaticUrl } from '../lib/api';
import VideoPlayer from './VideoPlayer';

const icon = (name) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>, download: <><path d="M12 3v11" /><path d="m8 10 4 4 4-4" /><path d="M4 20h16" /></>, plus: <path d="M12 5v14M5 12h14" />, more: <path d="M5 12h.01M12 12h.01M19 12h.01" />, play: <path d="m9 7 7 5-7 5V7Z" />, spark: <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />, filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function formatDuration(seconds) { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s.toString().padStart(2, '0')}`; }

function ClipCard({ clip, jobId, onPlay, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <article className="result-clip-card">
    <button className="result-thumb" onClick={() => onPlay(clip)} type="button">
      <img src={getStaticUrl(clip.thumbnail_url)} alt={clip.title} onError={(event) => { event.currentTarget.style.opacity = 0; }} />
      <div className="result-thumb-shade" />
      <span className="result-duration">{formatDuration(clip.duration)}</span>
      <span className="result-selected"><i /> AI selected</span>
      <span className="result-play">{icon('play')}</span>
    </button>
    <div className="result-card-copy">
      <div className="result-card-title"><h3 title={clip.title}>{clip.title}</h3><button aria-label="Clip actions" className="result-more" onClick={() => setMenuOpen((open) => !open)}>{icon('more')}</button></div>
      <p className="result-preview">AI selected this moment from your source video.</p>
      <div className="result-tags"><span>✦ AI-picked moment</span><span>⏱ {formatDuration(clip.duration)}</span></div>
      <div className="result-card-actions"><button onClick={() => onPlay(clip)}>Preview</button><a href={getDownloadUrl(jobId, clip.filename)} download>{icon('download')} Download</a></div>
      {menuOpen && <div className="result-menu"><button onClick={() => { const title = window.prompt('Rename clip', clip.title); if (title?.trim()) onRename(clip.id, title.trim()); setMenuOpen(false); }}>Rename</button><button disabled title="Transcript text is not provided by the current API">Copy transcript</button><button className="danger" onClick={() => { onDelete(clip.id); setMenuOpen(false); }}>Remove from view</button></div>}
    </div>
  </article>;
}

export default function ResultsScreen({ jobId, onReset }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingClip, setPlayingClip] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [durationFilter, setDurationFilter] = useState('all');

  useEffect(() => { if (!jobId) return; getClips(jobId).then((data) => { setClips(data); setLoading(false); }).catch((err) => { setError(err.message); setLoading(false); }); }, [jobId]);
  const totalRuntime = clips.reduce((sum, clip) => sum + clip.duration, 0);
  const visibleClips = useMemo(() => clips.filter((clip) => clip.title.toLowerCase().includes(query.toLowerCase())).filter((clip) => durationFilter === 'all' || (durationFilter === 'short' ? clip.duration < 30 : clip.duration >= 30)).sort((a, b) => sort === 'shortest' ? a.duration - b.duration : sort === 'longest' ? b.duration - a.duration : b.id - a.id), [clips, query, sort, durationFilter]);
  const renameClip = (id, title) => setClips((current) => current.map((clip) => clip.id === id ? { ...clip, title } : clip));
  const removeClip = (id) => setClips((current) => current.filter((clip) => clip.id !== id));
  const captionClip = (id, result) => {
    setClips((current) => current.map((clip) => clip.id === id ? { ...clip, filename: result.filename, video_url: result.video_url } : clip));
  };
  const downloadAll = () => clips.forEach((clip, index) => setTimeout(() => { const link = document.createElement('a'); link.href = getDownloadUrl(jobId, clip.filename); link.download = clip.filename; document.body.appendChild(link); link.click(); link.remove(); }, index * 200));

  if (loading) return <div className="results-shell results-centered"><div className="spinner spinner-lg" /><p>Loading your clips</p></div>;
  if (error) return <div className="results-shell results-centered"><p className="results-kicker">Something went wrong</p><h1>Could not load your clips</h1><p>{error}</p><button className="results-primary" onClick={onReset}>Try again</button></div>;

  return <div className="results-shell"><div className="results-aura" /><div className="results-frame">
    <header className="results-header"><div><p className="results-kicker">Results</p><h1>Your clips are ready <span>🎉</span></h1><p>AI found the highest-performing moments from your video.</p></div><div className="results-header-actions"><button className="results-quiet" onClick={downloadAll}>{icon('download')} Download all</button><button className="results-quiet" onClick={downloadAll}>Export</button><button className="results-primary" onClick={onReset}>{icon('plus')} New job</button></div></header>
    <section className="results-summary"><div><strong>{clips.length}</strong><span>Clips</span></div><div><strong>{formatDuration(totalRuntime)}</strong><span>Total runtime</span></div><div><strong>Completed</strong><span>Processing status</span></div><div><strong>AI-selected</strong><span>Clip quality</span></div></section>
    <section className="results-toolbar"><label className="results-search">{icon('search')}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clips" /></label><div className="results-select-wrap">{icon('filter')}<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="shortest">Shortest</option><option value="longest">Longest</option><option value="score" disabled>Highest score — unavailable</option></select></div><div className="results-filter"><span>Duration</span><button className={durationFilter === 'all' ? 'active' : ''} onClick={() => setDurationFilter('all')}>All</button><button className={durationFilter === 'short' ? 'active' : ''} onClick={() => setDurationFilter('short')}>Under 30s</button><button className={durationFilter === 'long' ? 'active' : ''} onClick={() => setDurationFilter('long')}>30s+</button></div></section>
    {visibleClips.length ? <section className="results-grid">{visibleClips.map((clip) => <ClipCard key={clip.id} clip={clip} jobId={jobId} onPlay={setPlayingClip} onRename={renameClip} onDelete={removeClip} />)}</section> : <section className="results-empty"><div>{icon('spark')}</div><h2>Generate your first clips.</h2><p>{clips.length ? 'No clips match those filters.' : 'Your best moments will appear here once processing finishes.'}</p>{clips.length ? <button onClick={() => { setQuery(''); setDurationFilter('all'); }}>Clear filters</button> : <button onClick={onReset}>Start a new job</button>}</section>}
  </div>{playingClip && <VideoPlayer clip={playingClip} clips={clips} jobId={jobId} onSelect={setPlayingClip} onClose={() => setPlayingClip(null)} onRename={renameClip} onDelete={(id) => { removeClip(id); setPlayingClip(null); }} onCaption={captionClip} />}</div>;
}
