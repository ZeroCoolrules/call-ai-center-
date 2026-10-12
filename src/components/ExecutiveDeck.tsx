import React, { useState, useEffect } from 'react';
import { sound } from '../lib/sound';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Video,
  Building2,
  Coins,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const ExecutiveDeck: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const totalSlides = 8;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToSlide = (idx: number) => {
    sound.playChipClick();
    setCurrentSlide(idx);
  };

  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col justify-center h-full max-w-3xl mx-auto space-y-6 text-center">
            <div className="inline-block mx-auto px-3 py-1 bg-[#DC2626] text-[#F5EAD4] font-display text-sm uppercase tracking-widest border border-[#0F0B08] shadow-comic-ink">
              EXECUTIVE PRODUCT & B2B ARCHITECTURE DECK
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl text-[#F5EAD4] tracking-tight uppercase leading-none">
              DCDN CASINO
            </h1>
            
            <p className="text-lg sm:text-2xl text-[#EAB308] font-display uppercase tracking-wide">
              1980s Mob-Cinema Meets Provably Fair On-Chain Gaming
            </p>

            <p className="text-sm sm:text-base text-[#F5EAD4]/80 max-w-xl mx-auto leading-relaxed">
              Walk into a 1980s back-room casino from your phone: cinematic games, a crowd at the table via real-time video, and chips that settle on Base with mathematically certified RTP.
            </p>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-[#F5EAD4]/60 font-mono-num">
              <span>Dual-Economy (Chips + DCDN)</span>
              <span>·</span>
              <span>Base Sepolia → Mainnet</span>
              <span>·</span>
              <span>B2B Solvency Engine</span>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">
              Slide 02 · Market Pain Points & Unfair Advantage
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              The Crypto Casino Chasm vs. The Zero-Wallet Funnel
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#0F0B08] p-5 border-2 border-[#DC2626] space-y-3">
                <h3 className="font-display text-lg text-[#DC2626] uppercase">
                  Industry Problem: The 78% Drop-Off
                </h3>
                <ul className="text-xs text-[#F5EAD4]/80 space-y-2 leading-relaxed">
                  <li>• Mandatory Web3 wallet connection upfront causes 78% visitor bounce.</li>
                  <li>• Faceless, solitary slots feel sterile and lack social retention.</li>
                  <li>• Unaudited RNG creates player cynicism and regulatory friction.</li>
                  <li>• Operators face sudden insolvency risks without real-time liability gating.</li>
                </ul>
              </div>

              <div className="bg-[#0F0B08] p-5 border-2 border-[#EAB308] space-y-3">
                <h3 className="font-display text-lg text-[#EAB308] uppercase">
                  The DCDN Advantage: &lt;60s to First Spin
                </h3>
                <ul className="text-xs text-[#F5EAD4]/80 space-y-2 leading-relaxed">
                  <li>• <strong>Instant Guest Play:</strong> Visitors spin with free Chips in &lt;60 seconds—no wallet, no extension required.</li>
                  <li>• <strong>5% Conversion Funnel:</strong> Seamless transition to DCDN wagering once engaged on identical math models.</li>
                  <li>• <strong>The Video Floor:</strong> 1-to-1 WebRTC docks with real players & pulp AI characters (ElevenLabs).</li>
                  <li>• <strong>The Cover Ratio Engine:</strong> Solvency floor strictly prevents over-leveraged house exposure.</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-xs font-bold text-[#EAB308] uppercase tracking-wider">
              Slide 03 · Dual-Currency Token Architecture
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              Chips (Off-Chain) vs. DCDN (On-Chain Base)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-num border-2 border-[#382F26]">
                <thead className="bg-[#0F0B08] border-b-2 border-[#382F26] text-[#EAB308] uppercase">
                  <tr>
                    <th className="p-3">Attribute</th>
                    <th className="p-3">Chips (Free Play)</th>
                    <th className="p-3">DCDN (Real Stakes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#382F26] bg-[#181310]">
                  <tr>
                    <td className="p-3 font-sans font-bold">Ledger Location</td>
                    <td className="p-3">Platform Internal Postgres</td>
                    <td className="p-3 text-emerald-400">ERC-20 on Base (Base Sepolia Chain ID 84532)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold">Player Acquisition</td>
                    <td className="p-3">Instant signup grant, daily refill</td>
                    <td className="p-3">Self-custody wallet or platform deposit</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold">Settlement Speed</td>
                    <td className="p-3">Instant, off-chain (&lt;300ms)</td>
                    <td className="p-3">Custodial ledger per round; batch anchored</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold">Compliance Required</td>
                    <td className="p-3">Age self-declaration (18+)</td>
                    <td className="p-3 text-[#DC2626]">Jurisdiction check, KYC, AML screening</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold">Cash Value</td>
                    <td className="p-3 text-[#F5EAD4]/50">None; never convertible to DCDN</td>
                    <td className="p-3 font-bold text-[#EAB308]">Withdrawable to verified self-custody wallet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-5">
            <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">
              Slide 04 · Game Catalog & Mathematical Integrity
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              9 Launch Titles · 94.0% to 99.5% Certified RTP
            </h2>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <div className="font-bold text-[#EAB308] uppercase">Made Men</div>
                <div className="text-[11px] text-[#F5EAD4]/70">5x3 Slot · 20 Lines</div>
                <div className="font-mono-num text-emerald-400 mt-1">96.0% RTP · Med Vol</div>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <div className="font-bold text-[#EAB308] uppercase">Back Room Blackjack</div>
                <div className="text-[11px] text-[#F5EAD4]/70">6 Decks · S17 · 3:2</div>
                <div className="font-mono-num text-emerald-400 mt-1">99.5% RTP · Low Vol</div>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <div className="font-bold text-[#EAB308] uppercase">Wheel of the Don</div>
                <div className="text-[11px] text-[#F5EAD4]/70">European Single Zero</div>
                <div className="font-mono-num text-emerald-400 mt-1">97.3% RTP · Med Vol</div>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <div className="font-bold text-[#F5EAD4] uppercase">Bootleg Run</div>
                <div className="text-[11px] text-[#F5EAD4]/70">5x4 Ways · 1,024 Ways</div>
                <div className="font-mono-num text-emerald-400 mt-1">95.5% RTP · High Vol</div>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <div className="font-bold text-[#F5EAD4] uppercase">The Vault</div>
                <div className="text-[11px] text-[#F5EAD4]/70">6x5 Cluster Pays</div>
                <div className="font-mono-num text-emerald-400 mt-1">96.2% RTP · Very High</div>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <div className="font-bold text-[#F5EAD4] uppercase">High Roller Baccarat</div>
                <div className="text-[11px] text-[#F5EAD4]/70">Punto Banco · 5% Comm</div>
                <div className="font-mono-num text-emerald-400 mt-1">98.94% RTP · Low Vol</div>
              </div>
            </div>

            <div className="bg-[#0F0B08] p-3 border border-[#DC2626] text-xs font-mono-num flex items-center justify-between">
              <span>Provably Fair: HMAC-SHA256(server_seed, client_seed : nonce)</span>
              <span className="text-[#EAB308]">1B+ Round Monte Carlo Certification</span>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
              Slide 05 · The Social Video Floor
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              WebRTC Matchmaking & Conversational Pulp AI
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#0F0B08] p-4 border border-[#382F26] space-y-2">
                <span className="text-sm font-bold text-[#DC2626] font-display uppercase block">
                  Don Sal (The Pit Boss)
                </span>
                <p className="text-[#F5EAD4]/80 leading-relaxed">
                  Forty years in Havana & Brooklyn. Observant, stoic, and enforces table limits. Educates players on certified math.
                </p>
              </div>

              <div className="bg-[#0F0B08] p-4 border border-[#382F26] space-y-2">
                <span className="text-sm font-bold text-[#EAB308] font-display uppercase block">
                  Carmela (The Singer)
                </span>
                <p className="text-[#F5EAD4]/80 leading-relaxed">
                  Starlight Lounge headliner. Upbeat, celebratory, sings retro tunes upon bonus triggers, and toasting player hits.
                </p>
              </div>

              <div className="bg-[#0F0B08] p-4 border border-[#382F26] space-y-2">
                <span className="text-sm font-bold text-[#38BDF8] font-display uppercase block">
                  Lefty (The Safecracker)
                </span>
                <p className="text-[#F5EAD4]/80 leading-relaxed">
                  Veteran heist mastermind. Tells thrilling 1974 safe-cracking stories while sharing cannoli over reel spins.
                </p>
              </div>
            </div>

            <div className="bg-[#0F0B08] p-4 border-2 border-[#382F26] text-xs space-y-2">
              <span className="font-bold text-[#EAB308] uppercase block">
                Audio Ducking & Safety Compliance
              </span>
              <p className="text-[#F5EAD4]/80">
                • <strong>Audio Ducking:</strong> When companion speaks, game sounds automatically attenuate to 20% volume.<br />
                • <strong>30s Encrypted Buffer:</strong> Video streams are never recorded; a rolling 30-second buffer is wiped unless manually reported.<br />
                • <strong>AI Transparency:</strong> All synthetic companions carry an indelible "AI Character" badge.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Slide 06 · B2B Operator Solvency Engine
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              The Cover Ratio Formula & Solvency Protection
            </h2>

            <div className="bg-[#0F0B08] p-5 border-2 border-emerald-500 font-mono-num text-xs sm:text-sm space-y-3">
              <div className="text-emerald-400 font-bold text-base">
                Cover Ratio = Operator Treasury Reserves ÷ (Pending Withdrawals + Max Possible Win on Open Rounds)
              </div>
              <p className="text-[#F5EAD4]/80 text-xs font-sans">
                If any wager would cause the operator instance Cover Ratio to fall below the configured floor (default: 3.0x), the transaction is automatically rejected prior to RNG execution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-num">
              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <span className="text-[#F5EAD4]/60 block">ZERO SOLVENCY INCIDENTS:</span>
                <span className="text-emerald-400 font-bold text-base">100% Pre-Funded</span>
                <p className="text-[10px] text-[#F5EAD4]/60 mt-1">Hot float + cold multisig vault</p>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <span className="text-[#F5EAD4]/60 block">REAL-TIME VARIANCE BAND:</span>
                <span className="text-[#EAB308] font-bold text-base">±0.5 pp over 1M</span>
                <p className="text-[10px] text-[#F5EAD4]/60 mt-1">Prevents operator panic on short-run runs</p>
              </div>

              <div className="bg-[#0F0B08] p-3 border border-[#382F26]">
                <span className="text-[#F5EAD4]/60 block">SWEEPS & COMMISSIONS:</span>
                <span className="text-[#F5EAD4] font-bold text-base">Weekly Sweeps</span>
                <p className="text-[10px] text-[#F5EAD4]/60 mt-1">Automatic platform fee deduction</p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-xs font-bold text-[#EAB308] uppercase tracking-wider">
              Slide 07 · Business Model & 90-Day Milestones
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              Target Key Performance Indicators
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#0F0B08] p-4 border-2 border-[#EAB308]">
                <span className="text-2xl font-bold font-mono-num text-[#EAB308] block">5.0%</span>
                <span className="font-bold text-[#F5EAD4] block mt-1">Free to DCDN Conversion</span>
                <span className="text-[11px] text-[#F5EAD4]/60">Registered free guests becoming on-chain depositors</span>
              </div>

              <div className="bg-[#0F0B08] p-4 border-2 border-emerald-500">
                <span className="text-2xl font-bold font-mono-num text-emerald-400 block">±0.5 pp</span>
                <span className="font-bold text-[#F5EAD4] block mt-1">RTP Variance Tolerance</span>
                <span className="text-[11px] text-[#F5EAD4]/60">Realised vs theoretical return over 1,000,000 spins</span>
              </div>

              <div className="bg-[#0F0B08] p-4 border-2 border-[#38BDF8]">
                <span className="text-2xl font-bold font-mono-num text-[#38BDF8] block">25%</span>
                <span className="font-bold text-[#F5EAD4] block mt-1">Video Floor Opt-In</span>
                <span className="text-[11px] text-[#F5EAD4]/60">Active sessions matching with companions or players</span>
              </div>

              <div className="bg-[#0F0B08] p-4 border-2 border-[#DC2626]">
                <span className="text-2xl font-bold font-mono-num text-[#DC2626] block">30%</span>
                <span className="font-bold text-[#F5EAD4] block mt-1">Day-30 Retention</span>
                <span className="text-[11px] text-[#F5EAD4]/60">DCDN real-stakes active player cohort</span>
              </div>

              <div className="bg-[#0F0B08] p-4 border-2 border-[#F5EAD4]">
                <span className="text-2xl font-bold font-mono-num text-[#F5EAD4] block">0 Incidents</span>
                <span className="font-bold text-[#F5EAD4] block mt-1">Treasury Shortfalls</span>
                <span className="text-[11px] text-[#F5EAD4]/60">Strictly enforced Cover Ratio floor prevents deficit</span>
              </div>

              <div className="bg-[#0F0B08] p-4 border-2 border-[#EAB308]">
                <span className="text-2xl font-bold font-mono-num text-[#EAB308] block">&lt;300 ms</span>
                <span className="font-bold text-[#F5EAD4] block mt-1">Round Settlement</span>
                <span className="text-[11px] text-[#F5EAD4]/60">Double-entry ledger latency on game spins</span>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Slide 08 · System Architecture & Rollout Plan
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5EAD4] uppercase">
              Phased Execution: Base Sepolia to Mainnet Cutover
            </h2>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0F0B08] p-3 border-l-4 border-emerald-500 flex items-start justify-between">
                <div>
                  <strong className="text-emerald-400 uppercase">Phase 1: Math Certification & Chips Launch (Weeks 1-4)</strong>
                  <p className="text-[#F5EAD4]/70 mt-0.5">Par sheets simulated for 1B rounds; off-chain Chips guest funnel live; zero-wallet onboarding.</p>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 border border-emerald-500 font-mono-num">
                  COMPLETE
                </span>
              </div>

              <div className="bg-[#0F0B08] p-3 border-l-4 border-[#EAB308] flex items-start justify-between">
                <div>
                  <strong className="text-[#EAB308] uppercase">Phase 2: Base Sepolia Testnet & QuickNode Gateway (Weeks 5-8)</strong>
                  <p className="text-[#F5EAD4]/70 mt-0.5">Testnet ERC-20 contract live (Chain ID 84532); deposit detector streams; operator solvency portal.</p>
                </div>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 border border-[#EAB308] font-mono-num">
                  CURRENT
                </span>
              </div>

              <div className="bg-[#0F0B08] p-3 border-l-4 border-[#38BDF8] flex items-start justify-between">
                <div>
                  <strong className="text-[#38BDF8] uppercase">Phase 3: The Social Video Floor & Conversational Cast (Weeks 9-11)</strong>
                  <p className="text-[#F5EAD4]/70 mt-0.5">LiveKit SFU WebRTC integration; ElevenLabs audio ducking; safety buffer compliance tooling.</p>
                </div>
                <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 border border-[#38BDF8] font-mono-num">
                  DEPLOYED
                </span>
              </div>

              <div className="bg-[#0F0B08] p-3 border-l-4 border-[#DC2626] flex items-start justify-between">
                <div>
                  <strong className="text-[#DC2626] uppercase">Phase 4: Base Mainnet Cutover & B2B Whitelabel (Weeks 12-14)</strong>
                  <p className="text-[#F5EAD4]/70 mt-0.5">Deploy ERC-20 to Base Mainnet (Chain ID 8453); switch RPC endpoints; onboard first 3 B2B operators.</p>
                </div>
                <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 border border-[#DC2626] font-mono-num">
                  PLANNED
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* 16:9 Presentation Cabinet Frame */}
      <div className="relative aspect-[16/9] min-h-[460px] bg-[#181310] border-3 border-[#0F0B08] p-6 sm:p-10 shadow-comic-red flex flex-col justify-between overflow-hidden">
        {/* Halftone texture */}
        <div className="absolute inset-0 bg-halftone opacity-40 pointer-events-none" />

        {/* Slide Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {renderSlideContent()}
        </div>

        {/* Presentation Controls Bar */}
        <div className="relative z-10 pt-4 border-t-2 border-[#382F26] flex items-center justify-between text-xs">
          
          <div className="flex items-center gap-1.5 font-mono-num text-[#F5EAD4]/70">
            <span>Slide</span>
            <strong className="text-[#EAB308]">{currentSlide + 1}</strong>
            <span>of {totalSlides}</span>
          </div>

          {/* Slide Dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-3 h-3 border transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'bg-[#DC2626] border-[#0F0B08] shadow-comic-ink scale-125'
                    : 'bg-[#0F0B08] border-[#382F26] hover:bg-[#382F26]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={currentSlide === 0}
              onClick={() => goToSlide(currentSlide - 1)}
              className="px-3 py-1 bg-[#0F0B08] hover:bg-[#1F1914] border border-[#382F26] text-[#F5EAD4] font-bold text-xs uppercase disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              disabled={currentSlide === totalSlides - 1}
              onClick={() => goToSlide(currentSlide + 1)}
              className="px-3 py-1 bg-[#DC2626] hover:bg-[#b91c1c] border border-[#0F0B08] text-[#F5EAD4] font-bold text-xs uppercase disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-comic-ink"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[#F5EAD4]/50">
        Use <kbd className="bg-[#181310] px-1.5 py-0.5 border border-[#382F26] text-[#F5EAD4]/80">←</kbd> and{' '}
        <kbd className="bg-[#181310] px-1.5 py-0.5 border border-[#382F26] text-[#F5EAD4]/80">→</kbd> or{' '}
        <kbd className="bg-[#181310] px-1.5 py-0.5 border border-[#382F26] text-[#F5EAD4]/80">Spacebar</kbd> on your keyboard to navigate slides.
      </div>
    </div>
  );
};
