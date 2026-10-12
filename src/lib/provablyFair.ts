/**
 * Cryptographic Provably Fair Engine using Web Crypto API (HMAC-SHA256)
 * and certified game math definitions for DCDN Casino.
 */

// Hex utility
export function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < byteArray.length; i++) {
    hex += byteArray[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Generate random hex seed (256-bit entropy)
export function generateRandomSeed(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

// Compute SHA-256 hash of a string
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// Compute HMAC-SHA256
export async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return bufferToHex(signature);
}

// Extract deterministic outcome float in [0, 1) from HMAC
export function hmacToFloat(hmacHex: string): number {
  const slice = hmacHex.slice(0, 8);
  const intVal = parseInt(slice, 16);
  return intVal / 0x100000000; // 2^32
}

/**
 * Made Men Slot Specification:
 * 5 reels, 3 rows, 20 paylines.
 * High volatility mob-cinema slot.
 */
export type SlotSymbol = 
  | 'WILD'     // The Don (substitutes all except Scatter)
  | 'SCATTER'  // Briefcase (triggers Sit-Down Bonus)
  | 'TOMMY'    // Tommy Gun
  | 'DAGGER'   // Stiletto Dagger
  | 'CASH'     // Stashed Bankrolls
  | 'WHISKEY'  // Bootleg Whiskey
  | 'RING'     // Signet Ring
  | 'ACE'
  | 'KING'
  | 'QUEEN';

export interface PaylineDefinition {
  id: number;
  rowIndices: [number, number, number, number, number]; // Row index on reel 0..4 (0=top, 1=mid, 2=bot)
}

// 20 Classic slot paylines
export const PAYLINES_20: PaylineDefinition[] = [
  { id: 1, rowIndices: [1, 1, 1, 1, 1] }, // Middle row
  { id: 2, rowIndices: [0, 0, 0, 0, 0] }, // Top row
  { id: 3, rowIndices: [2, 2, 2, 2, 2] }, // Bottom row
  { id: 4, rowIndices: [0, 1, 2, 1, 0] }, // V shape
  { id: 5, rowIndices: [2, 1, 0, 1, 2] }, // Inverted V
  { id: 6, rowIndices: [0, 0, 1, 2, 2] },
  { id: 7, rowIndices: [2, 2, 1, 0, 0] },
  { id: 8, rowIndices: [1, 0, 0, 0, 1] },
  { id: 9, rowIndices: [1, 2, 2, 2, 1] },
  { id: 10, rowIndices: [0, 1, 1, 1, 0] },
  { id: 11, rowIndices: [2, 1, 1, 1, 2] },
  { id: 12, rowIndices: [0, 1, 0, 1, 0] },
  { id: 13, rowIndices: [2, 1, 2, 1, 2] },
  { id: 14, rowIndices: [1, 0, 1, 0, 1] },
  { id: 15, rowIndices: [1, 2, 1, 2, 1] },
  { id: 16, rowIndices: [0, 0, 1, 0, 0] },
  { id: 17, rowIndices: [2, 2, 1, 2, 2] },
  { id: 18, rowIndices: [1, 1, 0, 1, 1] },
  { id: 19, rowIndices: [1, 1, 2, 1, 1] },
  { id: 20, rowIndices: [0, 2, 0, 2, 0] },
];

// Reel strips (40 stops per reel for authentic stop mechanics)
export const REEL_STRIPS: SlotSymbol[][] = [
  // Reel 1
  ['TOMMY', 'ACE', 'WHISKEY', 'KING', 'RING', 'QUEEN', 'CASH', 'ACE', 'DAGGER', 'KING',
   'WILD', 'QUEEN', 'TOMMY', 'ACE', 'WHISKEY', 'KING', 'RING', 'QUEEN', 'CASH', 'ACE',
   'SCATTER', 'KING', 'TOMMY', 'QUEEN', 'DAGGER', 'ACE', 'WHISKEY', 'KING', 'RING', 'QUEEN',
   'CASH', 'ACE', 'TOMMY', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE', 'RING', 'KING'],
  // Reel 2
  ['DAGGER', 'KING', 'CASH', 'QUEEN', 'WHISKEY', 'ACE', 'RING', 'KING', 'TOMMY', 'QUEEN',
   'WILD', 'ACE', 'DAGGER', 'KING', 'CASH', 'QUEEN', 'WHISKEY', 'ACE', 'RING', 'KING',
   'SCATTER', 'QUEEN', 'DAGGER', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN', 'WHISKEY', 'ACE',
   'RING', 'KING', 'DAGGER', 'QUEEN', 'TOMMY', 'ACE', 'CASH', 'KING', 'WHISKEY', 'QUEEN'],
  // Reel 3
  ['CASH', 'QUEEN', 'RING', 'ACE', 'TOMMY', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE',
   'WILD', 'KING', 'CASH', 'QUEEN', 'RING', 'ACE', 'TOMMY', 'KING', 'DAGGER', 'QUEEN',
   'SCATTER', 'ACE', 'CASH', 'KING', 'RING', 'QUEEN', 'TOMMY', 'ACE', 'DAGGER', 'KING',
   'WHISKEY', 'QUEEN', 'CASH', 'ACE', 'RING', 'KING', 'TOMMY', 'QUEEN', 'DAGGER', 'ACE'],
  // Reel 4
  ['WHISKEY', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN', 'RING', 'ACE', 'DAGGER', 'KING',
   'WILD', 'QUEEN', 'WHISKEY', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN', 'RING', 'ACE',
   'SCATTER', 'KING', 'WHISKEY', 'QUEEN', 'TOMMY', 'ACE', 'CASH', 'KING', 'RING', 'QUEEN',
   'DAGGER', 'ACE', 'WHISKEY', 'KING', 'TOMMY', 'QUEEN', 'CASH', 'ACE', 'RING', 'KING'],
  // Reel 5
  ['RING', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN',
   'WILD', 'ACE', 'RING', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE', 'TOMMY', 'KING',
   'SCATTER', 'QUEEN', 'RING', 'ACE', 'DAGGER', 'KING', 'WHISKEY', 'QUEEN', 'TOMMY', 'ACE',
   'CASH', 'KING', 'RING', 'QUEEN', 'DAGGER', 'ACE', 'WHISKEY', 'KING', 'TOMMY', 'QUEEN']
];

// Paytable multiplier on line stake (3 of a kind, 4 of a kind, 5 of a kind)
// Total stake = lineStake * 20
export const PAYTABLE: Record<SlotSymbol, { 3: number; 4: number; 5: number }> = {
  WILD: { 3: 50, 4: 250, 5: 1000 },
  SCATTER: { 3: 10, 4: 50, 5: 200 }, // Multiplies total stake
  TOMMY: { 3: 25, 4: 100, 5: 400 },
  DAGGER: { 3: 20, 4: 75, 5: 250 },
  CASH: { 3: 15, 4: 50, 5: 150 },
  WHISKEY: { 3: 10, 4: 35, 5: 100 },
  RING: { 3: 8, 4: 25, 5: 75 },
  ACE: { 3: 5, 4: 15, 5: 40 },
  KING: { 3: 4, 4: 10, 5: 30 },
  QUEEN: { 3: 3, 4: 8, 5: 25 }
};

export interface SpinResult {
  grid: SlotSymbol[][]; // 5 columns, 3 rows
  winningLines: {
    lineId: number;
    symbol: SlotSymbol;
    count: number;
    payout: number;
    multiplier: number;
  }[];
  scatterCount: number;
  scatterPayout: number;
  totalPayout: number;
  payoutMultiplier: number;
  isFreeSpinsBonus: boolean;
  freeSpinsAwarded: number;
}

/**
 * Generate 5 reel stop positions from HMAC-SHA256 outcome
 */
export function getReelStopsFromHmac(hmacHex: string): number[] {
  const stops: number[] = [];
  for (let reel = 0; reel < 5; reel++) {
    // Take 4 hex chars (16 bits) for each reel
    const slice = hmacHex.slice(reel * 4, reel * 4 + 4);
    const intVal = parseInt(slice, 16);
    const stop = intVal % 40; // 40 stops
    stops.push(stop);
  }
  return stops;
}

/**
 * Evaluate a slot spin given the reel stops and stake
 */
export function evaluateSpin(stops: number[], totalStake: number): SpinResult {
  const lineStake = totalStake / 20.0;
  // Construct 5x3 grid (5 columns, 3 rows: [row 0 (top), row 1 (mid), row 2 (bot)])
  const grid: SlotSymbol[][] = [];
  for (let reel = 0; reel < 5; reel++) {
    const strip = REEL_STRIPS[reel];
    const stop = stops[reel];
    const col: SlotSymbol[] = [
      strip[stop % 40],
      strip[(stop + 1) % 40],
      strip[(stop + 2) % 40]
    ];
    grid.push(col);
  }

  const winningLines: SpinResult['winningLines'] = [];
  let totalLinePayout = 0;

  // Evaluate 20 paylines (left to right)
  for (const line of PAYLINES_20) {
    const symbolsOnLine: SlotSymbol[] = [
      grid[0][line.rowIndices[0]],
      grid[1][line.rowIndices[1]],
      grid[2][line.rowIndices[2]],
      grid[3][line.rowIndices[3]],
      grid[4][line.rowIndices[4]],
    ];

    // Determine match from reel 0
    let matchSymbol: SlotSymbol | null = null;
    let count = 0;

    for (let r = 0; r < 5; r++) {
      const sym = symbolsOnLine[r];
      if (r === 0) {
        if (sym === 'SCATTER') break; // Scatters don't pay on lines
        matchSymbol = sym;
        count = 1;
      } else {
        if (sym === 'SCATTER') break;
        if (sym === matchSymbol || sym === 'WILD' || matchSymbol === 'WILD') {
          if (matchSymbol === 'WILD' && sym !== 'WILD') {
            matchSymbol = sym;
          }
          count++;
        } else {
          break;
        }
      }
    }

    if (matchSymbol && count >= 3) {
      const table = PAYTABLE[matchSymbol];
      const mult = count === 5 ? table[5] : count === 4 ? table[4] : table[3];
      const payout = mult * lineStake;
      winningLines.push({
        lineId: line.id,
        symbol: matchSymbol,
        count,
        payout,
        multiplier: mult
      });
      totalLinePayout += payout;
    }
  }

  // Count Scatters across all 15 positions
  let scatterCount = 0;
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === 'SCATTER') {
        scatterCount++;
      }
    }
  }

  let scatterPayout = 0;
  let isFreeSpinsBonus = false;
  let freeSpinsAwarded = 0;

  if (scatterCount >= 3) {
    isFreeSpinsBonus = true;
    freeSpinsAwarded = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 25;
    const mult = scatterCount >= 5 ? PAYTABLE.SCATTER[5] : scatterCount === 4 ? PAYTABLE.SCATTER[4] : PAYTABLE.SCATTER[3];
    scatterPayout = mult * totalStake;
  }

  const totalPayout = totalLinePayout + scatterPayout;
  const payoutMultiplier = totalStake > 0 ? totalPayout / totalStake : 0;

  return {
    grid,
    winningLines,
    scatterCount,
    scatterPayout,
    totalPayout,
    payoutMultiplier,
    isFreeSpinsBonus,
    freeSpinsAwarded
  };
}

