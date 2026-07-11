import { useState } from 'react';
import { getStaticUrl } from '../lib/api';

export default function VideoPlayer({ src, title, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const videoUrl = src?.startsWith('http') ? src : getStaticUrl(src);

  return (
    <div className="modal-shell" onClick={onClose}>
      <div className="modal-panel grid max-h-[88vh] lg:grid-cols-[minmax(0,1.7fr)_340px]" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-black">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative flex min-h-[320px] items-center justify-center bg-black">
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="spinner spinner-lg" />
              </div>
            )}
            <video
              src={videoUrl}
              controls
              autoPlay
              className="max-h-[88vh] w-full object-contain"
              onLoadedData={() => setLoaded(true)}
            />
          </div>
        </div>

        <aside className="modal-info flex flex-col justify-between gap-6 p-5 sm:p-6">
          <div>
            <p className="section-label">Clip preview</p>
            {title && (
              <h3 className="section-title mt-3 text-2xl leading-tight">
                {title}
              </h3>
            )}
            <p className="section-copy mt-4 text-sm">
              Watch the selected moment, then close the viewer to keep downloading or move to
              the next clip.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="stat-card">
                <p className="stat-label">Playback</p>
                <p className="stat-value">Fullscreen ready</p>
                <p className="stat-note">Use the native controls, or expand the video in your browser.</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Tip</p>
                <p className="stat-value">Keep reviewing</p>
                <p className="stat-note">Close the player when you want to jump back to the clip grid.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Close
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
