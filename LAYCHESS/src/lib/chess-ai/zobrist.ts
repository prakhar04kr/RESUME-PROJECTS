// Zobrist hashing for chess positions. Uses chess.js FEN as the source of
// truth; we derive a stable 53-bit JS-safe hash from piece placement, turn,
// castling, and en passant. Good enough as a TT key for in-browser depths.
import type { Chess } from "chess.js";

// Mulberry32 PRNG seeded deterministically so hash table is reproducible.
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand53(r: () => number): number {
  // Combine two 32-bit values into a 53-bit safe integer.
  const hi = Math.floor(r() * 0x200000); // 21 bits
  const lo = Math.floor(r() * 0x100000000); // 32 bits
  return hi * 0x100000000 + lo;
}

const rand = rng(0xC0FFEE);

// 12 piece types (wP,wN,wB,wR,wQ,wK,bP,bN,bB,bR,bQ,bK) x 64 squares
const PIECE_KEYS: number[][] = Array.from({ length: 12 }, () =>
  Array.from({ length: 64 }, () => rand53(rand)),
);
const SIDE_KEY = rand53(rand);
const CASTLE_KEYS: Record<string, number> = {
  K: rand53(rand),
  Q: rand53(rand),
  k: rand53(rand),
  q: rand53(rand),
};
const EP_FILE_KEYS = Array.from({ length: 8 }, () => rand53(rand));

const PIECE_INDEX: Record<string, number> = {
  P: 0, N: 1, B: 2, R: 3, Q: 4, K: 5,
  p: 6, n: 7, b: 8, r: 9, q: 10, k: 11,
};

export function zobristHash(game: Chess): number {
  const fen = game.fen();
  const [placement, turn, castling, ep] = fen.split(" ");
  let h = 0;

  let sq = 56; // a8 = 0 in our scheme: rank 8 first, file a-h => 0..7
  let file = 0;
  for (const c of placement) {
    if (c === "/") {
      sq -= 8 + file;
      file = 0;
    } else if (c >= "1" && c <= "9") {
      const n = c.charCodeAt(0) - 48;
      sq += n;
      file += n;
    } else {
      const p = PIECE_INDEX[c];
      if (p !== undefined) h ^= PIECE_KEYS[p][sq];
      sq += 1;
      file += 1;
    }
  }

  if (turn === "w") h ^= SIDE_KEY;
  if (castling !== "-") {
    for (const c of castling) if (CASTLE_KEYS[c]) h ^= CASTLE_KEYS[c];
  }
  if (ep && ep !== "-") {
    const f = ep.charCodeAt(0) - 97;
    if (f >= 0 && f < 8) h ^= EP_FILE_KEYS[f];
  }
  return h;
}
