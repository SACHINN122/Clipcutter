export default function StudioHeader({
  eyebrow = 'ClipForge AI',
  statusLabel = 'Studio mode',
  statusValue = 'Local pipeline',
  rightSlot = null,
}) {
  return (
    <header className="page-header fade-in-up">
      <div className="brand-lockup">
        <div className="brand-mark">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5 9 7v10l6-3.5m0-3 6-3.5v10L15 14m0-3 6-3.5M9 7 3 3.5v10L9 7Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{eyebrow}</p>
          <p className="brand-title truncate text-lg sm:text-xl">Local-first AI clip studio</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <span className="status-chip">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_12px_rgba(74,222,128,0.55)]" />
          {statusLabel}
        </span>
        <span className="control-chip">
          {statusValue}
        </span>
        {rightSlot}
      </div>
    </header>
  );
}
