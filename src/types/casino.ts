export type PlayerMode = 'CHIPS' | 'DCDN';

export type GameId = 
  | 'made-men'
  | 'bootleg-run'
  | 'the-vault'
  | 'numbers-racket'
  | 'neon-nights'
  | 'the-sitdown'
  | 'back-room-blackjack'
  | 'wheel-of-the-don'
  | 'high-roller-baccarat';

export type GameCategory = 'all' | 'slots' | 'tables' | 'high-volatility';

export interface GameMetadata {
  id: GameId;
  title: string;
  type: 'slot' | 'table';
  theme: string;
  rtp: number; // e.g. 96.0
  rtpVariants: number[]; // e.g. [94.0, 95.5, 96.0]
  houseEdge: number;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  tagline: string;
  minBet: number;
  maxBet: number;
  maxMultiplier: number;
  paylines?: number;
  isPlayable: boolean;
}

export interface ProvablyFairRound {
  roundId: string;
  gameId: GameId;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  outcomeFloat: number;
  payoutMultiplier: number;
  stake: number;
  payout: number;
  timestamp: number;
  isDCDN: boolean;
}

export interface AICompanion {
  id: 'don-sal' | 'carmela' | 'lefty';
  name: string;
  title: string;
  avatarSeed: string;
  accentColor: string;
  bio: string;
  catchphrases: string[];
  sampleResponses: { prompt: string; text: string }[];
}

export interface OperatorTreasuryState {
  reservesDcdn: number;
  reservesUsd: number;
  openLiabilityDcdn: number;
  coverRatio: number;
  coverRatioFloor: number;
  handle24h: number;
  hold24hPct: number;
  ngr30dUsd: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  networkBlockLag: number;
  baseRpcStatus: 'HEALTHY' | 'SYNCING' | 'DEGRADED';
}

export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  numericValue: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardChips: number;
  completed: boolean;
  claimed: boolean;
  actionGameId?: GameId;
  category: 'slot' | 'blackjack' | 'roulette' | 'social' | 'fairness';
}

export type DepositMethod = 'CASH_DESK' | 'WIRE_TRANSFER' | 'ZELLE_VOUCHER' | 'CAGE_DIRECT';

export interface CashDepositRequest {
  id: string;
  profileId: string;
  profileUsername: string;
  amount: number;
  method: DepositMethod;
  referenceNote: string;
  slipNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  adminNote?: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  nickname: string;
  role: 'player' | 'high_roller' | 'vip' | 'admin';
  chipsBalance: number;
  cashBalance: number; // Real cash game balance ($)
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt: number;
  deskSlipCode: string;
  avatarColor: string;
}


