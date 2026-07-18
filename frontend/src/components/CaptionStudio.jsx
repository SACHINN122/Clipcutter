import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PRESETS = [
  { id: 'bold_white', name: 'Bold White', trend: '#1', sample: 'BOLD' },
  { id: 'karaoke_yellow', name: 'Karaoke Yellow', trend: '#2', sample: 'KARAOKE' },
  { id: 'minimal', name: 'Minimalist', sample: 'Clean' },
];

export default function CaptionStudio({ clip, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('presets');
  const [activePreset, setActivePreset] = useState('bold_white');
  const [position, setPosition] = useState('bottom');

  return (
    <div className="preview-overlay" style={{ zIndex: 100 }} onMouseDown={onClose}>
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-5xl mx-auto p-6 bg-[#0b0a0d] text-white rounded-2xl border border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]" onMouseDown={(e) => e.stopPropagation()}>
      
      {/* Left Column: Caption Customizer */}
      <div className="flex-1 w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center ring-1 ring-purple-500/30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-xl tracking-tight text-white">Advanced Caption Studio</h3>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-0.5">Style & Placement</p>
          </div>
        </div>

        {/* Studio Tabs */}
        <div className="flex gap-1.5 p-1.5 bg-white/5 rounded-xl border border-white/5">
          {['presets', 'adjust', 'animations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="min-h-[300px]">
          
          {/* 1. Presets Tab */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setActivePreset(preset.id)}
                  className={`relative p-0 overflow-hidden rounded-xl border transition-all duration-200 active:scale-95 ${
                    activePreset === preset.id 
                      ? 'border-purple-500 ring-4 ring-purple-500/20 bg-purple-500/10' 
                      : 'border-white/10 bg-black/40 hover:border-white/30'
                  }`}
                >
                  <div className="h-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 to-black flex items-center justify-center">
                    <span className={`text-2xl font-black italic tracking-tighter ${
                      preset.id === 'bold_white' ? 'text-white drop-shadow-md' :
                      preset.id === 'karaoke_yellow' ? 'text-yellow-400 drop-shadow-md' :
                      'text-white/90 font-medium'
                    }`}>
                      {preset.sample}
                    </span>
                  </div>
                  <div className="py-2.5 bg-black/80 text-[11px] font-bold text-center border-t border-white/5 text-white/70 uppercase tracking-wider">
                    {preset.name}
                  </div>
                  {preset.trend && (
                    <span className="absolute top-2 right-2 text-[8px] font-black bg-gradient-to-b from-purple-400 to-purple-600 px-2 py-1 rounded-full shadow-lg">
                      {preset.trend}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 2. Adjust Tab */}
          {activeTab === 'adjust' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Placement Grid */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Snap Anchor</label>
                <div className="flex gap-6 items-start">
                  <div className="grid grid-cols-3 gap-1.5 w-[100px]">
                    {['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'].map(pos => {
                      // We map all grid spots, but only bind top, center, bottom for this demo
                      const mappedPos = pos.includes('top') ? 'top' : pos.includes('bottom') ? 'bottom' : 'center';
                      const isActive = position === mappedPos && pos === mappedPos;
                      return (
                        <button
                          key={pos}
                          onClick={() => setPosition(mappedPos)}
                          className={`aspect-square rounded-[6px] border flex items-center justify-center transition-all ${
                            isActive ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full transition-all ${isActive ? 'bg-purple-400 scale-[2]' : 'bg-white/30'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
                    Select an anchor point to snap your captions, or <strong className="text-purple-400">drag them freely</strong> on the phone preview.
                  </p>
                </div>
              </div>
              
              {/* Typography / Color (Placeholders for UI) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Font Family</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer">
                    <option>Outfit (Modern)</option>
                    <option>Inter (Clean)</option>
                    <option>Komika (Comic)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Text Color</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                    <input type="color" defaultValue="#ffffff" className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent p-0" />
                    <span className="text-sm font-mono text-white/70">#FFFFFF</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 3. Animations Tab (Empty state for wow factor) */}
          {activeTab === 'animations' && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
              <svg className="w-10 h-10 mb-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold">Cinematic reveals & pop-ins</p>
              <p className="text-xs text-white/50 mt-1">Coming in next iteration</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 flex gap-3 border-t border-white/10">
          <button onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
          <button onClick={() => onSave({ preset: activePreset, position })} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02]">
            Burn Captions {clip ? `(Clip ${String(clip.id).padStart(2, '0')})` : ''}
          </button>
        </div>
      </div>

      {/* Right Column: Live Phone Preview */}
      <div className="w-full lg:w-[320px] flex-none flex justify-center py-4 lg:py-0">
        
        <div className="relative w-[280px] h-[580px] bg-[#050506] rounded-[50px] border-[8px] border-[#2a2a30] shadow-2xl shadow-black/90 overflow-hidden ring-1 ring-white/10 flex flex-col">
          
          {/* Inner Titanium Bezel Reflection */}
          <div className="absolute inset-0 rounded-[42px] border border-white/5 pointer-events-none z-50" />

          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-40 flex items-center justify-end px-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
             <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-900 to-black mr-1" />
          </div>
          
          {/* Video Placeholder Area (9:16 aspect) */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black z-0 flex flex-col items-center justify-center">
            <svg className="w-10 h-10 text-white/10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-white/20 font-bold tracking-widest text-[10px]">YOUR VIDEO HERE</span>
          </div>

          {/* Draggable Caption Overlay */}
          <motion.div 
            drag
            dragConstraints={{ top: -200, left: -100, right: 100, bottom: 200 }}
            className={`absolute left-0 right-0 z-30 flex justify-center px-4 cursor-grab active:cursor-grabbing
              ${position === 'top' ? 'top-[20%]' : position === 'center' ? 'top-[50%] -translate-y-1/2' : 'bottom-[20%]'}
            `}
          >
            {/* The actual caption styling logic based on preset */}
            <div className={`text-center transition-all duration-300 pointer-events-none
              ${activePreset === 'bold_white' ? 'font-black text-2xl uppercase text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]' : ''}
              ${activePreset === 'karaoke_yellow' ? 'font-black text-3xl uppercase text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]' : ''}
              ${activePreset === 'minimal' ? 'font-medium text-lg text-white/90 bg-black/60 px-4 py-1.5 rounded-lg backdrop-blur-md' : ''}
            `}>
              Drag to position
            </div>
          </motion.div>

          {/* Cinematic Overlay (Vignette & Gradients) */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />
          
          {/* UI Hint Pill */}
          <div className="absolute top-14 left-4 z-40 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live Preview</span>
          </div>

        </div>
      </div>

    </div>
    </div>
  );
}
