import React, { useState } from 'react';
import { DailyMission, GameId } from '../types/casino';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import {
  Coins,
  CheckCircle2,
  Play,
  Gift,
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';

interface DailyMissionsProps {
  missions: DailyMission[];
  onClaimReward: (missionId: string, rewardChips: number) => void;
  onNavigateGame: (gameId: GameId) => void;
  onOpenVideoFloor: () => void;
  onOpenProvablyFair: () => void;
  onResetMissions?: () => void;
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({
  missions,
  onClaimReward,
  onNavigateGame,
  onOpenVideoFloor,
  onOpenProvablyFair,
  onResetMissions,
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);
  const [syndicateBonusClaimed, setSyndicateBonusClaimed] = useState<boolean>(false);

  const completedCount = missions.filter(m => m.current >= m.target).length;
  const claimedCount = missions.filter(m => m.claimed).length;
  const allCompleted = completedCount === missions.length;
  const totalAvailableReward = missions
    .filter(m => m.current >= m.target && !m.claimed)
    .reduce((sum, m) => sum + m.rewardChips, 0);

  const globalPct = Math.round((completedCount / missions.length) * 100);

  const handleClaim = (e: React.MouseEvent, mission: DailyMission) => {
    e.stopPropagation();
    if (mission.claimed || mission.current < mission.target) return;

    sound.playChipClick();
    setClaimingId(mission.id);

    // Confetti pop from click coordinate
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 55,
      spread: 65,
      origin: { x, y },
      colors: ['#EAB308', '#FDE047', '#DC2626', '#F5EAD4', '#FFFFFF']
    });

    setTimeout(() => {
      sound.playWinChime(false);
      onClaimReward(mission.id, mission.rewardChips);
      setClaimingId(null);
      setJustClaimedId(mission.id);

      setTimeout(() => {
        setJustClaimedId(null);
      }, 2500);
    }, 400);
  };

  const handleClaimAll = () => {
    sound.playChipClick();
    missions.forEach(m => {
      if (m.current >= m.target && !m.claimed) {
        onClaimReward(m.id, m.rewardChips);
      }
    });

    sound.playWinChime(true);
    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#EAB308', '#FDE047', '#DC2626', '#F5EAD4']
    });
  };

  const handleClaimSyndicateBonus = () => {
    if (syndicateBonusClaimed || !allCompleted) return;
    sound.playChipClick();
    sound.playWinChime(true);
    setSyndicateBonusClaimed(true);
    onClaimReward('syndicate-bonus', 5000);

    confetti({
      particleCount: 160,
      spread: 110,
      origin: { y: 0.5 },
      colors: ['#EAB308', '#FDE047', '#DC2626', '#38BDF8', '#FFFFFF']
    });
  };

  const handleMissionAction = (mission: DailyMission) => {
    sound.playChipClick();
    if (mission.actionGameId) {
      onNavigateGame(mission.actionGameId);
    } else if (mission.category === 'social') {
      onOpenVideoFloor();
    } else if (mission.category === 'fairness') {
      onOpenProvablyFair();
    }
  };

  return (
    <div className="bg-[#10131A] border-3 border-[#0A0A0C] p-5 sm:p-6 shadow-comic-red relative overflow-hidden">
      {/* Halftone texture overlay */}
      <div className="absolute inset-0 bg-halftone opacity-35 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#202534] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-[#DC2626] text-[#F5EAD4] px-2 py-0.5 uppercase tracking-widest border border-[#0A0A0C] shadow-comic-ink">
              DAILY REFILL CONTRACTS
            </span>
            <span className="text-xs text-[#EAB308] font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
              Resets Every 24 Hours
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[#F5EAD4] uppercase tracking-wide flex items-center gap-2">
            DAILY MISSIONS & CHIP BOUNTIES
          </h2>

          <p className="text-xs text-[#F5EAD4]/75">
            Complete daily house tasks to earn off-chain Chips. Watch milestones illuminate in real time.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {totalAvailableReward > 0 && (
            <button
              onClick={handleClaimAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] font-display text-xs uppercase border-2 border-[#0A0A0C] shadow-comic-ink cursor-pointer animate-mustard-glow font-black tracking-wide"
            >
              <Gift className="w-4 h-4 fill-current" />
              CLAIM ALL (+{totalAvailableReward.toLocaleString()} CHIPS)
            </button>
          )}

          {onResetMissions && (
            <button
              onClick={() => {
                sound.playChipClick();
                onResetMissions();
              }}
              className="p-2 bg-[#171A24] hover:bg-[#202534] text-[#F5EAD4]/70 hover:text-[#F5EAD4] border border-[#2B3144] text-xs cursor-pointer transition-colors"
              title="Reset mission counters (Demo testing)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Syndicate Progress Bar with Milestones */}
      <div
        className={`relative z-10 my-4 bg-[#0B0D12] p-4 border-2 transition-all duration-500 ${
          allCompleted
            ? 'border-[#EAB308] animate-mustard-glow glow-mustard'
            : 'border-[#222838]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-display text-lg font-mono-num transition-all duration-500 ${
                allCompleted
                  ? 'bg-[#EAB308] text-[#0A0A0C] border-[#FDE047] glow-mustard font-black scale-110'
                  : 'bg-[#151922] text-[#EAB308] border-[#2B3144]'
              }`}
            >
              {allCompleted ? <Sparkles className="w-5 h-5" /> : `${completedCount}/${missions.length}`}
            </div>
            <div>
              <div className="text-xs font-bold text-[#F5EAD4] uppercase flex items-center gap-2">
                <span>Contracts Fulfilled: {completedCount} of {missions.length} ({globalPct}%)</span>
                {allCompleted && (
                  <span className="text-[10px] bg-[#EAB308] text-[#0A0A0C] px-1.5 py-0.2 font-black uppercase">
                    100% UNLOCKED
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#F5EAD4]/60">
                {allCompleted
                  ? 'All 5 daily syndicate obligations fulfilled! Collect your 5,000 Chips Jackpot.'
                  : `Satisfy ${missions.length - completedCount} more contract${missions.length - completedCount > 1 ? 's' : ''} to unlock the +5,000 Chips Syndicate Bonus.`}
              </div>
            </div>
          </div>

          {/* Syndicate completion reward claim badge */}
          <div className="flex items-center gap-2">
            {allCompleted ? (
              <button
                disabled={syndicateBonusClaimed}
                onClick={handleClaimSyndicateBonus}
                className={`px-4 py-2 font-display text-xs uppercase border-2 cursor-pointer transition-all ${
                  syndicateBonusClaimed
                    ? 'bg-[#151922] text-emerald-400 border-emerald-500'
                    : 'bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] border-[#0A0A0C] shadow-comic-ink animate-bounce font-black glow-mustard'
                }`}
              >
                {syndicateBonusClaimed ? '✓ SYNDICATE BONUS CLAIMED (+5,000)' : '★ CLAIM +5,000 CHIPS BONUS ★'}
              </button>
            ) : (
              <div className="text-right text-[11px] font-mono-num text-[#EAB308] bg-[#151922] px-3 py-1.5 border border-[#2B3144]">
                Syndicate Jackpot: +5,000 CHIPS
              </div>
            )}
          </div>
        </div>

        {/* Global Animated Milestone Track */}
        <div className="relative pt-2 pb-1">
          <div className="relative w-full bg-[#151922] h-3.5 border border-[#2B3144] overflow-hidden">
            {/* Animated Fill Bar */}
            <div
              className={`h-full transition-all duration-700 ease-out relative ${
                allCompleted
                  ? 'bg-gradient-to-r from-[#DC2626] via-[#EAB308] to-[#FDE047] glow-mustard animate-mustard-glow'
                  : 'bg-gradient-to-r from-[#DC2626] to-[#EAB308]'
              }`}
              style={{ width: `${globalPct}%` }}
            >
              {/* Shimmer sweep effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Milestone markers across the 5 contract slots */}
          <div className="flex justify-between items-center text-[10px] font-mono-num text-[#F5EAD4]/50 mt-1.5 px-0.5">
            {[1, 2, 3, 4, 5].map(step => {
              const isReached = completedCount >= step;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-1 transition-colors ${
                    isReached ? 'text-[#EAB308] font-bold' : ''
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full border transition-all ${
                      isReached
                        ? 'bg-[#EAB308] border-[#FDE047] glow-mustard-subtle scale-125'
                        : 'bg-[#151922] border-[#2B3144]'
                    }`}
                  />
                  <span>M{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Daily Mission Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {missions.map(mission => {
          const isDone = mission.current >= mission.target;
          const isClaimed = mission.claimed;
          const pct = Math.min(100, Math.round((mission.current / mission.target) * 100));
          const isClaiming = claimingId === mission.id;
          const wasJustClaimed = justClaimedId === mission.id;

          // Milestone checkmarks (25%, 50%, 75%, 100%)
          const reached25 = pct >= 25;
          const reached50 = pct >= 50;
          const reached75 = pct >= 75;
          const reached100 = pct >= 100;

          return (
            <div
              key={mission.id}
              className={`relative bg-[#141720] border-2 p-4 flex flex-col justify-between transition-all duration-300 ${
                isClaimed
                  ? 'border-[#222736] opacity-75'
                  : isDone
                  ? 'border-[#EAB308] animate-mustard-glow glow-mustard'
                  : 'border-[#242A3A] hover:border-[#DC2626]'
              }`}
            >
              {/* Card Header & Title */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg text-[#F5EAD4] uppercase leading-snug flex items-center gap-1.5">
                    {isDone && !isClaimed && (
                      <Star className="w-4 h-4 text-[#EAB308] fill-current animate-spin shrink-0" style={{ animationDuration: '4s' }} />
                    )}
                    <span>{mission.title}</span>
                  </h3>

                  <div
                    className={`shrink-0 flex items-center gap-1 font-mono-num text-xs font-bold px-2 py-0.5 border transition-all ${
                      isDone && !isClaimed
                        ? 'bg-[#EAB308] text-[#0A0A0C] border-[#FDE047] glow-mustard-subtle'
                        : 'bg-[#0B0D12] text-[#EAB308] border-[#2A3042]'
                    }`}
                  >
                    <Coins className="w-3 h-3 text-[#EAB308] fill-current" />
                    +{mission.rewardChips.toLocaleString()}
                  </div>
                </div>

                <p className="text-xs text-[#F5EAD4]/75 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              {/* Progress Bar with Milestone Animation & Celebratory Mustard Glow */}
              <div className="my-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono-num">
                  <span className="text-[#F5EAD4]/60 flex items-center gap-1">
                    <span>Milestone Progress</span>
                    {isDone && (
                      <span className="text-[#EAB308] font-bold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> FULFILLED
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-bold transition-colors ${
                      isDone ? 'text-[#EAB308]' : 'text-[#F5EAD4]'
                    }`}
                  >
                    {mission.current} / {mission.target} ({pct}%)
                  </span>
                </div>

                {/* Animated Progress Bar Enclosure */}
                <div
                  className={`relative w-full bg-[#0B0D12] h-3 border overflow-hidden transition-all duration-500 ${
                    isDone
                      ? 'border-[#EAB308] glow-mustard'
                      : 'border-[#262C3E]'
                  }`}
                >
                  {/* Progress Fill with celebratory gradient & shimmer */}
                  <div
                    className={`h-full transition-all duration-700 ease-out relative ${
                      isDone
                        ? 'bg-gradient-to-r from-[#DC2626] via-[#EAB308] to-[#FDE047] animate-mustard-glow'
                        : 'bg-gradient-to-r from-[#DC2626] to-[#EAB308]'
                    }`}
                    style={{ width: `${pct}%` }}
                  >
                    {/* Animated moving shimmer light */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>

                {/* Milestone Tick Dots (25%, 50%, 75%, 100%) */}
                <div className="flex justify-between items-center text-[10px] font-mono-num text-[#F5EAD4]/45 px-0.5 pt-0.5">
                  <span className={`transition-colors ${reached25 ? 'text-[#EAB308] font-bold' : ''}`}>
                    {reached25 ? '●' : '○'} 25%
                  </span>
                  <span className={`transition-colors ${reached50 ? 'text-[#EAB308] font-bold' : ''}`}>
                    {reached50 ? '●' : '○'} 50%
                  </span>
                  <span className={`transition-colors ${reached75 ? 'text-[#EAB308] font-bold' : ''}`}>
                    {reached75 ? '●' : '○'} 75%
                  </span>
                  <span
                    className={`transition-colors ${
                      reached100 ? 'text-[#EAB308] font-black glow-mustard-subtle' : ''
                    }`}
                  >
                    {reached100 ? '★ 100%' : '○ 100%'}
                  </span>
                </div>
              </div>

              {/* Action / Claim Footer */}
              <div className="pt-2 border-t border-[#202534] flex items-center justify-between gap-2">
                {isClaimed ? (
                  <div className="w-full py-1.5 bg-[#0B0D12] border border-emerald-900/60 text-emerald-400 text-xs font-bold uppercase flex items-center justify-center gap-1.5 font-mono-num">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    BOUNTY COLLECTED
                  </div>
                ) : isDone ? (
                  <button
                    disabled={isClaiming}
                    onClick={e => handleClaim(e, mission)}
                    className="w-full py-2 bg-[#EAB308] hover:bg-[#FACC15] text-[#0A0A0C] font-display text-sm uppercase border-2 border-[#0A0A0C] shadow-comic-ink transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 font-black glow-mustard animate-mustard-glow"
                  >
                    <Gift className={`w-4 h-4 ${isClaiming ? 'animate-spin' : ''}`} />
                    {isClaiming ? 'COLLECTING...' : `CLAIM +${mission.rewardChips.toLocaleString()} CHIPS`}
                  </button>
                ) : (
                  <button
                    onClick={() => handleMissionAction(mission)}
                    className="w-full py-1.5 bg-[#171A24] hover:bg-[#202534] text-[#F5EAD4] border border-[#2B3144] hover:border-[#DC2626] text-xs font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current text-[#DC2626]" />
                    {mission.actionGameId
                      ? 'Launch Game'
                      : mission.category === 'social'
                      ? 'Open Floor'
                      : 'Verify Engine'}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#F5EAD4]/50" />
                  </button>
                )}
              </div>

              {/* Stamped Claim overlay */}
              {wasJustClaimed && (
                <div className="absolute inset-0 z-20 bg-[#0A0A0C]/90 flex items-center justify-center animate-fade-in pointer-events-none">
                  <div className="border-3 border-[#EAB308] text-[#EAB308] font-display text-2xl uppercase px-4 py-1 rotate-[-10deg] shadow-comic-ink tracking-widest glow-mustard">
                    PAID IN CASH
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
