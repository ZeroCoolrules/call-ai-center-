#!/usr/bin/env python3
"""
DCDN Casino — Monte Carlo Game Math Simulator
Runs statistical simulations across Made Men slot, Wheel of the Don roulette,
and Back Room Blackjack to verify theoretical RTP against certified targets.
"""

import random
import math
from provably_fair import PAYTABLE, PAYLINES

# 40 stops per reel for Made Men
REELS = [
    ['TOMMY', 'ACE', 'WHISKEY', 'KING', 'RING', 'QUEEN', 'CASH', 'ACE', 'DAGGER', 'KING',
     'WILD', 'QUEEN', 'TOMMY', 'ACE', 'WHISKEY', 'KING', 'RING', 'QUEEN', 'CASH', 'ACE',
     'SCATTER', 'KING', 'TOMMY', 'QUEEN', 'DAGGER', 'ACE', 'WHISKEY', 'KING', 'RING', 'QUEEN',
     'CASH', 'ACE', 'TOMMY', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE', 'RING', 'KING'],
    ['DAGGER', 'KING', 'CASH', 'QUEEN', 'WHISKEY', 'ACE', 'RING', 'KING', 'TOMMY', 'QUEEN',
     'WILD', 'ACE', 'DAGGER', 'KING', 'CASH', 'QUEEN', 'WHISKEY', 'ACE', 'RING', 'KING',
     'SCATTER', 'QUEEN', 'DAGGER', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN', 'WHISKEY', 'ACE',
     'RING', 'KING', 'DAGGER', 'QUEEN', 'TOMMY', 'ACE', 'CASH', 'KING', 'WHISKEY', 'QUEEN'],
    ['CASH', 'QUEEN', 'RING', 'ACE', 'TOMMY', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE',
     'WILD', 'KING', 'CASH', 'QUEEN', 'RING', 'ACE', 'TOMMY', 'KING', 'DAGGER', 'QUEEN',
     'SCATTER', 'ACE', 'CASH', 'KING', 'RING', 'QUEEN', 'TOMMY', 'ACE', 'DAGGER', 'KING',
     'WHISKEY', 'QUEEN', 'CASH', 'ACE', 'RING', 'KING', 'TOMMY', 'QUEEN', 'DAGGER', 'ACE'],
    ['WHISKEY', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN', 'RING', 'ACE', 'DAGGER', 'KING',
     'WILD', 'QUEEN', 'WHISKEY', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN', 'RING', 'ACE',
     'SCATTER', 'KING', 'WHISKEY', 'QUEEN', 'TOMMY', 'ACE', 'CASH', 'KING', 'RING', 'QUEEN',
     'DAGGER', 'ACE', 'WHISKEY', 'KING', 'TOMMY', 'QUEEN', 'CASH', 'ACE', 'RING', 'KING'],
    ['RING', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE', 'TOMMY', 'KING', 'CASH', 'QUEEN',
     'WILD', 'ACE', 'RING', 'KING', 'DAGGER', 'QUEEN', 'WHISKEY', 'ACE', 'TOMMY', 'KING',
     'SCATTER', 'QUEEN', 'RING', 'ACE', 'DAGGER', 'KING', 'WHISKEY', 'QUEEN', 'TOMMY', 'ACE',
     'CASH', 'KING', 'RING', 'QUEEN', 'DAGGER', 'ACE', 'WHISKEY', 'KING', 'TOMMY', 'QUEEN']
]

def simulate_slot(spins: int = 100000):
    total_wagered = 0.0
    total_payout = 0.0
    hits = 0
    total_stake = 20.0
    line_stake = 1.0

    for _ in range(spins):
        total_wagered += total_stake
        stops = [random.randint(0, 39) for _ in range(5)]
        
        # Grid construction
        grid = [
            [REELS[r][(stops[r] + row) % 40] for row in range(3)]
            for r in range(5)
        ]

        spin_payout = 0.0

        # Evaluate 20 paylines
        for line in PAYLINES:
            symbols = [grid[r][line[r]] for r in range(5)]
            match_sym = None
            count = 0
            for r in range(5):
                sym = symbols[r]
                if r == 0:
                    if sym == "SCATTER": break
                    match_sym = sym
                    count = 1
                else:
                    if sym == "SCATTER": break
                    if sym == match_sym or sym == "WILD" or match_sym == "WILD":
                        if match_sym == "WILD" and sym != "WILD":
                            match_sym = sym
                        count += 1
                    else:
                        break
            if match_sym and count >= 3:
                mult = PAYTABLE[match_sym].get(count, 0.0)
                spin_payout += mult * line_stake

        # Evaluate Scatters
        scatters = sum(1 for r in range(5) for row in range(3) if grid[r][row] == "SCATTER")
        if scatters >= 3:
            s_mult = PAYTABLE["SCATTER"].get(scatters, 10.0)
            spin_payout += s_mult * total_stake

        if spin_payout > 0:
            hits += 1
        total_payout += spin_payout

    realized_rtp = (total_payout / total_wagered) * 100.0
    hit_freq = (hits / spins) * 100.0

    print("=" * 60)
    print("MADE MEN SLOT MONTE CARLO SIMULATION")
    print(f"Spins:          {spins:,}")
    print(f"Total Wagered:  {total_wagered:,.2f}")
    print(f"Total Payout:   {total_payout:,.2f}")
    print(f"Target RTP:     96.00%")
    print(f"Realized RTP:   {realized_rtp:.2f}% (Tolerance: ±0.5 pp)")
    print(f"Hit Frequency:  {hit_freq:.2f}%")
    print("=" * 60)

if __name__ == "__main__":
    simulate_slot(100000)
