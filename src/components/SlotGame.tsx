import React, { useState, useEffect, useRef } from 'react';
import { PlayerMode, ProvablyFairRound } from '../types/casino';
import {
  SlotSymbol,
  evaluateSpin,
  getReelStopsFromHmac,
  hmacSha256,
  sha256,
  generateRandomSeed,
  hmacToFloat,
  PAYTABLE,
  PAYLINES_20
} from '../lib/provablyFair';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import { Play, RotateCw, Zap, Shield, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';

interface SlotGameProps {
  currentMode: PlayerMode;
  chipsBalance: number;
  dcdnBalance: number;
  onUpdateBalance: (amountDelta: number) => void;
  onRecordRound: (round: ProvablyFairRound) => void;
  onBackToLobby: () => void;
}

export const SlotGame: React.FC<SlotGameProps> = ({
  currentMode,
  chipsBalance,
  dcdnBalance,
  onUpdateBalance,
  onRecordRound,
  onBackToLobby,
}) => {
  const [stake, setStake] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState<number>(0);
  
  // Free spins bonus state
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [bonusTotalWon, setBonusTotalWon] = useState<number>(0);

  // Provably fair state
  const [serverSeed, setServerSeed] = useState<string>('');
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('mob-boss-1982');
  const [nonce, setNonce] = useState<number>(1);
  const [lastRoundInfo, setLastRoundInfo] = useState<{
    hash: string;
    outcomeFloat: number;
    multiplier: number;
  } | null>(null);

  // Display grid (5 reels x 3 rows)
  const [grid, setGrid] = useState<SlotSymbol[][]>([
    ['TOMMY', 'WHISKEY', 'RING'],
    ['WILD', 'CASH', 'KING'],
    ['TOMMY', 'SCATTER', 'DAGGER'],
    ['WHISKEY', 'ACE', 'QUEEN'],
    ['RING', 'KING', 'TOMMY'],
  ]);

  // Winning line IDs for highlighting
  const [winningLineIds, setWinningLineIds] = useState<number[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [winMessage, setWinMessage] = useState<string>('');

  // Initialize seeds on mount
  useEffect(() => {
    async function initSeeds() {
      const seed = generateRandomSeed();
      setServerSeed(seed);
      const hash = await sha256(seed);
      setServerSeedHash(hash);
    }
    initSeeds();
  }, []);

  const balance = currentMode === 'CHIPS' ? chipsBalance : dcdnBalance;

  // Handle Spin Logic
  const handleSpin = async (overrideStake?: number) => {
    const currentStake = overrideStake !== undefined ? overrideStake : (freeSpinsLeft > 0 ? 0 : stake);

    if (currentStake > balance && freeSpinsLeft === 0) {
      setWinMessage('INSUFFICIENT BALANCE FOR WAGER');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setWinMessage('');
    setWinningLineIds([]);

    // Deduct stake if not free spin
    if (freeSpinsLeft === 0 && currentStake > 0) {
      onUpdateBalance(-currentStake);
    }

    sound.playChipClick();

    // 1. Calculate HMAC-SHA256 outcome
    const currentNonce = nonce;
    const message = `${clientSeed}:${currentNonce}`;
    const hmacHex = await hmacSha256(serverSeed, message);
    const outcomeFloat = hmacToFloat(hmacHex);
    const stops = getReelStopsFromHmac(hmacHex);

    // 2. Play sound reel ticks
    const spinInterval = setInterval(() => {
      sound.playReelTick();
    }, 90);

    // Simulate animated reel spin duration
    const spinDuration = isTurbo ? 350 : 850;

    setTimeout(() => {
      clearInterval(spinInterval);
      sound.playReelStop();

      // 3. Evaluate results
      const effectiveStake = freeSpinsLeft > 0 ? stake : currentStake;
      const result = evaluateSpin(stops, effectiveStake);
      setGrid(result.grid);

      // Payout logic
      if (result.totalPayout > 0) {
        onUpdateBalance(result.totalPayout);
        setLastWinAmount(result.totalPayout);

        if (freeSpinsLeft > 0) {
          setBonusTotalWon(prev => prev + result.totalPayout);
        }

        const winLineIds = result.winningLines.map(l => l.lineId);
        setWinningLineIds(winLineIds);

        const isBig = result.payoutMultiplier >= 10;
        sound.playWinChime(isBig);

        if (isBig) {
          setWinMessage(`★ SAY HELLO TO MY LITTLE FRIEND! +${result.totalPayout.toFixed(2)} (${result.payoutMultiplier.toFixed(1)}x) ★`);
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#F43F5E', '#06B6D4', '#F59E0B', '#FFFFFF']
          });
        } else {
          setWinMessage(`THE WORLD IS YOURS: +${result.totalPayout.toFixed(2)} (${result.payoutMultiplier.toFixed(1)}x)`);
        }
      } else {
        setLastWinAmount(0);
        setWinMessage('NO HIT — KEEP YOUR NERVE, CHICO');
      }

      // Check for Free Spins Sit-Down Bonus
      if (result.isFreeSpinsBonus) {
        setFreeSpinsLeft(prev => prev + result.freeSpinsAwarded);
        setWinMessage(`★ 3+ TIGER SCATTERS! ${result.freeSpinsAwarded} BABYLON FREE SPINS! ★`);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#F43F5E', '#06B6D4', '#F59E0B']
        });
        sound.playWinChime(true);
      } else if (freeSpinsLeft > 0) {
        setFreeSpinsLeft(prev => prev - 1);
      }

      // Record round
      const roundRecord: ProvablyFairRound = {
        roundId: `round-${Date.now().toString(36)}`,
        gameId: 'made-men',
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: currentNonce,
        outcomeFloat,
        payoutMultiplier: result.payoutMultiplier,
        stake: effectiveStake,
        payout: result.totalPayout,
        timestamp: Date.now(),
        isDCDN: currentMode === 'DCDN'
      };
      onRecordRound(roundRecord);

      setLastRoundInfo({
        hash: hmacHex.slice(0, 16) + '...',
        outcomeFloat,
        multiplier: result.payoutMultiplier
      });

      setNonce(prev => prev + 1);
      setIsSpinning(false);

      // Continue Auto Spins if active
      if (autoSpinsLeft > 1 && (freeSpinsLeft === 0 || freeSpinsLeft > 1)) {
        setAutoSpinsLeft(prev => prev - 1);
        setTimeout(() => handleSpin(), isTurbo ? 250 : 600);
      } else if (autoSpinsLeft === 1) {
        setAutoSpinsLeft(0);
      } else if (freeSpinsLeft > 1) {
        // Automatically continue free spins bonus!
        setTimeout(() => handleSpin(0), isTurbo ? 300 : 700);
      }
    }, spinDuration);
  };

  // Render symbol graphic
  const renderSymbol = (sym: SlotSymbol) => {
    switch (sym) {
      case 'WILD':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#1F1914] border-2 border-[#DC2626]">
            <span className="text-xl sm:text-2xl font-black text-[#DC2626] font-display">THE DON</span>
            <span className="text-[10px] font-bold bg-[#DC2626] text-[#F5EAD4] px-1 uppercase tracking-widest mt-0.5">
              WILD
            </span>
          </div>
        );
      case 'SCATTER':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#2A2016] border-2 border-[#EAB308]">
            <span className="text-xl sm:text-2xl font-black text-[#EAB308] font-display">BRIEFCASE</span>
            <span className="text-[10px] font-bold bg-[#EAB308] text-[#0F0B08] px-1 uppercase tracking-widest mt-0.5">
              BONUS
            </span>
          </div>
        );
      case 'TOMMY':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#181310]">
            <span className="text-sm sm:text-base font-bold text-[#F5EAD4] font-display">TOMMY GUN</span>
            <span className="text-[11px] text-[#DC2626] font-mono-num font-bold">5x = 400x</span>
          </div>
        );
      case 'DAGGER':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#181310]">
            <span className="text-sm sm:text-base font-bold text-[#F5EAD4] font-display">STILETTO</span>
            <span className="text-[11px] text-[#EAB308] font-mono-num font-bold">5x = 250x</span>
          </div>
        );
      case 'CASH':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#181310]">
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-display">BANKROLL</span>
            <span className="text-[11px] text-[#F5EAD4]/70 font-mono-num font-bold">5x = 150x</span>
          </div>
        );
      case 'WHISKEY':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#181310]">
            <span className="text-sm sm:text-base font-bold text-amber-300 font-display">BOOTLEG</span>
            <span className="text-[11px] text-[#F5EAD4]/70 font-mono-num font-bold">5x = 100x</span>
          </div>
        );
      case 'RING':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#181310]">
            <span className="text-sm sm:text-base font-bold text-yellow-500 font-display">SIGNET RING</span>
            <span className="text-[11px] text-[#F5EAD4]/70 font-mono-num font-bold">5x = 75x</span>
          </div>
        );
      case 'ACE':
      case 'KING':
      case 'QUEEN':
        return (
          <div className="flex flex-col items-center justify-center p-2 text-center h-full bg-[#130F0C]">
            <span className="text-2xl font-black text-[#F5EAD4]/90 font-display">{sym}</span>
            <span className="text-[10px] text-[#F5EAD4]/50 font-mono-num">Card Rank</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1914] border-2 border-[#382F26] hover:border-[#DC2626] text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#DC2626]" />
            Lobby
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-[#F5EAD4] uppercase flex items-center gap-2">
              MADE MEN
              <span className="text-xs bg-[#DC2626] text-[#F5EAD4] px-2 py-0.5 font-sans font-bold border border-[#0F0B08] shadow-comic-ink">
                96.0% RTP · 20 LINES
              </span>
            </h1>
            <p className="text-xs text-[#F5EAD4]/70 hidden sm:block">
              Initiation night: 3+ Briefcases trigger Sit-Down Free Spins. The Don is Wild.
            </p>
          </div>
        </div>

        {/* Free Spins Alert Banner if active */}
        {freeSpinsLeft > 0 && (
          <div className="bg-[#EAB308] text-[#0F0B08] px-3 py-1 border-2 border-[#0F0B08] font-bold text-xs uppercase animate-pulse shadow-comic-ink">
            SIT-DOWN BONUS: {freeSpinsLeft} SPINS LEFT (+{bonusTotalWon.toFixed(2)})
          </div>
        )}
      </div>

      {/* Main Slot Cabinet Frame */}
      <div className="bg-[#181310] border-3 border-[#0F0B08] p-3 sm:p-5 shadow-comic-red relative overflow-hidden">
        
        {/* Comic halftone background overlay */}
        <div className="absolute inset-0 bg-halftone opacity-40 pointer-events-none" />

        {/* Marquee Win Status Display */}
        <div className="relative mb-4 bg-[#0F0B08] border-2 border-[#382F26] p-2.5 text-center flex items-center justify-between">
          <div className="text-left text-xs font-mono-num">
            <span className="text-[#F5EAD4]/50">STAKE:</span>{' '}
            <span className="font-bold text-[#EAB308]">{freeSpinsLeft > 0 ? 'FREE' : `${stake} ${currentMode}`}</span>
          </div>
          
          <div className="font-display text-base sm:text-xl text-[#F5EAD4] tracking-wider truncate px-2">
            {winMessage || 'PLACE YOUR STAKE & SPIN THE REELS'}
          </div>

          <div className="text-right text-xs font-mono-num">
            <span className="text-[#F5EAD4]/50">LAST PAY:</span>{' '}
            <span className={`font-bold ${lastWinAmount > 0 ? 'text-emerald-400' : 'text-[#F5EAD4]'}`}>
              {lastWinAmount > 0 ? `+${lastWinAmount.toFixed(2)}` : '0.00'}
            </span>
          </div>
        </div>

        {/* 5x3 Reel Matrix */}
        <div className="relative grid grid-cols-5 gap-1.5 sm:gap-2 bg-[#0F0B08] p-2 sm:p-3 border-2 border-[#382F26]">
          {grid.map((column, colIdx) => (
            <div
              key={colIdx}
              className={`flex flex-col gap-1.5 sm:gap-2 transition-transform ${
                isSpinning ? 'blur-[0.5px] scale-[0.99]' : ''
              }`}
            >
              {column.map((sym, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`h-20 sm:h-24 transition-all duration-200 ${
                    winningLineIds.length > 0 ? 'ring-1 ring-[#EAB308]/40' : ''
                  }`}
                >
                  {renderSymbol(sym)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Payline indicators */}
        <div className="mt-2 text-[11px] text-[#F5EAD4]/60 flex items-center justify-between">
          <span>20 Fixed Paylines (Left to Right)</span>
          <span className="font-mono-num">RTP Model: 96.00% Certified</span>
        </div>

        {/* Controls Panel */}
        <div className="relative mt-4 pt-3 border-t-2 border-[#382F26] flex flex-wrap items-center justify-between gap-3">
          
          {/* Stake Stepper */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5EAD4]/70 uppercase">Stake:</span>
            <div className="flex items-center border-2 border-[#382F26] bg-[#0F0B08]">
              {[10, 20, 50, 100, 250].map(val => (
                <button
                  key={val}
                  disabled={isSpinning || freeSpinsLeft > 0}
                  onClick={() => {
                    sound.playChipClick();
                    setStake(val);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono-num font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    stake === val
                      ? 'bg-[#DC2626] text-[#F5EAD4]'
                      : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4] hover:bg-[#1F1914]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Options: Turbo & Auto */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTurbo(!isTurbo)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border-2 transition-colors cursor-pointer ${
                isTurbo
                  ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08]'
                  : 'bg-[#1F1914] text-[#F5EAD4]/70 border-[#382F26]'
              }`}
              title="Turbo mode speeds up reel stops"
            >
              <Zap className="w-3.5 h-3.5" />
              TURBO
            </button>

            <button
              onClick={() => {
                if (autoSpinsLeft > 0) {
                  setAutoSpinsLeft(0);
                } else {
                  setAutoSpinsLeft(10);
                  handleSpin();
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold border-2 transition-colors cursor-pointer ${
                autoSpinsLeft > 0
                  ? 'bg-[#DC2626] text-[#F5EAD4] border-[#0F0B08]'
                  : 'bg-[#1F1914] text-[#F5EAD4]/70 border-[#382F26]'
              }`}
            >
              {autoSpinsLeft > 0 ? `AUTO (${autoSpinsLeft})` : 'AUTO (10)'}
            </button>

            {/* Primary Spin Button */}
            <button
              disabled={isSpinning || (balance < stake && freeSpinsLeft === 0)}
              onClick={() => handleSpin()}
              className="flex items-center gap-2 px-6 py-2 bg-[#DC2626] hover:bg-[#b91c1c] disabled:opacity-50 text-[#F5EAD4] font-display text-lg tracking-wider border-2 border-[#0F0B08] shadow-comic-red transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? 'ROLLING...' : freeSpinsLeft > 0 ? 'FREE SPIN' : 'SPIN'}
            </button>
          </div>
        </div>
      </div>

      {/* Provably Fair Round Telemetry Footer */}
      <div className="bg-[#181310] border-2 border-[#382F26] p-3 text-xs flex flex-wrap items-center justify-between gap-3 text-[#F5EAD4]/70">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#EAB308]" />
          <span className="font-bold text-[#F5EAD4]">PROVABLY FAIR ACTIVE:</span>
          <span className="font-mono-num truncate max-w-[200px]" title={serverSeedHash}>
            Hash: {serverSeedHash ? `${serverSeedHash.slice(0, 12)}...` : 'Generating...'}
          </span>
          <span>·</span>
          <span className="font-mono-num">Nonce: #{nonce}</span>
        </div>

        {lastRoundInfo && (
          <div className="font-mono-num text-[11px] bg-[#0F0B08] px-2 py-0.5 border border-[#382F26]">
            Last HMAC: <span className="text-[#EAB308]">{lastRoundInfo.hash}</span> · Float:{' '}
            <span className="text-[#DC2626]">{lastRoundInfo.outcomeFloat.toFixed(6)}</span>
          </div>
        )}
      </div>

      {/* Paytable quick reference */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-[#181310] border border-[#382F26]">
          <span className="font-bold text-[#DC2626]">THE DON (WILD)</span>
          <p className="text-[11px] text-[#F5EAD4]/70">3=50x · 4=250x · 5=1000x</p>
        </div>
        <div className="p-2 bg-[#181310] border border-[#382F26]">
          <span className="font-bold text-[#EAB308]">BRIEFCASE (SCATTER)</span>
          <p className="text-[11px] text-[#F5EAD4]/70">3=10 Free Spins · 4=15 · 5=25</p>
        </div>
        <div className="p-2 bg-[#181310] border border-[#382F26]">
          <span className="font-bold text-[#F5EAD4]">TOMMY GUN</span>
          <p className="text-[11px] text-[#F5EAD4]/70">3=25x · 4=100x · 5=400x</p>
        </div>
        <div className="p-2 bg-[#181310] border border-[#382F26]">
          <span className="font-bold text-[#F5EAD4]">STILETTO DAGGER</span>
          <p className="text-[11px] text-[#F5EAD4]/70">3=20x · 4=75x · 5=250x</p>
        </div>
      </div>
    </div>
  );
};
