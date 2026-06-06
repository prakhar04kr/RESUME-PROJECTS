import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { toast } from "sonner";
import { searchBestMove, type SearchStats } from "@/lib/chess-ai/search";
import { playForMove, sounds } from "@/lib/chess-ai/sounds";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Lightbulb, Palette, RotateCcw, Undo2, Users, Volume2, VolumeX } from "lucide-react";

type GameStatus = "playing" | "checkmate" | "draw";

type ThemeKey = "warm" | "emerald" | "midnight" | "rose" | "slate";

const THEMES: Record<
  ThemeKey,
  { label: string; light: string; dark: string; ring: string; swatch: [string, string] }
> = {
  warm: {
    label: "Warm Paper",
    light: "linear-gradient(135deg, oklch(0.93 0.04 80) 0%, oklch(0.86 0.04 75) 100%)",
    dark: "linear-gradient(135deg, oklch(0.36 0.05 50) 0%, oklch(0.28 0.04 45) 100%)",
    ring: "oklch(0.58 0.16 35 / 0.7)",
    swatch: ["#e8d9b8", "#5a4632"],
  },
  emerald: {
    label: "Emerald Club",
    light: "linear-gradient(135deg, oklch(0.93 0.04 110) 0%, oklch(0.86 0.05 105) 100%)",
    dark: "linear-gradient(135deg, oklch(0.38 0.09 150) 0%, oklch(0.28 0.07 150) 100%)",
    ring: "oklch(0.65 0.18 145 / 0.75)",
    swatch: ["#e6dfb8", "#2f5d3f"],
  },
  midnight: {
    label: "Midnight",
    light: "linear-gradient(135deg, oklch(0.85 0.02 250) 0%, oklch(0.75 0.03 250) 100%)",
    dark: "linear-gradient(135deg, oklch(0.28 0.05 260) 0%, oklch(0.18 0.05 260) 100%)",
    ring: "oklch(0.7 0.18 250 / 0.75)",
    swatch: ["#c7cfdc", "#28324d"],
  },
  rose: {
    label: "Rose Marble",
    light: "linear-gradient(135deg, oklch(0.94 0.03 20) 0%, oklch(0.88 0.04 15) 100%)",
    dark: "linear-gradient(135deg, oklch(0.4 0.09 15) 0%, oklch(0.3 0.08 15) 100%)",
    ring: "oklch(0.65 0.2 20 / 0.75)",
    swatch: ["#efd2cf", "#6e3438"],
  },
  slate: {
    label: "Slate Stone",
    light: "linear-gradient(135deg, oklch(0.9 0.005 250) 0%, oklch(0.82 0.005 250) 100%)",
    dark: "linear-gradient(135deg, oklch(0.35 0.01 250) 0%, oklch(0.25 0.01 250) 100%)",
    ring: "oklch(0.6 0.05 250 / 0.75)",
    swatch: ["#d6d7da", "#3a3d44"],
  },
};

const COMPLIMENTS = [
  "Nice move.",
  "Sharp eye!",
  "Elegant.",
  "Solid choice.",
  "I like that.",
  "Confident play.",
  "Cool head.",
  "Stylish.",
  "Well-timed.",
  "Crisp.",
];
const CAPTURE_COMPLIMENTS = [
  "Clean capture!",
  "Material won — nice.",
  "Snatched it.",
  "Brutal but fair.",
];
const CHECK_COMPLIMENTS = ["Check! Pressure on.", "Squeezing the king.", "Aggressive!"];
const CASTLE_COMPLIMENTS = ["King tucked in safely.", "Castled — wise."];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type PieceThemeKey = "classic" | "symbols" | "outline";

