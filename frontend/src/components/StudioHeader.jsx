import ClipoMark from './ClipoMark';

export default function StudioHeader({ rightSlot = null }) {
  return <header className="app-header">
    <a className="app-logo" href="/"><span><ClipoMark /></span>Clipo</a>
    <nav><a className="active" href="#create">Create</a><a href="#library">Library</a><a href="#settings">Settings</a></nav>
    <div className="header-actions"><span className="local-badge"><i />Local-first</span>{rightSlot}</div>
  </header>;
}
