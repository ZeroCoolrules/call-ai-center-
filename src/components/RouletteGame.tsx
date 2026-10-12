import React, { useState, useEffect } from 'react';
import { PlayerMode, ProvablyFairRound } from '../types/casino';
import { sound } from '../lib/sound';
import { hmacSha256, sha256, generateRandomSeed, hmacToFloat } from '../lib/provablyFair';
import confetti from 'canvas-confetti';
import { ArrowLeft, Shield, Disc } from 'lucide-react';

interface RouletteGameProps {
  currentMode: PlayerMode;
  chipsBalance: number;
  dcdnBalance: number;
  onUpdateBalance: (amountDelta: number) => void;
  onRecordRound: (round: ProvablyFairRound) => void;
  onBackToLobby: () => void;
}

// European roulette wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  currentMode,
  chipsBalance,
  dcdnBalance,
  onUpdateBalance,
  onRecordRound,
  onBackToLobby,
}) => {
  const [selectedBetType, setSelectedBetType] = useState<'RED' | 'BLACK' | 'ODD' | 'EVEN' | 'LOW' | 'HIGH' | number>('RED');
  const [chipAmount, setChipAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('SELECT YOUR BET & SPIN WHEEL');

  // Provably fair
  const [serverSeed, setServerSeed] = useState<string>('');
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('roulette-penthouse');
  const [nonce, setNonce] = useState<number>(1);

  useEffect(() => {
    async function init() {
      const s = generateRandomSeed();
      setServerSeed(s);
      const h = await sha256(s);
      setServerSeedHash(h);
    }
    init();
  }, []);

  const balance = currentMode === 'CHIPS' ? chipsBalance : dcdnBalance;

  const handleSpin = async () => {
    if (chipAmount > balance) {
      setStatusMessage('INSUFFICIENT BALANCE');
      return;
    }

    onUpdateBalance(-chipAmount);
    setIsSpinning(true);
    setStatusMessage('WHEEL IS SPINNING...');
    sound.playChipClick();

    // 1. Provably fair outcome calculation
    const currentNonce = nonce;
    const hmacHex = await hmacSha256(serverSeed, `${clientSeed}:${currentNonce}`);
    const outcomeFloat = hmacToFloat(hmacHex);
    // Map float to 0..36
    const landedNumber = Math.floor(outcomeFloat * 37);

    // Simulated wheel spin audio and delay
    const spinInterval = setInterval(() => {
      sound.playReelTick();
    }, 80);

    setTimeout(() => {
      clearInterval(spinInterval);
      sound.playReelStop();
      setWinningNumber(landedNumber);
      setIsSpinning(false);

      // Evaluate bet outcome
      const isRed = RED_NUMBERS.includes(landedNumber);
      const isBlack = landedNumber !== 0 && !isRed;
      const isEven = landedNumber !== 0 && landedNumber % 2 === 0;
      const isOdd = landedNumber !== 0 && landedNumber % 2 !== 0;
      const isLow = landedNumber >= 1 && landedNumber <= 18;
      const isHigh = landedNumber >= 19 && landedNumber <= 36;

      let won = false;
      let payoutMultiplier = 0;

      if (typeof selectedBetType === 'number') {
        // Straight-up bet (35:1 win + original bet returned = 36x)
        if (selectedBetType === landedNumber) {
          won = true;
          payoutMultiplier = 36;
        }
      } else if (selectedBetType === 'RED' && isRed) {
        won = true; payoutMultiplier = 2;
      } else if (selectedBetType === 'BLACK' && isBlack) {
        won = true; payoutMultiplier = 2;
      } else if (selectedBetType === 'EVEN' && isEven) {
        won = true; payoutMultiplier = 2;
      } else if (selectedBetType === 'ODD' && isOdd) {
        won = true; payoutMultiplier = 2;
      } else if (selectedBetType === 'LOW' && isLow) {
        won = true; payoutMultiplier = 2;
      } else if (selectedBetType === 'HIGH' && isHigh) {
        won = true; payoutMultiplier = 2;
      }

      const totalPayout = won ? chipAmount * payoutMultiplier : 0;

      if (won) {
        onUpdateBalance(totalPayout);
        setStatusMessage(`WINNER! #${landedNumber} ${landedNumber === 0 ? 'GREEN' : isRed ? 'RED' : 'BLACK'} (+${totalPayout.toFixed(2)})`);
        sound.playWinChime(payoutMultiplier >= 10);
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } else {
        setStatusMessage(`BALL LANDED ON #${landedNumber} ${landedNumber === 0 ? 'GREEN' : isRed ? 'RED' : 'BLACK'}`);
      }

      // Record round
      const roundRecord: ProvablyFairRound = {
        roundId: `roul-${Date.now().toString(36)}`,
        gameId: 'wheel-of-the-don',
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: currentNonce,
        outcomeFloat,
        payoutMultiplier: won ? payoutMultiplier : 0,
        stake: chipAmount,
        payout: totalPayout,
        timestamp: Date.now(),
        isDCDN: currentMode === 'DCDN'
      };
      onRecordRound(roundRecord);
      setNonce(prev => prev + 1);
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Header */}
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
              WHEEL OF THE DON
              <span className="text-xs bg-[#EAB308] text-[#0F0B08] px-2 py-0.5 font-sans font-bold border border-[#0F0B08] shadow-comic-ink">
                97.3% RTP · SINGLE ZERO
              </span>
            </h1>
            <p className="text-xs text-[#F5EAD4]/70 hidden sm:block">
              European roulette with single zero (37 pockets). 35:1 straight-up payouts and 1:1 outside bets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Roulette Table Frame */}
      <div className="bg-[#181310] border-3 border-[#0F0B08] p-4 sm:p-6 shadow-comic-red relative overflow-hidden">
        
        {/* Status Marquee */}
        <div className="mb-6 bg-[#0F0B08] border-2 border-[#382F26] py-2 px-4 text-center font-display text-base sm:text-lg text-[#F5EAD4] tracking-wider shadow-comic-ink">
          {statusMessage}
        </div>

        {/* Wheel Display & Ball Target */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
          <div className="relative w-36 h-36 rounded-full border-4 border-[#EAB308] bg-[#0F0B08] flex items-center justify-center shadow-comic-ink">
            <Disc className={`w-28 h-28 text-[#DC2626] ${isSpinning ? 'animate-spin' : ''}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-3xl font-black text-[#F5EAD4] bg-[#0F0B08]/90 px-3 py-1 border border-[#382F26]">
                {winningNumber !== null ? winningNumber : '37'}
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-xs text-[#F5EAD4]/60 uppercase font-bold">Selected Wager</span>
            <div className="font-display text-2xl text-[#EAB308]">
              {typeof selectedBetType === 'number' ? `STRAIGHT #${selectedBetType} (35:1)` : `${selectedBetType} (1:1)`}
            </div>
            <span className="text-xs font-mono-num text-[#F5EAD4]/80">
              Stake: {chipAmount} {currentMode}
            </span>
          </div>
        </div>

        {/* Betting Board Grid */}
        <div className="space-y-2 max-w-2xl mx-auto">
          {/* Outside bets */}
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2 text-xs font-bold font-display uppercase">
            <button
              onClick={() => setSelectedBetType('RED')}
              className={`py-2 border-2 cursor-pointer transition-colors ${
                selectedBetType === 'RED'
                  ? 'bg-[#DC2626] text-[#F5EAD4] border-[#0F0B08] shadow-comic-ink'
                  : 'bg-[#7f1d1d] text-[#F5EAD4] border-[#382F26]'
              }`}
            >
              RED (1:1)
            </button>
            <button
              onClick={() => setSelectedBetType('BLACK')}
              className={`py-2 border-2 cursor-pointer transition-colors ${
                selectedBetType === 'BLACK'
                  ? 'bg-[#0F0B08] text-[#F5EAD4] border-[#EAB308] shadow-comic-mustard'
                  : 'bg-[#181310] text-[#F5EAD4] border-[#382F26]'
              }`}
            >
              BLACK (1:1)
            </button>
            <button
              onClick={() => setSelectedBetType('EVEN')}
              className={`py-2 border-2 cursor-pointer transition-colors ${
                selectedBetType === 'EVEN'
                  ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08] shadow-comic-ink'
                  : 'bg-[#1F1914] text-[#F5EAD4] border-[#382F26]'
              }`}
            >
              EVEN (1:1)
            </button>
            <button
              onClick={() => setSelectedBetType('ODD')}
              className={`py-2 border-2 cursor-pointer transition-colors ${
                selectedBetType === 'ODD'
                  ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08] shadow-comic-ink'
                  : 'bg-[#1F1914] text-[#F5EAD4] border-[#382F26]'
              }`}
            >
              ODD (1:1)
            </button>
            <button
              onClick={() => setSelectedBetType('LOW')}
              className={`py-2 border-2 cursor-pointer transition-colors ${
                selectedBetType === 'LOW'
                  ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08] shadow-comic-ink'
                  : 'bg-[#1F1914] text-[#F5EAD4] border-[#382F26]'
              }`}
            >
              1-18 (1:1)
            </button>
            <button
              onClick={() => setSelectedBetType('HIGH')}
              className={`py-2 border-2 cursor-pointer transition-colors ${
                selectedBetType === 'HIGH'
                  ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08] shadow-comic-ink'
                  : 'bg-[#1F1914] text-[#F5EAD4] border-[#382F26]'
              }`}
            >
              19-36 (1:1)
            </button>
          </div>

          {/* Quick Straight-up buttons (0..12 sample or toggle) */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedBetType(0)}
              className={`px-3 py-1.5 bg-emerald-700 text-[#F5EAD4] border-2 font-display text-sm cursor-pointer shrink-0 ${
                selectedBetType === 0 ? 'border-[#F5EAD4] shadow-comic-ink' : 'border-[#382F26]'
              }`}
            >
              0 (GREEN)
            </button>
            {[7, 11, 17, 21, 24, 29, 32].map(n => {
              const isRed = RED_NUMBERS.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => setSelectedBetType(n)}
                  className={`px-3 py-1.5 border-2 font-display text-sm cursor-pointer shrink-0 ${
                    selectedBetType === n ? 'border-[#EAB308] scale-105 shadow-comic-mustard' : 'border-[#382F26]'
                  } ${isRed ? 'bg-[#DC2626] text-[#F5EAD4]' : 'bg-[#0F0B08] text-[#F5EAD4]'}`}
                >
                  #{n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 pt-4 border-t-2 border-[#382F26] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5EAD4]/70 uppercase">Wager:</span>
            {[10, 20, 50, 100].map(val => (
              <button
                key={val}
                disabled={isSpinning}
                onClick={() => {
                  sound.playChipClick();
                  setChipAmount(val);
                }}
                className={`px-2.5 py-1 text-xs font-mono-num font-bold border-2 cursor-pointer transition-colors ${
                  chipAmount === val
                    ? 'bg-[#DC2626] text-[#F5EAD4] border-[#0F0B08]'
                    : 'bg-[#1F1914] text-[#F5EAD4]/70 border-[#382F26]'
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          <button
            disabled={isSpinning || chipAmount > balance}
            onClick={handleSpin}
            className="px-8 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-lg uppercase border-2 border-[#0F0B08] shadow-comic-red transition-all cursor-pointer disabled:opacity-50"
          >
            {isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
          </button>
        </div>
      </div>

      {/* Provably fair note */}
      <div className="bg-[#181310] border-2 border-[#382F26] p-3 text-xs flex items-center justify-between text-[#F5EAD4]/70">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#EAB308]" />
          <span>Provably Fair European Single Zero · Mathematical Edge 2.70%</span>
        </div>
        <div className="font-mono-num">
          Nonce: #{nonce}
        </div>
      </div>
    </div>
  );
};
