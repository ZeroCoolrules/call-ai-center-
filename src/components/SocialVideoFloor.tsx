import React, { useState, useEffect, useRef } from 'react';
import { AICompanion } from '../types/casino';
import { AI_CAST } from '../data/games';
import { sound } from '../lib/sound';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  X,
  Volume2,
  VolumeX,
  SkipForward,
  Flag,
  Shield,
  MessageSquare,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface SocialVideoFloorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialVideoFloor: React.FC<SocialVideoFloorProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion>(AI_CAST[0]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [activeSpeech, setActiveSpeech] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isDuckingActive, setIsDuckingActive] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; isAi: boolean }[]>([
    {
      sender: 'Don Sal',
      text: 'Welcome to the floor, kid. Watch the house limits and play clean. I am watching the tables.',
      isAi: true
    }
  ]);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Toggle user camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        // Fallback to simulated camera feed
        setIsCameraActive(true);
      }
    }
  };

  // Speak response with speech synthesis and trigger Audio Ducking
  const triggerCompanionSpeech = (text: string) => {
    setActiveSpeech(text);
    setIsSpeaking(true);
    setIsDuckingActive(true);
    sound.setDucking(true); // Ducks game sound to 20%!

    // Attempt browser SpeechSynthesis if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = selectedCompanion.id === 'carmela' ? 1.2 : 0.85;

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsDuckingActive(false);
        sound.setDucking(false); // Restore game sound
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsDuckingActive(false);
        sound.setDucking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer for ducking
      setTimeout(() => {
        setIsSpeaking(false);
        setIsDuckingActive(false);
        sound.setDucking(false);
      }, 4000);
    }
  };

  const handlePromptClick = (prompt: string, answer: string) => {
    sound.playChipClick();
    setChatLog(prev => [
      ...prev,
      { sender: 'You', text: prompt, isAi: false },
      { sender: selectedCompanion.name, text: answer, isAi: true }
    ]);
    triggerCompanionSpeech(answer);
  };

  const handleSkipCompanion = () => {
    sound.playChipClick();
    const currentIndex = AI_CAST.findIndex(c => c.id === selectedCompanion.id);
    const nextIndex = (currentIndex + 1) % AI_CAST.length;
    const nextCompanion = AI_CAST[nextIndex];
    setSelectedCompanion(nextCompanion);
    
    const introMsg = `${nextCompanion.name} joins your table: "${nextCompanion.catchphrases[0]}"`;
    setChatLog(prev => [
      ...prev,
      { sender: nextCompanion.name, text: introMsg, isAi: true }
    ]);
    triggerCompanionSpeech(nextCompanion.catchphrases[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0F0B08] border-l-3 border-[#0F0B08] text-[#F5EAD4] shadow-2xl flex flex-col justify-between">
      
      {/* Top Drawer Header */}
      <div className="p-3 bg-[#181310] border-b-2 border-[#382F26] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-display text-lg uppercase tracking-wide text-[#F5EAD4]">
            THE SOCIAL FLOOR
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#F5EAD4]/70 hover:text-[#DC2626] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Audio Ducking Live Notice */}
      {isDuckingActive && (
        <div className="bg-[#DC2626] text-[#F5EAD4] px-3 py-1.5 text-xs font-bold flex items-center justify-between animate-pulse">
          <span className="flex items-center gap-1.5 uppercase font-mono-num">
            <Volume2 className="w-3.5 h-3.5" />
            AUDIO DUCKED: GAME AT 20%
          </span>
          <span className="text-[10px] bg-[#0F0B08] px-1 py-0.5 uppercase">
            SPEECH ACTIVE
          </span>
        </div>
      )}

      {/* Main Video Tile Split (AI Companion on top, Player on bottom) */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        
        {/* Companion Video Tile */}
        <div className="relative bg-[#181310] border-2 border-[#382F26] h-52 sm:h-56 flex flex-col justify-between p-3 overflow-hidden shadow-comic-red">
          
          {/* Halftone texture */}
          <div className="absolute inset-0 bg-halftone opacity-30 pointer-events-none" />

          {/* Top Badges */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-[#DC2626] text-[#F5EAD4] px-1.5 py-0.5 uppercase border border-[#0F0B08] shadow-comic-ink">
                AI CHARACTER
              </span>
              <span className="text-xs font-display text-[#EAB308] uppercase">
                {selectedCompanion.name}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleSkipCompanion}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#0F0B08] hover:bg-[#2A2016] text-[10px] font-bold uppercase border border-[#382F26] text-[#F5EAD4] cursor-pointer"
                title="Skip to next companion"
              >
                <SkipForward className="w-3 h-3 text-[#EAB308]" />
                SKIP
              </button>
              <button
                onClick={() => setReportModalOpen(true)}
                className="p-1 bg-[#0F0B08] hover:bg-[#DC2626] text-[10px] border border-[#382F26] text-[#F5EAD4] cursor-pointer"
                title="Report user or companion"
              >
                <Flag className="w-3 h-3 text-[#DC2626] hover:text-[#F5EAD4]" />
              </button>
            </div>
          </div>

          {/* Companion Center Portrait Avatar */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div
              className={`w-20 h-20 rounded-full border-3 flex items-center justify-center transition-all ${
                isSpeaking ? 'border-[#EAB308] scale-105 shadow-comic-mustard' : 'border-[#DC2626]'
              }`}
              style={{ backgroundColor: selectedCompanion.accentColor + '22' }}
            >
              <span className="font-display text-2xl font-black text-[#F5EAD4]">
                {selectedCompanion.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#F5EAD4]/80 mt-1">
              {selectedCompanion.title}
            </span>
          </div>

          {/* Subtitles / Speech Bubble */}
          <div className="relative z-10 bg-[#0F0B08]/90 border border-[#382F26] p-2 text-xs leading-snug min-h-[44px] flex items-center">
            <p className="text-[#F5EAD4] italic">
              {activeSpeech || selectedCompanion.bio}
            </p>
          </div>
        </div>

        {/* Player Camera Tile */}
        <div className="relative bg-[#181310] border-2 border-[#382F26] h-32 flex flex-col justify-between p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#F5EAD4]/70 uppercase">You (Player)</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleCamera}
                className="p-1 bg-[#0F0B08] hover:bg-[#1F1914] border border-[#382F26] cursor-pointer"
                title="Toggle WebRTC Camera"
              >
                {isCameraActive ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-[#DC2626]" />}
              </button>
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className="p-1 bg-[#0F0B08] hover:bg-[#1F1914] border border-[#382F26] cursor-pointer"
                title="Toggle Microphone"
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-[#DC2626]" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-20 object-cover bg-black border border-[#382F26]"
            />
          ) : (
            <div className="h-20 flex flex-col items-center justify-center bg-[#0F0B08] border border-dashed border-[#382F26] text-xs text-[#F5EAD4]/50">
              <span>Camera Inactive</span>
              <button
                onClick={toggleCamera}
                className="text-[10px] text-[#EAB308] underline mt-0.5 cursor-pointer"
              >
                Click to enable preview
              </button>
            </div>
          )}
        </div>

        {/* Quick Conversation Prompts */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase text-[#F5EAD4]/60">
            Pulp Speech Actions
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {selectedCompanion.sampleResponses.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(item.prompt, item.text)}
                className="text-left p-2 bg-[#181310] hover:bg-[#2A2016] border border-[#382F26] hover:border-[#EAB308] text-xs transition-colors cursor-pointer text-[#F5EAD4]/90"
              >
                "{item.prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Log */}
        <div className="space-y-2 border-t border-[#382F26] pt-2">
          <span className="text-[11px] font-bold uppercase text-[#F5EAD4]/60">
            Table Transcript
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
            {chatLog.map((msg, i) => (
              <div key={i} className="leading-tight">
                <span className={msg.isAi ? 'font-bold text-[#EAB308]' : 'font-bold text-[#DC2626]'}>
                  {msg.sender}:
                </span>{' '}
                <span className="text-[#F5EAD4]/80">{msg.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="p-2.5 bg-[#181310] border-t-2 border-[#382F26] text-[10px] text-[#F5EAD4]/50 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#EAB308]" />
          30s Rolling Buffer · Never recorded
        </span>
        <span>Adults Only 21+</span>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="absolute inset-0 z-50 bg-[#0F0B08]/95 p-4 flex flex-col justify-center items-center text-center">
          <Shield className="w-8 h-8 text-[#DC2626] mb-2" />
          <h4 className="font-display text-lg text-[#F5EAD4] uppercase mb-1">
            Safety & Moderation
          </h4>
          <p className="text-xs text-[#F5EAD4]/70 mb-4 max-w-xs">
            Submitting a report packages the last 30-second rolling encrypted video buffer for compliance review.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playChipClick();
                setReportModalOpen(false);
              }}
              className="px-4 py-1.5 bg-[#DC2626] text-[#F5EAD4] font-display text-xs uppercase border border-[#0F0B08] cursor-pointer"
            >
              Confirm Report
            </button>
            <button
              onClick={() => setReportModalOpen(false)}
              className="px-3 py-1.5 bg-[#1F1914] text-[#F5EAD4]/70 font-display text-xs uppercase border border-[#382F26] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
