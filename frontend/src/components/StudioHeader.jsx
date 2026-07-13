export default function StudioHeader({ rightSlot = null }) {
  return <header className="app-header">
    <a className="app-logo" href="/"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 5 10 7-10 7V5Z" /><path d="M3 3v18M21 3v18" /></svg></span>ClipForge</a>
    <nav><a className="active" href="#create">Create</a><a href="#library">Library</a><a href="#settings">Settings</a></nav>
    <div className="header-actions"><span className="local-badge"><i />Local-first</span>{rightSlot}</div>
  </header>;
}
