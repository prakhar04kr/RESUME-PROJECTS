// Negamax with alpha-beta, transposition table, MVV-LVA + killer heuristic.
import { Chess, type Move } from "chess.js";
import { evaluate } from "./evaluate";
import { zobristHash } from "./zobrist";

type TTFlag = "EXACT" | "LOWER" | "UPPER";
interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
  best?: string; // SAN
}

const PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 20 };

export interface SearchStats {
  nodes: number;
  ttHits: number;
  depth: number;
  bestMove: string | null;
  score: number;
  elapsedMs: number;
}

export interface SearchResult {
  move: Move | null;
  stats: SearchStats;
}

export function searchBestMove(fen: string, maxDepth: number): SearchResult {
  const game = new Chess(fen);
  const tt = new Map<number, TTEntry>();
  const killers: string[][] = Array.from({ length: maxDepth + 2 }, () => []);
  const stats: SearchStats = {
    nodes: 0,
    ttHits: 0,
    depth: 0,
    bestMove: null,
    score: 0,
    elapsedMs: 0,
  };
  const start = performance.now();

  // Iterative deepening — improves move ordering via TT best-move.
  let bestMove: Move | null = null;
  let bestScore = 0;
  for (let d = 1; d <= maxDepth; d++) {
    const result = negamaxRoot(game, d, tt, killers, stats);
    if (result.move) {
      bestMove = result.move;
      bestScore = result.score;
      stats.depth = d;
      stats.bestMove = result.move.san;
      stats.score = result.score;
    }
  }
  stats.elapsedMs = performance.now() - start;
  return { move: bestMove, stats };
}

function negamaxRoot(
  game: Chess,
  depth: number,
  tt: Map<number, TTEntry>,
  killers: string[][],
  stats: SearchStats,
): { move: Move | null; score: number } {
  const color = game.turn() === "w" ? 1 : -1;
  let alpha = -Infinity;
  const beta = Infinity;
  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  const moves = orderMoves(game, game.moves({ verbose: true }) as Move[], tt, killers, 0);
  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, -color, tt, killers, 1, stats);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
    if (score > alpha) alpha = score;
  }
  return { move: bestMove, score: bestScore };
}

function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  color: number,
  tt: Map<number, TTEntry>,
  killers: string[][],
  ply: number,
  stats: SearchStats,
): number {
  stats.nodes++;

  if (game.isCheckmate()) return -100000 + ply;
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;

  const alphaOrig = alpha;
  const hash = zobristHash(game);
  const ttEntry = tt.get(hash);
  if (ttEntry && ttEntry.depth >= depth) {
    stats.ttHits++;
    if (ttEntry.flag === "EXACT") return ttEntry.score;
    if (ttEntry.flag === "LOWER" && ttEntry.score > alpha) alpha = ttEntry.score;
    else if (ttEntry.flag === "UPPER" && ttEntry.score < beta) beta = ttEntry.score;
    if (alpha >= beta) return ttEntry.score;
  }

  if (depth <= 0) return quiescence(game, alpha, beta, color, stats);

  const moves = orderMoves(game, game.moves({ verbose: true }) as Move[], tt, killers, ply);
  let bestScore = -Infinity;
  let bestSan: string | undefined;
  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, -color, tt, killers, ply + 1, stats);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      bestSan = m.san;
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      // Killer move (non-capture beta cutoff)
      if (!m.captured) {
        const k = killers[ply];
        if (k[0] !== m.san) {
          k[1] = k[0];
          k[0] = m.san;
        }
      }
      break;
    }
  }

  let flag: TTFlag = "EXACT";
  if (bestScore <= alphaOrig) flag = "UPPER";
  else if (bestScore >= beta) flag = "LOWER";
  tt.set(hash, { depth, score: bestScore, flag, best: bestSan });

  return bestScore;
}

function quiescence(
  game: Chess,
  alpha: number,
  beta: number,
  color: number,
  stats: SearchStats,
): number {
  stats.nodes++;
  const standPat = color * evaluate(game);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  const captures = (game.moves({ verbose: true }) as Move[]).filter((m) => m.captured);
  captures.sort((a, b) => mvvLva(b) - mvvLva(a));
  for (const m of captures) {
    game.move(m);
    const score = -quiescence(game, -beta, -alpha, -color, stats);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function mvvLva(m: Move): number {
  if (!m.captured) return 0;
  return 10 * PIECE_VAL[m.captured] - PIECE_VAL[m.piece];
}

function orderMoves(
  game: Chess,
  moves: Move[],
  tt: Map<number, TTEntry>,
  killers: string[][],
  ply: number,
): Move[] {
  const ttEntry = tt.get(zobristHash(game));
  const ttBest = ttEntry?.best;
  const k = killers[ply] || [];
  return moves
    .map((m) => {
      let s = 0;
      if (ttBest && m.san === ttBest) s += 100000;
      if (m.captured) s += 1000 + mvvLva(m);
      if (m.promotion) s += 800;
      if (m.san === k[0]) s += 90;
      else if (m.san === k[1]) s += 80;
      return { m, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}
