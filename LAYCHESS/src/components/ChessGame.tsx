import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { searchBestMove, type SearchStats } from "@/lib/chess-ai/search";
import { playForMove, sounds } from "@/lib/chess-ai/sounds";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Lightbulb, RotateCcw, Undo2, Volume2, VolumeX } from "lucide-react";

type GameStatus = "playing" | "checkmate" | "draw";

const DOT_LIGHT = "radial-gradient(circle, rgba(20,20,20,0.35) 22%, transparent 24%)";
const DOT_DARK = "radial-gradient(circle, rgba(255,255,255,0.45) 22%, transparent 24%)";
const RING = "inset 0 0 0 3px oklch(0.58 0.16 35 / 0.65)";

export function ChessGame() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [thinking, setThinking] = useState(false);
  const [depth, setDepth] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const [, setStats] = useState<SearchStats | null>(null);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [hint, setHint] = useState<{ from: string; to: string } | null>(null);
  const [tilt3d, setTilt3d] = useState(true);
  const [captured, setCaptured] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });
  const [soundOn, setSoundOn] = useState(true);
  const boardWrapRef = useRef<HTMLDivElement>(null);

  const updateStatus = useCallback((mv?: Move) => {
    const g = gameRef.current;
    setFen(g.fen());
    setHistory(g.history());
    if (mv?.captured) {
      setCaptured((c) => {
        const next = { ...c, w: [...c.w], b: [...c.b] };
        const sym = mv.color === "w" ? mv.captured!.toUpperCase() : mv.captured!;
        // captured by mover
        next[mv.color].push(sym);
        return next;
      });
    }
    const over = g.isGameOver();
    if (g.isCheckmate()) setStatus("checkmate");
    else if (g.isDraw() || g.isStalemate() || g.isThreefoldRepetition()) setStatus("draw");
    else setStatus("playing");
    if (mv && soundOn) {
      playForMove(mv.flags, { check: g.inCheck(), gameOver: over });
    }
  }, [soundOn]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegalTargets([]);
  }, []);

  const aiMove = useCallback(() => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    setThinking(true);
    setTimeout(() => {
      const result = searchBestMove(g.fen(), depth);
      if (result.move) {
        const m = g.move(result.move);
        setStats(result.stats);
        setLastMove({ from: m.from as Square, to: m.to as Square });
        updateStatus(m);
      } else {
        updateStatus();
      }
      setThinking(false);
    }, 30);
  }, [depth, updateStatus]);

  const tryMove = useCallback(
    (from: Square, to: Square): boolean => {
      const g = gameRef.current;
      if (g.turn() !== "w" || status !== "playing" || thinking) return false;
      try {
        const m = g.move({ from, to, promotion: "q" });
        if (!m) return false;
        setLastMove({ from, to });
        setHint(null);
        clearSelection();
        updateStatus(m);
        setTimeout(aiMove, 80);
        return true;
      } catch {
        return false;
      }
    },
    [aiMove, status, thinking, updateStatus, clearSelection],
  );

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
      if (!targetSquare) return false;
      return tryMove(sourceSquare as Square, targetSquare as Square);
    },
    [tryMove],
  );

  const onSquareClick = useCallback(
    ({ square }: { square: string; piece: unknown }) => {
      const g = gameRef.current;
      const sq = square as Square;
      if (selected) {
        if (sq === selected) {
          clearSelection();
          return;
        }
        if (legalTargets.some((m) => m.to === sq)) {
          tryMove(selected, sq);
          return;
        }
      }
      const piece = g.get(sq);
      if (piece && piece.color === g.turn() && g.turn() === "w") {
        const moves = g.moves({ square: sq, verbose: true }) as Move[];
        setSelected(sq);
        setLegalTargets(moves);
        if (soundOn) sounds.select();
      } else {
        clearSelection();
      }
    },
    [selected, legalTargets, tryMove, clearSelection, soundOn],
  );

  const reset = useCallback(() => {
    gameRef.current = new Chess();
    setStats(null);
    setLastMove(null);
    setHint(null);
    setCaptured({ w: [], b: [] });
    clearSelection();
    setFen(gameRef.current.fen());
    setHistory([]);
    setStatus("playing");
  }, [clearSelection]);

  const undo = useCallback(() => {
    const g = gameRef.current;
    g.undo();
    g.undo();
    setLastMove(null);
    setHint(null);
    clearSelection();
    setFen(g.fen());
    setHistory(g.history());
    setStatus("playing");
  }, [clearSelection]);

  const requestHint = useCallback(() => {
    const g = gameRef.current;
    if (g.turn() !== "w" || thinking || status !== "playing") return;
    setThinking(true);
    setTimeout(() => {
      const result = searchBestMove(g.fen(), Math.max(depth, 3));
      if (result.move) {
        setHint({ from: result.move.from, to: result.move.to });
        setStats(result.stats);
      }
      setThinking(false);
    }, 30);
  }, [depth, status, thinking]);

  // Find king-in-check square for highlight
  const checkSquare = useMemo<Square | null>(() => {
    const g = gameRef.current;
    if (!g.inCheck()) return null;
    const turn = g.turn();
    for (const row of g.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) return sq.square as Square;
      }
    }
    return null;
  }, [fen]);

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { background: "oklch(0.78 0.14 80 / 0.55)" };
      styles[lastMove.to] = { background: "oklch(0.78 0.14 80 / 0.7)" };
    }
    if (selected) {
      styles[selected] = { ...(styles[selected] ?? {}), boxShadow: RING };
    }
    for (const m of legalTargets) {
      const isCapture = !!m.captured;
      const isLight = (m.to.charCodeAt(0) - 96 + parseInt(m.to[1], 10)) % 2 === 0;
      styles[m.to] = {
        ...(styles[m.to] ?? {}),
        backgroundImage: isLight ? DOT_DARK : DOT_LIGHT,
        ...(isCapture
          ? {
              boxShadow: "inset 0 0 0 4px oklch(0.55 0.22 27 / 0.55)",
              backgroundImage: undefined,
            }
          : {}),
      };
    }
    if (hint) {
      styles[hint.from] = {
        ...(styles[hint.from] ?? {}),
        boxShadow: "inset 0 0 0 4px oklch(0.65 0.2 145 / 0.85)",
      };
      styles[hint.to] = {
        ...(styles[hint.to] ?? {}),
        boxShadow: "inset 0 0 0 4px oklch(0.65 0.2 145 / 0.85)",
      };
    }
    if (checkSquare) {
      styles[checkSquare] = {
        ...(styles[checkSquare] ?? {}),
        background:
          "radial-gradient(circle, oklch(0.55 0.22 27 / 0.85) 30%, oklch(0.55 0.22 27 / 0) 75%)",
        animation: "pulse-check 1.2s ease-in-out infinite",
      };
    }
    return styles;
  }, [lastMove, selected, legalTargets, hint, checkSquare]);

  const arrows = useMemo(
    () => (hint ? [{ startSquare: hint.from, endSquare: hint.to, color: "oklch(0.65 0.2 145)" }] : []),
    [hint],
  );

  const boardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop,
      onSquareClick,
      id: "main-board",
      boardOrientation: "white" as const,
      animationDurationInMs: 250,
      showAnimations: true,
      allowDrawingArrows: true,
      arrows,
      squareStyles,
      darkSquareStyle: {
        background:
          "linear-gradient(135deg, oklch(0.36 0.05 50) 0%, oklch(0.28 0.04 45) 100%)",
      },
      lightSquareStyle: {
        background:
          "linear-gradient(135deg, oklch(0.93 0.04 80) 0%, oklch(0.86 0.04 75) 100%)",
      },
      dropSquareStyle: { boxShadow: "inset 0 0 0 4px oklch(0.58 0.16 35 / 0.7)" },
    }),
    [fen, onPieceDrop, onSquareClick, squareStyles, arrows],
  );

  // 3D tilt follow cursor
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el || !tilt3d) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-py * 22).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(px * 26).toFixed(2)}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--rx", `0deg`);
      el.style.setProperty("--ry", `0deg`);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [tilt3d]);

  const turn = gameRef.current.turn() === "w" ? "White" : "Black";
  return (
    <div className="mx-auto w-full max-w-[640px]">
      {/* Captured by black (top) */}
      <CapturedRow pieces={captured.b} label="captured" />

      <div
        className="board-3d-wrap mt-3"
        ref={boardWrapRef}
        style={{ perspective: tilt3d ? "1100px" : "none" }}
      >
        <div
          className="board-3d-inner relative rounded-2xl border border-border bg-card p-3 shadow-elegant transition-transform duration-200 ease-out will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            transform: tilt3d
              ? "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))"
              : "none",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%, oklch(1 0 0 / 0.15), transparent 60%)",
              mixBlendMode: "overlay",
            }}
          />
          <Chessboard options={boardOptions} />
          {thinking && (
            <div className="pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-full bg-foreground/85 px-3 py-1.5 text-xs text-background backdrop-blur animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              thinking
            </div>
          )}
        </div>
      </div>

      {/* Captured by white (bottom) */}
      <CapturedRow pieces={captured.w} label="taken" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-sm text-muted-foreground">
          {status === "checkmate" && (
            <span className="text-accent">
              Checkmate · {turn === "White" ? "Black" : "White"} wins
            </span>
          )}
          {status === "draw" && <span>Draw</span>}
          {status === "playing" && (
            <span>
              Turn: <span className="text-foreground">{turn}</span>
              {gameRef.current.inCheck() && (
                <span className="ml-2 text-destructive">· check</span>
              )}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundOn((s) => {
                if (!s) sounds.select();
                return !s;
              });
            }}
            className="gap-1.5"
            aria-label={soundOn ? "Mute" : "Unmute"}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={requestHint}
            disabled={thinking || status !== "playing"}
            className="gap-1.5"
          >
            <Lightbulb className="h-4 w-4" /> Hint
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={thinking || history.length < 2}
            className="gap-1.5"
          >
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
          <Button variant="default" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 rounded-lg border border-border bg-card/60 px-4 py-3">
        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Difficulty</span>
          <Slider
            value={[depth]}
            min={1}
            max={4}
            step={1}
            onValueChange={(v) => setDepth(v[0])}
            disabled={thinking}
            className="flex-1"
          />
          <span className="font-mono text-sm tabular-nums text-foreground">{depth}</span>
        </div>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          3D <Switch checked={tilt3d} onCheckedChange={setTilt3d} />
        </label>
      </div>
    </div>
  );
}


function CapturedRow({ pieces, label }: { pieces: string[]; label: string }) {
  const symbol: Record<string, string> = {
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
    k: "♚",
    P: "♙",
    N: "♘",
    B: "♗",
    R: "♖",
    Q: "♕",
    K: "♔",
  };
  return (
    <div className="flex min-h-6 items-center gap-1 px-1 text-lg leading-none">
      {pieces.length === 0 ? (
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      ) : (
        pieces.map((p, i) => (
          <span
            key={`${p}-${i}`}
            className="text-foreground/70 animate-scale-in"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {symbol[p]}
          </span>
        ))
      )}
    </div>
  );
}

export default ChessGame;
