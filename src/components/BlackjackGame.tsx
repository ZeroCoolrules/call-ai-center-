import React, { useState, useEffect } from 'react';
import { PlayerMode, ProvablyFairRound, Card } from '../types/casino';
import { sound } from '../lib/sound';
import { hmacSha256, sha256, generateRandomSeed, hmacToFloat } from '../lib/provablyFair';
import confetti from 'canvas-confetti';
import { ArrowLeft, Shield, RotateCcw } from 'lucide-react';

interface BlackjackGameProps {
  currentMode: PlayerMode;
  chipsBalance: number;
  dcdnBalance: number;
  onUpdateBalance: (amountDelta: number) => void;
  onRecordRound: (round: ProvablyFairRound) => void;
  onBackToLobby: () => void;
}

const SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: '2', num: 2 },
  { val: '3', num: 3 },
  { val: '4', num: 4 },
  { val: '5', num: 5 },
  { val: '6', num: 6 },
  { val: '7', num: 7 },
  { val: '8', num: 8 },
  { val: '9', num: 9 },
  { val: '10', num: 10 },
  { val: 'J', num: 10 },
  { val: 'Q', num: 10 },
  { val: 'K', num: 10 },
  { val: 'A', num: 11 },
];

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  currentMode,
  chipsBalance,
  dcdnBalance,
  onUpdateBalance,
  onRecordRound,
  onBackToLobby,
}) => {
  const [bet, setBet] = useState<number>(25);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'ROUND_OVER'>('BETTING');
  
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [shoe, setShoe] = useState<Card[]>([]);
  
  const [statusMessage, setStatusMessage] = useState<string>('PLACE YOUR BET & DEAL');
  const [lastPayout, setLastPayout] = useState<number>(0);

  // Provably fair
  const [serverSeed, setServerSeed] = useState<string>('');
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('blackjack-table-88');
  const [nonce, setNonce] = useState<number>(1);

  // Initialize shoe and seeds
  useEffect(() => {
    async function init() {
      const s = generateRandomSeed();
      setServerSeed(s);
      const h = await sha256(s);
      setServerSeedHash(h);
      resetShoe();
    }
    init();
  }, []);

  const resetShoe = () => {
    const newShoe: Card[] = [];
    // 6 decks
    for (let d = 0; d < 6; d++) {
      for (const suit of SUITS) {
        for (const v of VALUES) {
          newShoe.push({ suit, value: v.val, numericValue: v.num });
        }
      }
    }
    // Fisher-Yates shuffle
    for (let i = newShoe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newShoe[i], newShoe[j]] = [newShoe[j], newShoe[i]];
    }
    setShoe(newShoe);
  };

  const drawCard = (currentShoe: Card[]): { card: Card; remaining: Card[] } => {
    let pool = currentShoe;
    if (pool.length < 20) {
      const newShoe: Card[] = [];
      for (let d = 0; d < 6; d++) {
        for (const suit of SUITS) {
          for (const v of VALUES) {
            newShoe.push({ suit, value: v.val, numericValue: v.num });
          }
        }
      }
      for (let i = newShoe.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newShoe[i], newShoe[j]] = [newShoe[j], newShoe[i]];
      }
      pool = newShoe;
    }
    const card = pool[0];
    const remaining = pool.slice(1);
    return { card, remaining };
  };

  // Hand valuation (soft ace calculation)
  const calculateHandScore = (hand: Card[]): { score: number; isSoft: boolean; isBlackjack: boolean } => {
    let total = 0;
    let aceCount = 0;

    for (const card of hand) {
      if (card.value === 'A') {
        aceCount++;
        total += 11;
      } else {
        total += card.numericValue;
      }
    }

    while (total > 21 && aceCount > 0) {
      total -= 10;
      aceCount--;
    }

    const isSoft = aceCount > 0 && total <= 21;
    const isBlackjack = hand.length === 2 && total === 21;

    return { score: total, isSoft, isBlackjack };
  };

  const balance = currentMode === 'CHIPS' ? chipsBalance : dcdnBalance;

  // Deal initial cards
  const handleDeal = async () => {
    if (bet > balance) {
      setStatusMessage('INSUFFICIENT BALANCE');
      return;
    }

    onUpdateBalance(-bet);
    sound.playChipClick();

    // Provably fair calculation
    const currentNonce = nonce;
    const hmacHex = await hmacSha256(serverSeed, `${clientSeed}:${currentNonce}`);
    const outcomeFloat = hmacToFloat(hmacHex);

    let curShoe = shoe;
    const c1 = drawCard(curShoe); curShoe = c1.remaining;
    const d1 = drawCard(curShoe); curShoe = d1.remaining;
    const c2 = drawCard(curShoe); curShoe = c2.remaining;
    const d2 = drawCard(curShoe); curShoe = d2.remaining;

    setShoe(curShoe);
    sound.playCardDeal();

    const pHand = [c1.card, c2.card];
    const dHand = [d1.card, d2.card];

    setPlayerHand(pHand);
    setDealerHand(dHand);

    const pVal = calculateHandScore(pHand);
    const dVal = calculateHandScore(dHand);

    // Natural 21 checks
    if (pVal.isBlackjack) {
      if (dVal.isBlackjack) {
        // Push
        onUpdateBalance(bet);
        setStatusMessage('BOTH HAVE BLACKJACK · PUSH');
        setGameState('ROUND_OVER');
        recordOutcome(outcomeFloat, 1, bet);
      } else {
        // 3:2 payout on Natural Blackjack!
        const winTotal = bet + bet * 1.5;
        onUpdateBalance(winTotal);
        setLastPayout(winTotal);
        setStatusMessage('★ NATURAL BLACKJACK! 3:2 PAYOUT ★');
        sound.playWinChime(true);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setGameState('ROUND_OVER');
        recordOutcome(outcomeFloat, 2.5, winTotal);
      }
    } else {
      setStatusMessage(`YOUR HAND: ${pVal.score} · HIT, STAND OR DOUBLE`);
      setGameState('PLAYER_TURN');
    }
  };

  // Player hits
  const handleHit = () => {
    if (gameState !== 'PLAYER_TURN') return;

    sound.playCardDeal();
    const { card, remaining } = drawCard(shoe);
    setShoe(remaining);

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    const scoreInfo = calculateHandScore(newHand);
    if (scoreInfo.score > 21) {
      // Bust
      setStatusMessage(`BUST (${scoreInfo.score}) · HOUSE TAKES THE HAND`);
      setGameState('ROUND_OVER');
      recordOutcome(0.5, 0, 0);
    } else if (scoreInfo.score === 21) {
      handleStand(newHand);
    } else {
      setStatusMessage(`YOUR HAND: ${scoreInfo.score}`);
    }
  };

  // Player Double Down (double bet, get exactly 1 card, then stand)
  const handleDoubleDown = () => {
    if (gameState !== 'PLAYER_TURN' || playerHand.length !== 2) return;
    if (bet > balance) {
      setStatusMessage('INSUFFICIENT FUNDS TO DOUBLE');
      return;
    }

    onUpdateBalance(-bet);
    const doubledBet = bet * 2;
    setBet(doubledBet);

    sound.playChipClick();
    sound.playCardDeal();

    const { card, remaining } = drawCard(shoe);
    setShoe(remaining);

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    const scoreInfo = calculateHandScore(newHand);
    if (scoreInfo.score > 21) {
      setStatusMessage(`BUST ON DOUBLE (${scoreInfo.score})`);
      setGameState('ROUND_OVER');
      recordOutcome(0.5, 0, 0);
    } else {
      handleStand(newHand, doubledBet);
    }
  };

  // Stand and let dealer play
  const handleStand = (currentPHand: Card[] = playerHand, activeBet: number = bet) => {
    setGameState('DEALER_TURN');
    setStatusMessage('DEALER IS DRAWING...');

    let curDHand = [...dealerHand];
    let curShoe = [...shoe];

    // Dealer stands on soft 17: loop until score >= 17
    const dealerStep = () => {
      const dScore = calculateHandScore(curDHand);
      if (dScore.score < 17) {
        sound.playCardDeal();
        const { card, remaining } = drawCard(curShoe);
        curShoe = remaining;
        curDHand.push(card);
        setDealerHand([...curDHand]);
        setShoe(curShoe);
        setTimeout(dealerStep, 450);
      } else {
        // Dealer finished
        settleRound(currentPHand, curDHand, activeBet);
      }
    };

    setTimeout(dealerStep, 400);
  };

  const settleRound = (pHand: Card[], dHand: Card[], activeBet: number) => {
    const pScore = calculateHandScore(pHand).score;
    const dScore = calculateHandScore(dHand).score;

    if (dScore > 21) {
      // Dealer busts, player wins 1:1
      const winTotal = activeBet * 2;
      onUpdateBalance(winTotal);
      setLastPayout(winTotal);
      setStatusMessage(`DEALER BUSTS (${dScore}) · YOU WIN +${winTotal}`);
      sound.playWinChime(false);
      recordOutcome(0.8, 2.0, winTotal);
    } else if (pScore > dScore) {
      // Player higher
      const winTotal = activeBet * 2;
      onUpdateBalance(winTotal);
      setLastPayout(winTotal);
      setStatusMessage(`YOU WIN! ${pScore} BEATS ${dScore}`);
      sound.playWinChime(false);
      recordOutcome(0.8, 2.0, winTotal);
    } else if (pScore === dScore) {
      // Push
      onUpdateBalance(activeBet);
      setLastPayout(activeBet);
      setStatusMessage(`PUSH (${pScore} vs ${dScore}) · BET RETURNED`);
      recordOutcome(0.5, 1.0, activeBet);
    } else {
      // Dealer wins
      setStatusMessage(`DEALER WINS (${dScore} vs ${pScore})`);
      setLastPayout(0);
      recordOutcome(0.2, 0, 0);
    }
    setGameState('ROUND_OVER');
  };

  const recordOutcome = (outcomeFloat: number, multiplier: number, payout: number) => {
    const round: ProvablyFairRound = {
      roundId: `bj-${Date.now().toString(36)}`,
      gameId: 'back-room-blackjack',
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      outcomeFloat,
      payoutMultiplier: multiplier,
      stake: bet,
      payout,
      timestamp: Date.now(),
      isDCDN: currentMode === 'DCDN'
    };
    onRecordRound(round);
    setNonce(prev => prev + 1);
  };

  const renderCard = (card: Card, isHidden: boolean = false) => {
    if (isHidden) {
      return (
        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-[#DC2626] border-2 border-[#0F0B08] shadow-comic-ink flex items-center justify-center bg-hazard-stripes">
          <span className="font-display text-base font-bold text-[#F5EAD4] bg-[#0F0B08] px-1 py-0.5">
            DCDN
          </span>
        </div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 bg-[#F5EAD4] border-2 border-[#0F0B08] p-1.5 flex flex-col justify-between shadow-comic-ink select-none">
        <div className="flex items-center justify-between text-xs font-bold leading-none">
          <span className={isRed ? 'text-[#DC2626]' : 'text-[#0F0B08]'}>{card.value}</span>
          <span className={isRed ? 'text-[#DC2626]' : 'text-[#0F0B08]'}>{card.suit}</span>
        </div>
        <div className={`text-center text-2xl sm:text-3xl ${isRed ? 'text-[#DC2626]' : 'text-[#0F0B08]'}`}>
          {card.suit}
        </div>
        <div className="flex items-center justify-between text-xs font-bold leading-none rotate-180">
          <span className={isRed ? 'text-[#DC2626]' : 'text-[#0F0B08]'}>{card.value}</span>
          <span className={isRed ? 'text-[#DC2626]' : 'text-[#0F0B08]'}>{card.suit}</span>
        </div>
      </div>
    );
  };

  const playerScore = calculateHandScore(playerHand);
  const dealerScore = calculateHandScore(gameState === 'PLAYER_TURN' ? dealerHand.slice(0, 1) : dealerHand);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Breadcrumb Header */}
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
              BACK ROOM BLACKJACK
              <span className="text-xs bg-emerald-700 text-[#F5EAD4] px-2 py-0.5 font-sans font-bold border border-[#0F0B08] shadow-comic-ink">
                99.5% RTP · 6 DECKS
              </span>
            </h1>
            <p className="text-xs text-[#F5EAD4]/70 hidden sm:block">
              Dealer stands on soft 17. Natural blackjack pays 3:2. Split and double down enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Felt Green Table */}
      <div className="bg-[#0b3820] border-3 border-[#0F0B08] p-4 sm:p-8 shadow-comic-red relative overflow-hidden rounded-lg">
        {/* Subtle table markings */}
        <div className="text-center font-display text-xs sm:text-sm text-[#F5EAD4]/30 tracking-widest uppercase border-b border-[#F5EAD4]/20 pb-2 mb-6">
          BLACKJACK PAYS 3 TO 2 · DEALER MUST STAND ON SOFT 17
        </div>

        {/* Status Marquee */}
        <div className="max-w-md mx-auto mb-6 bg-[#0F0B08] border-2 border-[#382F26] py-2 px-4 text-center font-display text-base text-[#F5EAD4] tracking-wider shadow-comic-ink">
          {statusMessage}
        </div>

        {/* Dealer Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-xs font-bold uppercase text-[#F5EAD4]/70 mb-2">
            Dealer Hand {dealerHand.length > 0 && `(Score: ${dealerScore.score}${gameState === 'PLAYER_TURN' ? ' + ?' : ''})`}
          </div>
          <div className="flex items-center gap-2 min-h-[110px]">
            {dealerHand.map((card, idx) => (
              <React.Fragment key={idx}>
                {renderCard(card, gameState === 'PLAYER_TURN' && idx === 1)}
              </React.Fragment>
            ))}
            {dealerHand.length === 0 && (
              <div className="text-xs text-[#F5EAD4]/40 italic">Awaiting deal...</div>
            )}
          </div>
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 min-h-[110px] mb-2">
            {playerHand.map((card, idx) => (
              <React.Fragment key={idx}>
                {renderCard(card, false)}
              </React.Fragment>
            ))}
            {playerHand.length === 0 && (
              <div className="text-xs text-[#F5EAD4]/40 italic">Place bet below to start hand</div>
            )}
          </div>
          <div className="text-xs font-bold uppercase text-[#F5EAD4]/90">
            Player Hand {playerHand.length > 0 && `(Score: ${playerScore.score}${playerScore.isSoft ? ' Soft' : ''})`}
          </div>
        </div>

        {/* Chip Betting & Controls */}
        <div className="mt-8 pt-4 border-t border-[#F5EAD4]/20 flex flex-wrap items-center justify-between gap-4">
          
          {/* Bet Chips Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5EAD4]/80 uppercase">Wager:</span>
            <div className="flex items-center gap-1.5">
              {[5, 25, 100, 250, 500].map(val => (
                <button
                  key={val}
                  disabled={gameState === 'PLAYER_TURN' || gameState === 'DEALER_TURN'}
                  onClick={() => {
                    sound.playChipClick();
                    setBet(val);
                  }}
                  className={`w-9 h-9 rounded-full text-xs font-mono-num font-bold flex items-center justify-center border-2 transition-all cursor-pointer disabled:opacity-50 ${
                    bet === val
                      ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08] shadow-comic-ink scale-110'
                      : 'bg-[#1F1914] text-[#F5EAD4] border-[#382F26] hover:border-[#EAB308]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono-num font-bold ml-1 text-[#EAB308]">
              {bet} {currentMode}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {gameState === 'BETTING' || gameState === 'ROUND_OVER' ? (
              <button
                disabled={balance < bet}
                onClick={handleDeal}
                className="px-6 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-base uppercase border-2 border-[#0F0B08] shadow-comic-red transition-all cursor-pointer disabled:opacity-50"
              >
                DEAL HAND
              </button>
            ) : (
              <>
                <button
                  disabled={gameState !== 'PLAYER_TURN'}
                  onClick={handleHit}
                  className="px-4 py-2 bg-[#1F1914] hover:bg-[#2A2016] text-[#F5EAD4] font-display text-sm uppercase border-2 border-[#382F26] hover:border-[#DC2626] cursor-pointer"
                >
                  HIT
                </button>
                <button
                  disabled={gameState !== 'PLAYER_TURN'}
                  onClick={() => handleStand()}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-sm uppercase border-2 border-[#0F0B08] shadow-comic-ink cursor-pointer"
                >
                  STAND
                </button>
                <button
                  disabled={gameState !== 'PLAYER_TURN' || playerHand.length !== 2 || balance < bet}
                  onClick={handleDoubleDown}
                  className="px-4 py-2 bg-[#EAB308] hover:bg-[#ca9a07] text-[#0F0B08] font-display text-sm uppercase border-2 border-[#0F0B08] shadow-comic-ink cursor-pointer disabled:opacity-50"
                  title="Double your stake and take exactly one final card"
                >
                  DOUBLE
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table Provably Fair info */}
      <div className="bg-[#181310] border-2 border-[#382F26] p-3 text-xs flex items-center justify-between text-[#F5EAD4]/70">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#EAB308]" />
          <span>Provably Fair Shoe · S17 · 3:2 Natural Payout</span>
        </div>
        <div className="font-mono-num">
          Cards in shoe: {shoe.length} / 312
        </div>
      </div>
    </div>
  );
};
