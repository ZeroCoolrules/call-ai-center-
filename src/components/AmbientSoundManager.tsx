import React, { useState, useEffect, useRef } from 'react';
import {
  ambientSound,
  AmbientSoundState,
  AmbientTrack,
} from '../lib/ambientSound';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Radio,
  Sliders,
  Sparkles,
  Disc,
  Coins,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

export const AmbientSoundManager: React.FC = () => {
  const [state, setState] = useState<AmbientSoundState>(ambientSound.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = ambientSound.subscribe(setState);
    return () => unsubscribe();
  }, []);

  // Equalizer visualizer loop
  useEffect(() => {
    const renderVisualizer = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const freqData = ambientSound.getAnalyserData();
          if (freqData && state.isPlaying && !state.isMuted) {
            const barCount = 18;
            const barWidth = canvas.width / barCount - 2;

            for (let i = 0; i < barCount; i++) {
              const val = freqData[i * 2] || 0;
              const percent = val / 255;
              const barHeight = Math.max(3, percent * (canvas.height - 4));
              const x = i * (barWidth + 2);
              const y = canvas.height - barHeight;

              // 1980s Miami Neon Pink to Cyan gradient
              const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
              grad.addColorStop(0, '#06B6D4'); // cyan
              grad.addColorStop(0.5, '#EC4899'); // pink
              grad.addColorStop(1, '#F43F5E'); // neon red

              ctx.fillStyle = grad;
              ctx.fillRect(x, y, barWidth, barHeight);
            }
          } else {
            // Idle subtle bars
            const barCount = 18;
            const barWidth = canvas.width / barCount - 2;
            ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            for (let i = 0; i < barCount; i++) {
              ctx.fillRect(i * (barWidth + 2), canvas.height - 3, barWidth, 3);
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, state.isMuted]);

  const handleTogglePlay = () => {
    ambientSound.togglePlay();
  };

  const handleToggleMute = () => {
    ambientSound.toggleMute();
  };

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    ambientSound.setMasterVolume(val);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    ambientSound.setMusicVolume(val);
  };

  const handleCasinoVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    ambientSound.setCasinoVolume(val);
  };

  const handleTrackChange = (track: AmbientTrack) => {
    ambientSound.setTrack(track);
  };

  const currentVolumePercent = Math.round(state.masterVolume * 100);

  return (
    <div className="relative">
      {/* Compact Top Bar Pill / Widget */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-pink-900/50 hover:border-pink-500/50 rounded-xl px-2.5 py-1.5 shadow-md transition-all">
        {/* Play / Pause Toggle Button */}
        <button
          onClick={handleTogglePlay}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
            state.isPlaying
              ? 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-500/30'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title={state.isPlaying ? 'Pause 1980s Miami club & casino ambient' : 'Play 1980s Miami club & casino ambient'}
        >
          {state.isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Mini Equalizer Canvas */}
        <div className="w-14 h-5 hidden sm:flex items-center">
          <canvas
            ref={canvasRef}
            width={56}
            height={20}
            className="w-full h-full rounded"
          />
        </div>

        {/* Track title badge */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-left text-xs"
        >
          <div className="hidden lg:block">
            <div className="text-[10px] uppercase font-bold text-pink-400 tracking-wider flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${state.isPlaying ? 'bg-pink-400 animate-ping' : 'bg-slate-600'}`} />
              80s Miami Lounge
            </div>
            <div className="text-[11px] text-slate-300 font-semibold truncate max-w-[120px]">
              {state.activeTrack === 'ocean-drive' && 'Ocean Drive'}
              {state.activeTrack === 'babylon-club' && 'Babylon Club'}
              {state.activeTrack === 'sunset-biscayne' && 'Sunset Biscayne'}
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Volume Slider in Bar */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-slate-800">
          <button
            onClick={handleToggleMute}
            className="text-slate-400 hover:text-pink-400 transition-colors p-1"
            title={state.isMuted ? 'Unmute' : 'Mute'}
          >
            {state.isMuted || state.masterVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : state.masterVolume < 0.5 ? (
              <Volume1 className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.isMuted ? 0 : state.masterVolume}
            onChange={handleMasterVolumeChange}
            className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            title={`Volume: ${currentVolumePercent}%`}
          />
          <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
            {state.isMuted ? '0%' : `${currentVolumePercent}%`}
          </span>
        </div>
      </div>

      {/* Expanded Popover / Luxury Mixer Control Center */}
      {isExpanded && (
        <div className="absolute top-12 right-0 z-50 w-80 sm:w-96 bg-slate-950/95 border border-pink-900/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Disc className={`w-4 h-4 text-pink-400 ${state.isPlaying ? 'animate-spin' : ''}`} />
              <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">
                1980s Miami Club & Casino Audio
              </h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Playback Status */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${state.isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                {state.isPlaying ? 'Synthesizer Live & Looping' : 'Ambient Paused'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Zero audio lag • Procedural Web Audio API
              </div>
            </div>

            <button
              onClick={handleTogglePlay}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                state.isPlaying
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
              }`}
            >
              {state.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Music</span>
                </>
              )}
            </button>
          </div>

          {/* Track Selection Tabs */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select 80s Sound Scene
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleTrackChange('ocean-drive')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  state.activeTrack === 'ocean-drive'
                    ? 'bg-pink-950/40 border-pink-500/80 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate">🌴 Ocean Drive</div>
                <div className="text-[10px] text-pink-400 font-mono mt-0.5">118 BPM Synth</div>
              </button>

              <button
                onClick={() => handleTrackChange('babylon-club')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  state.activeTrack === 'babylon-club'
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate">🍸 Babylon Club</div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">124 BPM Disco</div>
              </button>

              <button
                onClick={() => handleTrackChange('sunset-biscayne')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  state.activeTrack === 'sunset-biscayne'
                    ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate">🌅 Sunset Lounge</div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">105 BPM Chill</div>
              </button>
            </div>
          </div>

          {/* Dual Channel Mixer Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Channel Volume Sliders
            </div>

            {/* Master Volume */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                  Master Volume
                </span>
                <span className="font-mono text-[11px] text-pink-400 font-bold">
                  {Math.round(state.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.masterVolume}
                onChange={handleMasterVolumeChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            {/* Miami Synth Club Music */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  80s Synth Music (Linndrum & Bass)
                </span>
                <span className="font-mono text-[11px] text-cyan-400 font-bold">
                  {Math.round(state.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.musicVolume}
                onChange={handleMusicVolumeChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Casino Floor Ambience */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Casino Floor (Chips, Wheel, Bells)
                </span>
                <span className="font-mono text-[11px] text-amber-400 font-bold">
                  {Math.round(state.casinoVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.casinoVolume}
                onChange={handleCasinoVolumeChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Quick Mute & Close footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg border transition-all ${
                state.isMuted
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              {state.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{state.isMuted ? 'Muted' : 'Mute All'}</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              Miami 1984 Vibe Engine
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
