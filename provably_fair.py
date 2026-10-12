#!/usr/bin/env python3
"""
DCDN Casino — Provably Fair Cryptographic Engine & Slot Math Evaluator
Implements HMAC-SHA256 commitment scheme, client entropy, and 20-line slot evaluation.
"""

import hmac
import hashlib
import secrets
from typing import List, Dict, Tuple, Any

def generate_server_seed() -> str:
    """Generates 256-bit cryptographic entropy as a 64-char hex string."""
    return secrets.token_hex(32)

def hash_server_seed(server_seed: str) -> str:
    """SHA-256 hash committed to player before the round begins."""
    return hashlib.sha256(server_seed.encode("utf-8")).hexdigest()

def calculate_outcome_float(server_seed: str, client_seed: str, nonce: int) -> Tuple[str, float]:
    """
    Computes HMAC-SHA256(key=server_seed, msg=client_seed:nonce)
    Extracts first 32-bit slice and maps to [0, 1)
    """
    message = f"{client_seed}:{nonce}".encode("utf-8")
    hmac_obj = hmac.new(server_seed.encode("utf-8"), message, hashlib.sha256)
    hmac_hex = hmac_obj.hexdigest()
    first_32_bits = int(hmac_hex[:8], 16)
    outcome_float = first_32_bits / 0x100000000
    return hmac_hex, outcome_float

def get_reel_stops(hmac_hex: str) -> List[int]:
    """Extracts 5 reel stops (0-39) for 5 independent reels from HMAC."""
    stops = []
    for reel in range(5):
        slice_hex = hmac_hex[reel * 4 : reel * 4 + 4]
        int_val = int(slice_hex, 16)
        stops.append(int_val % 40)
    return stops

# Paytable multipliers on line stake (line stake = total stake / 20)
PAYTABLE: Dict[str, Dict[int, float]] = {
    "WILD": {3: 50.0, 4: 250.0, 5: 1000.0},
    "SCATTER": {3: 10.0, 4: 50.0, 5: 200.0},
    "TOMMY": {3: 25.0, 4: 100.0, 5: 400.0},
    "DAGGER": {3: 20.0, 4: 75.0, 5: 250.0},
    "CASH": {3: 15.0, 4: 50.0, 5: 150.0},
    "WHISKEY": {3: 10.0, 4: 35.0, 5: 100.0},
    "RING": {3: 8.0, 4: 25.0, 5: 75.0},
    "ACE": {3: 5.0, 4: 15.0, 5: 40.0},
    "KING": {3: 4.0, 4: 10.0, 5: 30.0},
    "QUEEN": {3: 3.0, 4: 8.0, 5: 25.0},
}

# 20 Paylines defined by row index on reels 0..4 (0=top, 1=middle, 2=bottom)
PAYLINES = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
    [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 0, 1, 0, 1], [1, 2, 1, 2, 1],
    [0, 0, 1, 0, 0], [2, 2, 1, 2, 2], [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 0, 2, 0],
]

if __name__ == "__main__":
    print("DCDN Casino Provably Fair Demo")
    server_seed = generate_server_seed()
    seed_hash = hash_server_seed(server_seed)
    print(f"Pre-committed SHA256(Server Seed): {seed_hash}")
    
    client_seed = "player-lucky-seed"
    nonce = 1
    hmac_val, outcome = calculate_outcome_float(server_seed, client_seed, nonce)
    print(f"HMAC: {hmac_val}")
    print(f"Outcome Float: {outcome:.8f}")
    print(f"Stops: {get_reel_stops(hmac_val)}")
