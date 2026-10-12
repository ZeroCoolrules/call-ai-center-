import React, { useState } from 'react';
import { ProvablyFairRound } from '../types/casino';
import {
  hmacSha256,
  sha256,
  hmacToFloat,
  getReelStopsFromHmac,
  runMonteCarloSimulation
} from '../lib/provablyFair';
import { sound } from '../lib/sound';
import { ShieldCheck, Play, CheckCircle2, RotateCcw, Cpu, Calculator, X } from 'lucide-react';

interface ProvablyFairModalProps {
  recentRounds: ProvablyFairRound[];
  isOpen: boolean;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  recentRounds,
  isOpen,
  onClose,
}) => {
  // Verifier calculator inputs
  const [testServerSeed, setTestServerSeed] = useState<string>(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  const [testClientSeed, setTestClientSeed] = useState<string>('mob-boss-1982');
  const [testNonce, setTestNonce] = useState<number>(1);
  const [verificationResult, setVerificationResult] = useState<{
    serverSeedHash: string;
    hmacHex: string;
    outcomeFloat: number;
    reelStops: number[];
  } | null>(null);

  // Monte Carlo simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpinsCount, setSimSpinsCount] = useState<number>(25000);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simLiveRtp, setSimLiveRtp] = useState<number>(0);
  const [simResults, setSimResults] = useState<{
    spins: number;
    realizedRtp: number;
    hitFrequency: number;
    maxMultiplier: number;
    bonusHitCount: number;
  } | null>(null);

  const handleVerify = async () => {
    sound.playChipClick();
    const hash = await sha256(testServerSeed);
    const message = `${testClientSeed}:${testNonce}`;
    const hmacHex = await hmacSha256(testServerSeed, message);
    const outcomeFloat = hmacToFloat(hmacHex);
    const reelStops = getReelStopsFromHmac(hmacHex);

    setVerificationResult({
      serverSeedHash: hash,
      hmacHex,
      outcomeFloat,
      reelStops
    });
  };

  const handleRunMonteCarlo = async () => {
    sound.playChipClick();
    setIsSimulating(true);
    setSimProgress(0);
    setSimLiveRtp(0);
    setSimResults(null);

    const res = await runMonteCarloSimulation(simSpinsCount, (prog, liveRtp) => {
      setSimProgress(prog);
      setSimLiveRtp(liveRtp);
    });

    setSimResults(res);
    setIsSimulating(false);
    sound.playWinChime(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0B08]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#181310] border-3 border-[#0F0B08] p-5 sm:p-7 text-[#F5EAD4] shadow-comic-red my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#EAB308]" />
            <div>
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide">
                PROVABLY FAIR VERIFICATION & MATH ENGINE
              </h2>
              <p className="text-xs text-[#F5EAD4]/70">
                HMAC-SHA256 Cryptographic Transparency · Certified 96.0% RTP Model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#F5EAD4]/70 hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1: The Cryptographic Formula Explanation */}
        <div className="bg-[#0F0B08] border-2 border-[#382F26] p-4 mb-6">
          <span className="text-xs font-bold uppercase text-[#EAB308]">
            Cryptographic Pipeline Invariant
          </span>
          <div className="font-mono-num text-xs sm:text-sm text-[#F5EAD4] mt-1 space-y-1 bg-[#181310] p-3 border border-[#382F26]">
            <div>1. Server Commitment: SHA256(server_seed) published BEFORE round</div>
            <div>2. Client Input: client_seed + incremental nonce</div>
            <div>3. Deterministic Outcome: HMAC-SHA256(server_seed, client_seed : nonce)</div>
            <div>4. Float Mapping: First 32 bits (8 hex chars) / 2^32 → [0, 1)</div>
          </div>
        </div>

        {/* Section 2: Interactive Verification Calculator */}
        <div className="bg-[#1F1914] border-2 border-[#382F26] p-4 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="font-display text-lg uppercase tracking-wide">
              Independent Replay & Hash Verifier
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[#F5EAD4]/70 font-semibold mb-1">Server Seed (Hex)</label>
              <input
                type="text"
                value={testServerSeed}
                onChange={e => setTestServerSeed(e.target.value)}
                className="w-full bg-[#0F0B08] border border-[#382F26] px-2.5 py-1.5 font-mono-num text-xs text-[#F5EAD4]"
              />
            </div>

            <div>
              <label className="block text-[#F5EAD4]/70 font-semibold mb-1">Client Seed</label>
              <input
                type="text"
                value={testClientSeed}
                onChange={e => setTestClientSeed(e.target.value)}
                className="w-full bg-[#0F0B08] border border-[#382F26] px-2.5 py-1.5 font-mono-num text-xs text-[#F5EAD4]"
              />
            </div>

            <div>
              <label className="block text-[#F5EAD4]/70 font-semibold mb-1">Nonce #</label>
              <input
                type="number"
                value={testNonce}
                onChange={e => setTestNonce(parseInt(e.target.value) || 1)}
                className="w-full bg-[#0F0B08] border border-[#382F26] px-2.5 py-1.5 font-mono-num text-xs text-[#F5EAD4]"
              />
            </div>
          </div>

          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-5 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-sm uppercase border border-[#0F0B08] shadow-comic-ink cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            RECALCULATE DETERMINISTIC OUTCOME
          </button>

          {verificationResult && (
            <div className="bg-[#0F0B08] p-3 border border-[#382F26] font-mono-num text-xs space-y-1.5">
              <div className="text-[#F5EAD4]/70 truncate">
                Server Seed Hash: <span className="text-[#EAB308]">{verificationResult.serverSeedHash}</span>
              </div>
              <div className="text-[#F5EAD4]/70 truncate">
                HMAC-SHA256: <span className="text-emerald-400">{verificationResult.hmacHex}</span>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <span>
                  Outcome Float: <strong className="text-[#DC2626]">{verificationResult.outcomeFloat.toFixed(8)}</strong>
                </span>
                <span>
                  Reel Stops: <strong className="text-[#F5EAD4]">{verificationResult.reelStops.join(' · ')}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Live Monte Carlo Par Sheet Simulation */}
        <div className="bg-[#1F1914] border-2 border-[#382F26] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#EAB308]" />
              <h3 className="font-display text-lg uppercase tracking-wide">
                Live Monte Carlo Par Sheet Benchmark (Made Men Slot)
              </h3>
            </div>
            <span className="text-xs font-mono-num text-[#EAB308] font-bold">
              Target RTP: 96.00%
            </span>
          </div>

          <p className="text-xs text-[#F5EAD4]/70">
            Simulate 25,000 or 50,000 consecutive random spins on the exact certified 5-reel par sheet strips to demonstrate variance convergence towards 96.00% theoretical return.
          </p>

          <div className="flex items-center gap-3">
            <select
              value={simSpinsCount}
              disabled={isSimulating}
              onChange={e => setSimSpinsCount(parseInt(e.target.value))}
              className="bg-[#0F0B08] border border-[#382F26] text-xs font-mono-num p-2 text-[#F5EAD4]"
            >
              <option value={10000}>10,000 Spins (Fast)</option>
              <option value={25000}>25,000 Spins (Standard)</option>
              <option value={50000}>50,000 Spins (High Precision)</option>
            </select>

            <button
              disabled={isSimulating}
              onClick={handleRunMonteCarlo}
              className="flex items-center gap-2 px-5 py-2 bg-[#EAB308] hover:bg-[#ca9a07] text-[#0F0B08] font-display text-sm uppercase border border-[#0F0B08] shadow-comic-ink cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {isSimulating ? `SIMULATING (${simProgress}%)...` : 'RUN MONTE CARLO SIMULATION'}
            </button>
          </div>

          {/* Progress bar */}
          {isSimulating && (
            <div className="space-y-1">
              <div className="w-full bg-[#0F0B08] h-3 border border-[#382F26] overflow-hidden">
                <div
                  className="bg-[#DC2626] h-full transition-all duration-100"
                  style={{ width: `${simProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono-num text-[#F5EAD4]/70">
                <span>Progress: {simProgress}%</span>
                <span>Current Sample RTP: {simLiveRtp.toFixed(2)}%</span>
              </div>
            </div>
          )}

          {/* Simulation Output Card */}
          {simResults && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0F0B08] p-3 border border-[#382F26] font-mono-num text-xs">
              <div>
                <span className="text-[#F5EAD4]/50 block">REALIZED RTP:</span>
                <span className="text-base font-bold text-emerald-400">
                  {simResults.realizedRtp.toFixed(2)}%
                </span>
                <span className="text-[10px] block text-[#F5EAD4]/60">
                  Target: 96.00% (±0.5 pp)
                </span>
              </div>

              <div>
                <span className="text-[#F5EAD4]/50 block">HIT FREQUENCY:</span>
                <span className="text-base font-bold text-[#F5EAD4]">
                  {simResults.hitFrequency.toFixed(2)}%
                </span>
                <span className="text-[10px] block text-[#F5EAD4]/60">
                  Payscale hit rate
                </span>
              </div>

              <div>
                <span className="text-[#F5EAD4]/50 block">MAX MULTIPLIER:</span>
                <span className="text-base font-bold text-[#EAB308]">
                  {simResults.maxMultiplier.toFixed(1)}x
                </span>
                <span className="text-[10px] block text-[#F5EAD4]/60">
                  Single spin peak
                </span>
              </div>

              <div>
                <span className="text-[#F5EAD4]/50 block">BONUS TRIGGER:</span>
                <span className="text-base font-bold text-[#DC2626]">
                  {simResults.bonusHitCount} hits
                </span>
                <span className="text-[10px] block text-[#F5EAD4]/60">
                  Briefcase Sit-Down
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Recent Round Audit Ledger */}
        <div className="mt-6">
          <h3 className="font-display text-base uppercase text-[#F5EAD4]/80 mb-2">
            Your Session Round Audit ({recentRounds.length} Rounds)
          </h3>
          {recentRounds.length === 0 ? (
            <div className="p-4 bg-[#0F0B08] border border-[#382F26] text-xs text-center text-[#F5EAD4]/40">
              No rounds played in this session yet. Take a seat at Made Men or Blackjack to generate cryptographic seeds.
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1">
              {recentRounds.slice().reverse().map(round => (
                <div
                  key={round.roundId}
                  className="bg-[#0F0B08] p-2 border border-[#382F26] flex items-center justify-between text-xs font-mono-num"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#EAB308] uppercase">
                      {round.gameId}
                    </span>
                    <span className="text-[#F5EAD4]/50">Nonce #{round.nonce}</span>
                    <span className="text-[#F5EAD4]/70 truncate max-w-[120px]">
                      {round.serverSeedHash.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>
                      Stake: {round.stake} {round.isDCDN ? 'DCDN' : 'CHIPS'}
                    </span>
                    <span className={round.payout > 0 ? 'text-emerald-400 font-bold' : 'text-[#F5EAD4]/50'}>
                      {round.payout > 0 ? `+${round.payout.toFixed(2)}` : '0.00'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
