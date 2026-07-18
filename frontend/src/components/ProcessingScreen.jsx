import { useEffect, useState } from 'react';
import { getStatus } from '../lib/api';
import { showCompletionNotification } from '../lib/notifications';
import ClipoMark from './ClipoMark';

const POLL_INTERVAL = 2000;

function Icon({ type }) {
  const paths = {
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    play: <path d="m9 7 7 5-7 5V7Z" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" /></>,
    video: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 5-3v10l-5-3" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    spark: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type] || paths.clock}</svg>;
}

function StepIcon({ status }) {
  const type = status === 'completed' ? 'check' : status === 'running' ? 'spark' : 'clock';
  return <span className={`processing-step-icon ${status === 'running' ? 'is-running' : ''} ${status === 'completed' ? 'is-complete' : ''}`}><Icon type={type} /></span>;
}

export default function ProcessingScreen({ jobId, jobDetails, notifyWhenComplete, onNotificationChange, onLeave, onComplete, onError }) {
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('Preparing your workspace');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

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
          if (notifyWhenComplete) showCompletionNotification(jobId);
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
        if (active) timeoutId = setTimeout(poll, POLL_INTERVAL * 2);
      }
    }
    poll();
    return () => { active = false; clearTimeout(timeoutId); };
  }, [jobId, notifyWhenComplete, onComplete, onError]);

  const completedSteps = steps.filter((step) => step.status === 'completed').length;
  const totalSteps = Math.max(steps.length, 1);
  const progress = error ? 0 : Math.min(100, Math.round((completedSteps / totalSteps) * 100));
  const runningStep = steps.find((step) => step.status === 'running');
  const stageTitle = error ? 'Processing stopped' : (runningStep?.name || currentStep);
  const stageMessage = error ? error : (runningStep?.message || 'The pipeline is preparing the next task.');
  const elapsedText = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div className="processing-shell">
      <div className="processing-aura" />
      <div className="processing-frame">
        <header className="processing-topbar">
          <button className="processing-back" onClick={onLeave} type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg> Back</button>
          <div className="processing-brand"><span><ClipoMark /></span> Clipo</div>
        </header>

        <main>
          <div className="processing-intro">
            <p>AI video processing</p>
            <h1>Processing your video</h1>
            <div>Our AI is analyzing your upload and finding the moments that deserve to be shared.</div>
          </div>

          <div className="processing-grid">
            <section className="processing-hero">
              <div className="processing-hero-top"><span className="processing-live"><i /> Live processing</span><span>{completedSteps} of {totalSteps} steps</span></div>
              <div className="processing-focus">
                <div className="processing-ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><strong>{progress}%</strong><small>complete</small></div></div>
                <div className="processing-stage"><p>Current stage</p><h2>{stageTitle}</h2><span>{stageMessage}</span></div>
              </div>
              <div className="processing-progress"><div><span>Overall progress</span><b>{progress}%</b></div><div className="processing-track"><i style={{ width: `${progress}%` }} /></div></div>
              <div className="processing-times"><div><Icon type="clock" /><span>Elapsed time<strong>{elapsedText}</strong></span></div><div><Icon type="clock" /><span>Estimated remaining<strong>Calculating</strong></span></div></div>
            </section>

            <aside className="processing-details">
              <div className="processing-details-heading"><h2>Job details</h2><span className={error ? 'failed' : 'active'}>{error ? 'Failed' : 'Processing'}</span></div>
              <dl>
                <div><dt>Video name</dt><dd title={jobDetails?.videoName}>{jobDetails?.videoName || 'Not available'}</dd></div>
                <div><dt>Duration</dt><dd>Not available</dd></div>
                <div><dt>Job ID</dt><dd className="job-id">{jobId || 'Not available'}</dd></div>
              </dl>
              <label className="processing-toggle"><span><Icon type="bell" /> Notify me when it’s ready</span><input type="checkbox" checked={notifyWhenComplete} onChange={(event) => onNotificationChange?.(event.target.checked)} /><i /></label>
            </aside>
          </div>

          <section className="processing-timeline-section">
            <div><p>Pipeline</p><h2>What your AI is working through</h2></div>
            <div className="processing-timeline">
              {steps.length ? steps.map((step, index) => <article className={`processing-timeline-step ${step.status}`} key={`${step.name}-${index}`}><StepIcon status={step.status} /><div><h3>{step.name}</h3><p>{step.message || (step.status === 'pending' ? 'Waiting for the previous step to finish.' : 'Processing this part of your video.')}</p></div><em>{step.status}</em></article>) : <article className="processing-timeline-step running"><StepIcon status="running" /><div><h3>Preparing processing pipeline</h3><p>Connecting your video to the AI workflow.</p></div><em>running</em></article>}
            </div>
            {error && <p className="processing-error">{error}</p>}
          </section>
          <div className="processing-banner"><span><Icon type="spark" /></span><div><strong>Hang tight.</strong><p>AI is finding your best moments.</p></div></div>
        </main>
      </div>
    </div>
  );
}
