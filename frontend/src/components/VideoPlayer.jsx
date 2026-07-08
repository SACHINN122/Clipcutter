import { useState } from 'react';
import { getStaticUrl } from '../lib/api';

export default function VideoPlayer({ src, title, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const videoUrl = src?.startsWith('http') ? src : getStaticUrl(src);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        {title && (
          <h3 className="text-white font-semibold text-lg mb-3 truncate">{title}</h3>
        )}

        {/* Video */}
        <div className="rounded-xl overflow-hidden bg-black shadow-2xl">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="spinner spinner-lg" />
            </div>
          )}
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full max-h-[80vh]"
            onLoadedData={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
