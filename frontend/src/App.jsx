import { useState, useCallback } from 'react';
import { startProcessing } from './lib/api';
import UploadScreen from './components/UploadScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultsScreen from './components/ResultsScreen';

// Screen states
const SCREEN = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  RESULTS: 'results',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.UPLOAD);
  const [jobId, setJobId] = useState(null);
  const [notifyWhenComplete, setNotifyWhenComplete] = useState(false);

  const handleProcessingStart = useCallback(async (newJobId, options = {}) => {
    setJobId(newJobId);
    setNotifyWhenComplete(Boolean(options.notifyWhenComplete));
    try {
      await startProcessing(newJobId);
      setScreen(SCREEN.PROCESSING);
    } catch (err) {
      alert(err.message || 'Failed to start processing');
    }
  }, []);

  const handleComplete = useCallback(() => {
    setScreen(SCREEN.RESULTS);
  }, []);

  const handleError = useCallback((errorMsg) => {
    // Stay on processing screen — it shows the error
    console.error('Pipeline error:', errorMsg);
  }, []);

  const handleReset = useCallback(() => {
    setScreen(SCREEN.UPLOAD);
    setJobId(null);
    setNotifyWhenComplete(false);
  }, []);

  return (
    <>
      {screen === SCREEN.UPLOAD && (
        <UploadScreen onProcessingStart={handleProcessingStart} />
      )}
      {screen === SCREEN.PROCESSING && (
        <ProcessingScreen
          jobId={jobId}
          notifyWhenComplete={notifyWhenComplete}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}
      {screen === SCREEN.RESULTS && (
        <ResultsScreen jobId={jobId} onReset={handleReset} />
      )}
    </>
  );
}
