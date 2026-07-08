import { useEffect, useState } from 'react';
import { getStatus } from '../lib/api';

const POLL_INTERVAL = 2000;

function StepIcon({ status }) {
  if (status === 'completed') {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center flex-shrink-0">
        <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--color-error)]/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-input)] flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
    </div>
  );
}

export default function ProcessingScreen({ jobId, onComplete, onError }) {
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    let timeoutId;

    async function poll() {
      try {
        const data = await getStatus(jobId);
        if (!active) return;
        setSteps(data.steps || []);
        if (data.status === 'completed') { onComplete(); return; }
        if (data.status === 'failed') { setError(data.error || 'Processing failed'); onError?.(data.error); return; }
        timeoutId = setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (!active) return;
        timeoutId = setTimeout(poll, POLL_INTERVAL * 2);
      }
    }
    poll();
    return () => { active = false; clearTimeout(timeoutId); };
  }, [jobId, onComplete, onError]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-pattern" />
      <div className="w-full max-w-lg fade-in-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-accent)] pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Processing Your Video</h2>
          <p className="text-[var(--color-text-secondary)]">
            {error ? 'An error occurred' : 'AI is analyzing your content...'}
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={step.name} className="flex items-start gap-4 py-3">
                <div className="flex flex-col items-center">
                  <StepIcon status={step.status} />
                  {i < steps.length - 1 && (
                    <div className={`w-px h-8 mt-1 ${step.status === 'completed' ? 'bg-[var(--color-success)]/30' : 'bg-[var(--color-border)]'}`} />
                  )}
                </div>
                <div className="pt-1 min-w-0">
                  <p className={`font-medium text-sm ${
                    step.status === 'completed' ? 'text-[var(--color-text-primary)]' :
                    step.status === 'running' ? 'text-[var(--color-accent-hover)]' :
                    step.status === 'failed' ? 'text-[var(--color-error)]' :
                    'text-[var(--color-text-muted)]'
                  }`}>{step.name}</p>
                  {step.message && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{step.message}</p>}
                </div>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <p className="font-medium mb-1">Processing Failed</p>
              <p className="text-red-400/80">{error}</p>
            </div>
          )}
        </div>
        {!error && <p className="text-center text-[var(--color-text-muted)] text-xs mt-6">This may take a few minutes depending on video length</p>}
      </div>
    </div>
  );
}
