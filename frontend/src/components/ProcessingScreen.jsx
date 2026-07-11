import { useEffect, useState } from 'react';
import { getStatus } from '../lib/api';
import { showCompletionNotification } from '../lib/notifications';
import StudioHeader from './StudioHeader';

const POLL_INTERVAL = 2000;

function StepIcon({ status }) {
  if (status === 'completed') {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(74,222,128,0.16)]">
        <svg className="h-4 w-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    );
  }

  if (status === 'running') {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(56,189,248,0.16)]">
        <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(251,113,133,0.16)]">
        <svg className="h-4 w-4 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)]">
      <div className="h-2 w-2 rounded-full bg-[var(--color-text-muted)]" />
    </div>
  );
}

export default function ProcessingScreen({ jobId, notifyWhenComplete, onComplete, onError }) {
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('Starting...');

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    let timeoutId;

    async function poll() {
      try {
        const data = await getStatus(jobId);
        if (!active) return;

        setSteps(data.steps || []);
        setCurrentStep(data.current_step || 'Working');

        if (data.status === 'completed') {
          if (notifyWhenComplete) {
            showCompletionNotification(jobId);
          }
          onComplete();
          return;
        }

        if (data.status === 'failed') {
          const message = data.error || 'Processing failed';
          setError(message);
          onError?.(message);
          return;
        }

        timeoutId = setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (!active) return;
        timeoutId = setTimeout(poll, POLL_INTERVAL * 2);
      }
    }

    poll();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [jobId, notifyWhenComplete, onComplete, onError]);

  const completedSteps = steps.filter((step) => step.status === 'completed').length;
  const totalSteps = Math.max(steps.length, 4);
  const progress = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
  const runningStep = steps.find((step) => step.status === 'running');
  const stageTitle = error ? 'Processing stopped' : (runningStep?.name || currentStep || 'Working');
  const stageMessage = error
    ? error
    : runningStep?.message || 'We are keeping the pipeline moving in the background.';

  return (
    <div className="page-shell px-4 py-4 sm:px-6 lg:px-8">
      <div className="bg-pattern" />

      <div className="page-frame flex min-h-screen flex-col gap-5">
        <StudioHeader
          eyebrow="ClipForge AI"
          statusLabel={notifyWhenComplete ? 'Notification armed' : 'Background processing'}
          statusValue={jobId ? `Job ${jobId.slice(0, 6).toUpperCase()}` : 'Waiting'}
        />

        <main className="grid flex-1 gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <section className="surface-card p-6 sm:p-7 lg:p-8 fade-in-up">
            <p className="section-label">Processing your video</p>
            <h1 className="section-title mt-3 text-3xl sm:text-4xl">
              Finding the moments worth clipping.
            </h1>
            <p className="section-copy mt-4 max-w-2xl">
              We are extracting audio, transcribing the track, asking AI to rank the best
              moments, and exporting the clips. You can leave this tab open while it runs.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-5">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div
                  className="relative h-36 w-36 shrink-0"
                  style={{
                    background: `conic-gradient(var(--color-accent) 0 ${progress}%, rgba(255,255,255,0.08) ${progress}% 100%)`,
                  }}
                >
                  <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[rgba(7,12,22,0.96)] text-center">
                    <p className="font-display text-3xl font-bold">{progress}%</p>
                    <p className="mt-1 text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                      Done
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="section-label">Current stage</p>
                  <p className="font-display mt-2 text-2xl font-bold">{stageTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {stageMessage}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="control-chip">{completedSteps}/{totalSteps} steps complete</span>
                    <span className="control-chip">
                      {notifyWhenComplete ? 'Desktop alert enabled' : 'No alert selected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="stat-card">
                <p className="stat-label">Job ID</p>
                <p className="stat-value">{jobId ? jobId.slice(0, 8).toUpperCase() : 'Pending'}</p>
                <p className="stat-note">This identifier is used to fetch the clips when the job completes.</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Tip</p>
                <p className="stat-value">Keep this tab open</p>
                <p className="stat-note">If notifications are enabled, you will get a browser alert when the clips are ready.</p>
              </div>
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6 lg:p-7 fade-in-up fade-in-up-delay-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Live breakdown</p>
                <h2 className="section-title mt-2 text-2xl sm:text-3xl">
                  Pipeline steps
                </h2>
              </div>
              <span className="control-chip">
                {steps.length ? `${steps.length} tracked steps` : 'Tracking job status'}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {steps.length ? steps.map((step, i) => (
                <div key={step.name} className="workflow-item items-start">
                  <div className="mt-0.5">
                    <StepIcon status={step.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`font-medium text-sm ${
                        step.status === 'completed' ? 'text-[var(--color-text-primary)]'
                          : step.status === 'running' ? 'text-[var(--color-accent-hover)]'
                          : step.status === 'failed' ? 'text-[var(--color-error)]'
                            : 'text-[var(--color-text-muted)]'
                      }`}>
                        {step.name}
                      </p>
                      <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        {step.status}
                      </span>
                    </div>

                    {step.message && (
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                        {step.message}
                      </p>
                    )}

                    {i < steps.length - 1 && (
                      <div className={`mt-3 h-px w-full ${step.status === 'completed' ? 'bg-[rgba(74,222,128,0.2)]' : 'bg-[var(--color-border)]'}`} />
                    )}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Preparing the processing timeline...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-[1rem] border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.08)] p-4 text-sm text-[var(--color-error)]">
                <p className="font-semibold mb-1">Processing Failed</p>
                <p>{error}</p>
              </div>
            )}

            {!error && (
              <div className="mt-6 rounded-[1rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {notifyWhenComplete
                    ? 'Desktop notification will pop up once the job is complete.'
                    : 'You can keep watching the status here, or turn on notifications next time.'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
