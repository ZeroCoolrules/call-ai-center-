import React, { useState } from 'react';
import { GameMetadata, GameCategory, GameId, DailyMission } from '../types/casino';
import { GAME_CATALOG } from '../data/games';
import { Play, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';
import { sound } from '../lib/sound';
import { DailyMissions } from './DailyMissions';

interface GameCatalogProps {
  onSelectGame: (gameId: GameId) => void;
  onOpenProvablyFair: () => void;
  onOpenVideoFloor: () => void;
  missions: DailyMission[];
  onClaimMissionReward: (missionId: string, rewardChips: number) => void;
  onResetMissions: () => void;
}

export const GameCatalog: React.FC<GameCatalogProps> = ({
  onSelectGame,
  onOpenProvablyFair,
  onOpenVideoFloor,
  missions,
  onClaimMissionReward,
  onResetMissions,
}) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');

  const filteredGames = GAME_CATALOG.filter(game => {
    if (activeCategory === 'slots') return game.type === 'slot';
    if (activeCategory === 'tables') return game.type === 'table';
    if (activeCategory === 'high-volatility') return game.volatility === 'High' || game.volatility === 'Very High';
    return true;
  });

  const featuredGame = GAME_CATALOG.find(g => g.id === 'made-men')!;

  return (
    <div className="space-y-8">
      
      {/* Cinematic Marquee Hero Panel */}
      <div className="relative bg-[#10131A] border-3 border-[#0A0A0C] p-6 sm:p-8 shadow-comic-red overflow-hidden">
        {/* Halftone texture */}
        <div className="absolute inset-0 bg-halftone opacity-50 pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#EAB308] uppercase tracking-wider">
            <Flame className="w-4 h-4 text-[#DC2626]" />
            <span>FEATURED MOB-CINEMA RELEASE · PROVABLY FAIR</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl text-[#F5EAD4] tracking-tight uppercase leading-none">
            MADE MEN
          </h1>

          <p className="text-sm sm:text-base text-[#F5EAD4]/90 font-normal leading-relaxed">
            Step into the 1982 initiation sit-down. 20 paylines of disciplined math, Tommy Gun scatters, and The Don Wilds. Certified 96.0% RTP with live HMAC-SHA256 verification on every single spin.
          </p>

          <div className="flex items-center gap-3 text-xs text-[#F5EAD4]/70 pt-1">
            <span className="font-mono-num font-bold text-[#EAB308]">96.00% Certified RTP</span>
            <span aria-hidden="true">·</span>
            <span>Medium Volatility</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">Max Multiplier 1,000x</span>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                sound.playChipClick();
                onSelectGame('made-men');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-lg uppercase border-2 border-[#0A0A0C] shadow-comic-ink transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              TAKE A SEAT
            </button>

            <button
              onClick={() => {
                sound.playChipClick();
                onSelectGame('back-room-blackjack');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-[#151822] hover:bg-[#202534] text-[#F5EAD4] font-display text-base uppercase border-2 border-[#262C3D] hover:border-[#EAB308] transition-colors cursor-pointer"
            >
              PLAY BLACKJACK (99.5% RTP)
            </button>
          </div>
        </div>
      </div>

      {/* Daily Missions Component */}
      <DailyMissions
        missions={missions}
        onClaimReward={onClaimMissionReward}
        onNavigateGame={onSelectGame}
        onOpenVideoFloor={onOpenVideoFloor}
        onOpenProvablyFair={onOpenProvablyFair}
        onResetMissions={onResetMissions}
      />

      {/* Filter Tabs (Interactive Segmented Control) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#242A3A] pb-4">
        <div>
          <h2 className="font-display text-2xl text-[#F5EAD4] uppercase tracking-wide">
            THE CASINO FLOOR
          </h2>
          <p className="text-xs text-[#F5EAD4]/60">
            9 certified titles · Off-chain Chips or Base Sepolia DCDN · Real-time cryptographic seeds
          </p>
        </div>

        {/* Clean segmented control */}
        <div className="flex items-center gap-1 p-1 bg-[#10131A] border-2 border-[#262C3D]">
          {[
            { id: 'all', label: 'All Titles' },
            { id: 'slots', label: 'Slots' },
            { id: 'tables', label: 'Table Games' },
            { id: 'high-volatility', label: 'High Heat' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playChipClick();
                setActiveCategory(tab.id as GameCategory);
              }}
              className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === tab.id
                  ? 'bg-[#DC2626] text-[#F5EAD4] shadow-comic-ink font-extrabold'
                  : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comic Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <div
            key={game.id}
            className={`group flex flex-col justify-between bg-[#12151E] border-3 border-[#0A0A0C] p-5 transition-all ${
              game.isPlayable
                ? 'hover:border-[#EAB308] hover:-translate-y-1 shadow-comic-red'
                : 'opacity-85 border-[#1E2330]'
            }`}
          >
            <div className="space-y-3">
              {/* Card Header & Badging */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl text-[#F5EAD4] group-hover:text-[#EAB308] transition-colors uppercase">
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#F5EAD4]/60 mt-0.5">
                    <span>{game.type === 'slot' ? 'Slot' : 'Table'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num font-semibold text-[#EAB308]">{game.rtp.toFixed(1)}% RTP</span>
                    <span aria-hidden="true">·</span>
                    <span>{game.volatility}</span>
                  </div>
                </div>

                {game.isPlayable ? (
                  <span className="text-[10px] font-bold bg-[#DC2626] text-[#F5EAD4] px-1.5 py-0.5 uppercase border border-[#0A0A0C] shadow-comic-ink">
                    PLAY NOW
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-[#1C202C] text-[#F5EAD4]/60 px-1.5 py-0.5 uppercase border border-[#262C3D]">
                    V1 ROADMAP
                  </span>
                )}
              </div>

              {/* Tagline / Rules */}
              <p className="text-xs text-[#F5EAD4]/80 leading-relaxed min-h-[36px]">
                {game.tagline}
              </p>

              {/* Certified Variants list */}
              <div className="text-[11px] text-[#F5EAD4]/50 border-t border-[#242A3A] pt-2 flex items-center justify-between">
                <span>RTP Variants: {game.rtpVariants.join('% · ')}%</span>
                <span className="font-mono-num">Max: {game.maxMultiplier}x</span>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-4 mt-2">
              {game.isPlayable ? (
                <button
                  onClick={() => {
                    sound.playChipClick();
                    onSelectGame(game.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-base uppercase border-2 border-[#0A0A0C] shadow-comic-ink transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  LAUNCH GAME
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2 bg-[#151822] text-[#F5EAD4]/50 font-display text-sm uppercase border border-[#242A3A] cursor-not-allowed"
                >
                  AUDIT IN PROGRESS
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Math Footer Banner */}
      <div className="bg-[#12151E] border-2 border-[#242A3A] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F5EAD4]/80">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-[#EAB308] shrink-0" />
          <div>
            <span className="font-bold text-[#F5EAD4]">Certified RNG & Independent Par Sheets:</span>{' '}
            All math models are simulated for 1 Billion+ rounds. House edge is strictly bounded between 0.5% and 5.0%.
          </div>
        </div>
        <button
          onClick={onOpenProvablyFair}
          className="text-xs font-bold text-[#EAB308] hover:underline uppercase whitespace-nowrap cursor-pointer"
        >
          Verify Cryptographic Seeds →
        </button>
      </div>
    </div>
  );
};
