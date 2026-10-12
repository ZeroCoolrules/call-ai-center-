import React from 'react';
import { PlayerMode, PlayerProfile } from '../types/casino';
import { Volume2, VolumeX, ShieldCheck, Video, Wallet, Building2, BookOpen, User, Banknote } from 'lucide-react';
import { sound } from '../lib/sound';

interface HeaderProps {
  currentMode: PlayerMode;
  onToggleMode: (mode: PlayerMode) => void;
  chipsBalance: number;
  dcdnBalance: number;
  activeTab: 'lobby' | 'provably-fair' | 'operator' | 'deck';
  setActiveTab: (tab: 'lobby' | 'provably-fair' | 'operator' | 'deck') => void;
  isFloorOpen: boolean;
  setIsFloorOpen: (open: boolean) => void;
  onOpenWallet: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  unclaimedMissionsCount?: number;
  activeProfile?: PlayerProfile;
  onOpenProfileModal?: () => void;
  pendingDepositsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onToggleMode,
  chipsBalance,
  dcdnBalance,
  activeTab,
  setActiveTab,
  isFloorOpen,
  setIsFloorOpen,
  onOpenWallet,
  isMuted,
  onToggleMute,
  unclaimedMissionsCount = 0,
  activeProfile,
  onOpenProfileModal,
  pendingDepositsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F0B08] border-b-3 border-[#0F0B08] text-[#F5EAD4] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark in display face */}
        <button
          onClick={() => setActiveTab('lobby')}
          className="text-left group flex items-baseline gap-2 shrink-0 cursor-pointer focus-visible:outline-none"
        >
          <span className="font-display text-2xl sm:text-3xl tracking-wider text-[#F5EAD4] group-hover:text-[#EAB308] transition-colors uppercase">
            DCDN CASINO
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-[#DC2626] text-[#F5EAD4] border border-[#0F0B08] shadow-comic-ink hidden sm:inline-block">
            1980s MOB NOIR
          </span>
        </button>

        {/* Zone 2: Navigation Links (single-line, clean hover underlines) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold tracking-wide">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lobby'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/80 hover:text-[#F5EAD4]'
            }`}
          >
            <span>Lobby & Games</span>
            {unclaimedMissionsCount > 0 && (
              <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.2 bg-[#EAB308] text-[#0F0B08] border border-[#0F0B08] shadow-comic-ink animate-bounce">
                {unclaimedMissionsCount} CLAIM
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('provably-fair')}
            className={`flex items-center gap-1.5 transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'provably-fair'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/80 hover:text-[#F5EAD4]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#EAB308]" />
            Provably Fair
          </button>

          <button
            onClick={() => setActiveTab('operator')}
            className={`flex items-center gap-1.5 transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'operator'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/80 hover:text-[#F5EAD4]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#38BDF8]" />
            <span>Operator & Cage</span>
            {pendingDepositsCount > 0 && (
              <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.2 bg-[#DC2626] text-[#F5EAD4] border border-[#0F0B08] shadow-comic-ink animate-pulse">
                {pendingDepositsCount} SLIPS
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deck')}
            className={`flex items-center gap-1.5 transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'deck'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/80 hover:text-[#F5EAD4]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#F5EAD4]/70" />
            Executive Pitch
          </button>
        </nav>

        {/* Zone 3: Actions, Profiles & Balances */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Active Player Profile Button */}
          {activeProfile && onOpenProfileModal && (
            <button
              onClick={() => {
                sound.playChipClick();
                onOpenProfileModal();
              }}
              className="flex items-center gap-2 px-2.5 py-1 bg-[#1F1914] border-2 border-[#382F26] hover:border-[#EAB308] transition-colors cursor-pointer group"
              title="Switch profile or request cash deposit"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-display text-xs text-[#F5EAD4] border border-[#0F0B08]"
                style={{ backgroundColor: activeProfile.avatarColor }}
              >
                {activeProfile.username.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex flex-col text-left leading-tight hidden sm:flex">
                <span className="text-[10px] text-[#EAB308] font-bold uppercase truncate max-w-[90px]">
                  {activeProfile.nickname}
                </span>
                <span className="text-xs font-mono-num font-bold text-emerald-400">
                  ${activeProfile.cashBalance.toFixed(2)}
                </span>
              </div>
            </button>
          )}

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center p-0.5 bg-[#1F1914] border-2 border-[#382F26] rounded">
            <button
              onClick={() => onToggleMode('CHIPS')}
              className={`px-2 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'CHIPS'
                  ? 'bg-[#EAB308] text-[#0F0B08] shadow-sm font-extrabold'
                  : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
              }`}
              title="Free play credits (Off-chain)"
            >
              CHIPS
            </button>
            <button
              onClick={() => onToggleMode('DCDN')}
              className={`px-2 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'DCDN'
                  ? 'bg-[#DC2626] text-[#F5EAD4] shadow-sm font-extrabold'
                  : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
              }`}
              title="Real-stakes cash games (Base Sepolia / Cash Balance)"
            >
              CASH
            </button>
          </div>

          {/* Dynamic Balance Display */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1914] border-2 border-[#382F26] hover:border-[#EAB308] transition-colors cursor-pointer group"
          >
            <Wallet className="w-3.5 h-3.5 text-[#EAB308] group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-[#F5EAD4]/60 uppercase tracking-wider font-semibold">
                {currentMode === 'CHIPS' ? 'Free Balance' : 'Cash Game Wallet'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono-num text-[#F5EAD4]">
                {currentMode === 'CHIPS'
                  ? `${chipsBalance.toLocaleString()} CHIPS`
                  : `$${(activeProfile?.cashBalance ?? dcdnBalance).toFixed(2)}`}
              </span>
            </div>
          </button>

          {/* Video Floor Drawer Toggle */}
          <button
            onClick={() => {
              sound.playChipClick();
              setIsFloorOpen(!isFloorOpen);
            }}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 font-bold text-xs border-2 transition-all cursor-pointer uppercase ${
              isFloorOpen
                ? 'bg-[#DC2626] text-[#F5EAD4] border-[#0F0B08] shadow-comic-ink'
                : 'bg-[#1F1914] text-[#F5EAD4] border-[#382F26] hover:border-[#DC2626]'
            }`}
            title="Open the Social Video Floor (AI & Player Match)"
          >
            <Video className="w-3.5 h-3.5 text-[#EAB308]" />
            <span className="hidden xl:inline">The Floor</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 text-[#F5EAD4]/80 hover:text-[#F5EAD4] hover:bg-[#1F1914] border border-transparent hover:border-[#382F26] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Casino Audio' : 'Mute Casino Audio'}
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#DC2626]" /> : <Volume2 className="w-4 h-4 text-[#EAB308]" />}
          </button>
        </div>
      </div>
    </header>
  );
};