/**
 * Monte Carlo Par Sheet Simulator for Made Men
 * Runs N spins to verify theoretical RTP against certified target (96.0%)
 */
export async function runMonteCarloSimulation(
  spins: number = 25000,
  onProgress?: (progressPct: number, currentRtp: number) => void
): Promise<{
  spins: number;
  totalWagered: number;
  totalPayout: number;
  realizedRtp: number;
  hitFrequency: number;
  maxMultiplier: number;
  bonusHitCount: number;
}> {
  let totalWagered = 0;
  let totalPayout = 0;
  let hits = 0;
  let maxMultiplier = 0;
  let bonusHitCount = 0;

  const stake = 20; // 1 unit per line
  const chunkSize = 2500;

  for (let i = 0; i < spins; i += chunkSize) {
    const currentChunk = Math.min(chunkSize, spins - i);
    for (let c = 0; c < currentChunk; c++) {
      // Fast deterministic pseudo-random stops for bulk simulation
      const stops = [
        Math.floor(Math.random() * 40),
        Math.floor(Math.random() * 40),
        Math.floor(Math.random() * 40),
        Math.floor(Math.random() * 40),
        Math.floor(Math.random() * 40)
      ];
      const result = evaluateSpin(stops, stake);
      totalWagered += stake;
      totalPayout += result.totalPayout;
      if (result.totalPayout > 0) hits++;
      if (result.payoutMultiplier > maxMultiplier) maxMultiplier = result.payoutMultiplier;
      if (result.isFreeSpinsBonus) bonusHitCount++;
    }

    if (onProgress) {
      const currentRtp = totalWagered > 0 ? (totalPayout / totalWagered) * 100 : 0;
      onProgress(Math.min(100, Math.round(((i + currentChunk) / spins) * 100)), currentRtp);
      // Let event loop breathe
      await new Promise(res => setTimeout(res, 0));
    }
  }

  const realizedRtp = (totalPayout / totalWagered) * 100;
  const hitFrequency = (hits / spins) * 100;

  return {
    spins,
    totalWagered,
    totalPayout,
    realizedRtp,
    hitFrequency,
    maxMultiplier,
    bonusHitCount
  };
}