const PIECE_GLYPHS: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};
const PIECE_OUTLINE: Record<string, string> = {
  wK: "♚", wQ: "♛", wR: "♜", wB: "♝", wN: "♞", wP: "♟",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function makePieceRenderers(themeKey: PieceThemeKey) {
  if (themeKey === "classic") return undefined;
  const keys = Object.keys(PIECE_GLYPHS);
  // react-chessboard PieceRenderObject signature
  const out: Record<
    string,
    (props?: { fill?: string; square?: string; svgStyle?: React.CSSProperties }) => React.ReactElement
  > = {};
  for (const k of keys) {
    out[k] = () => {
      const isWhite = k[0] === "w";
      const ch = themeKey === "symbols" ? PIECE_GLYPHS[k] : PIECE_OUTLINE[k];
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "82cqi",
            lineHeight: 1,
            color: isWhite ? "#fafafa" : "#0a0a0a",
            WebkitTextStroke: themeKey === "outline"
              ? (isWhite ? "1.5px #0a0a0a" : "1.5px #fafafa")
              : (isWhite ? "1px #1a1a1a" : "1px #fefefe"),
            textShadow: isWhite
              ? "0 2px 0 rgba(0,0,0,0.55), 0 4px 6px rgba(0,0,0,0.35)"
              : "0 2px 0 rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.45)",
            userSelect: "none",
            containerType: "inline-size",
            fontFamily: "'DejaVu Sans', 'Segoe UI Symbol', 'Arial Unicode MS', sans-serif",
          }}
        >
          {ch}
        </div>
      );
    };
  }
  return out;
}

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
  const [theme, setTheme] = useState<ThemeKey>("warm");
  const [pieceTheme, setPieceTheme] = useState<PieceThemeKey>("classic");
  const [twoPlayer, setTwoPlayer] = useState(false);
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
      if (status !== "playing" || thinking) return false;
      if (!twoPlayer && g.turn() !== "w") return false;
      try {
        const m = g.move({ from, to, promotion: "q" });
        if (!m) return false;
        setLastMove({ from, to });
        setHint(null);
        clearSelection();
        updateStatus(m);
        // Compliment the player
        let msg: string;
        if (g.isCheckmate()) msg = "Checkmate — masterful!";
        else if (m.flags.includes("k") || m.flags.includes("q")) msg = pick(CASTLE_COMPLIMENTS);
        else if (g.inCheck()) msg = pick(CHECK_COMPLIMENTS);
        else if (m.captured) msg = pick(CAPTURE_COMPLIMENTS);
        else msg = pick(COMPLIMENTS);
        toast(msg, { duration: 1600 });
        if (!twoPlayer) setTimeout(aiMove, 80);
        return true;
      } catch {
        return false;
      }
    },
    [aiMove, status, thinking, twoPlayer, updateStatus, clearSelection],
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
      const canSelect =
        piece && piece.color === g.turn() && (twoPlayer || g.turn() === "w");
      if (canSelect) {
        const moves = g.moves({ square: sq, verbose: true }) as Move[];
        setSelected(sq);
        setLegalTargets(moves);
        if (soundOn) sounds.select();
      } else {
        clearSelection();
      }
    },
    [selected, legalTargets, tryMove, clearSelection, soundOn, twoPlayer],
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
    if (thinking || status !== "playing") return;
    if (!twoPlayer && g.turn() !== "w") return;
    setThinking(true);
    setTimeout(() => {
      const result = searchBestMove(g.fen(), Math.max(depth, 3));
      if (result.move) {
        setHint({ from: result.move.from, to: result.move.to });
        setStats(result.stats);
      }
      setThinking(false);
    }, 30);
  }, [depth, status, thinking, twoPlayer]);

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

  const pieceRenderers = useMemo(() => makePieceRenderers(pieceTheme), [pieceTheme]);

  const boardOptions = useMemo(() => {
    const t = THEMES[theme];
    return {
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
      ...(pieceRenderers ? { pieces: pieceRenderers } : {}),
      darkSquareStyle: { background: t.dark },
      lightSquareStyle: { background: t.light },
      dropSquareStyle: { boxShadow: `inset 0 0 0 4px ${t.ring}` },
    };
  }, [fen, onPieceDrop, onSquareClick, squareStyles, arrows, theme, pieceRenderers]);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" aria-label="Board theme">
                <Palette className="h-4 w-4" />
                <span
                  className="h-3 w-3 rounded-sm border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${THEMES[theme].swatch[0]} 50%, ${THEMES[theme].swatch[1]} 50%)`,
                  }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <DropdownMenuItem key={k} onClick={() => setTheme(k)} className="gap-2">
                  <span
                    className="h-4 w-4 rounded-sm border border-border"
                    style={{
                      background: `linear-gradient(135deg, ${THEMES[k].swatch[0]} 50%, ${THEMES[k].swatch[1]} 50%)`,
                    }}
                  />
                  {THEMES[k].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" aria-label="Piece theme">
                <Crown className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.14em]">
                  {pieceTheme === "classic" ? "Classic" : pieceTheme === "symbols" ? "Symbols" : "Outline"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["classic", "symbols", "outline"] as PieceThemeKey[]).map((k) => (
                <DropdownMenuItem key={k} onClick={() => setPieceTheme(k)} className="gap-2">
                  <span className="font-mono text-base">
                    {k === "classic" ? "♞" : k === "symbols" ? "♘" : "♚"}
                  </span>
                  {k[0].toUpperCase() + k.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Users className="h-3.5 w-3.5" /> 2P
          <Switch
            checked={twoPlayer}
            onCheckedChange={(v) => {
              setTwoPlayer(v);
              setHint(null);
              clearSelection();
              toast(v ? "Two-player mode on" : "Playing vs engine", { duration: 1400 });
            }}
          />
        </label>
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
