// Lightweight WebAudio sound effects — no external assets.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  release?: number;
};

function blip({ freq, dur, type = "sine", gain = 0.18, attack = 0.005, release = 0.12 }: Tone, delay = 0) {
  const a = getCtx();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
  osc.connect(g);
  g.connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
}

export const sounds = {
  move() {
    blip({ freq: 320, dur: 0.06, type: "triangle", gain: 0.15 });
    blip({ freq: 480, dur: 0.05, type: "sine", gain: 0.08 }, 0.02);
  },
  capture() {
    blip({ freq: 180, dur: 0.08, type: "square", gain: 0.18 });
    blip({ freq: 110, dur: 0.12, type: "sawtooth", gain: 0.12 }, 0.03);
  },
  check() {
    blip({ freq: 880, dur: 0.09, type: "triangle", gain: 0.18 });
    blip({ freq: 660, dur: 0.12, type: "triangle", gain: 0.14 }, 0.09);
  },
  castle() {
    blip({ freq: 300, dur: 0.07, type: "triangle", gain: 0.14 });
    blip({ freq: 400, dur: 0.07, type: "triangle", gain: 0.14 }, 0.07);
  },
  end() {
    blip({ freq: 520, dur: 0.16, type: "sine", gain: 0.2 });
    blip({ freq: 392, dur: 0.18, type: "sine", gain: 0.2 }, 0.14);
    blip({ freq: 261, dur: 0.32, type: "sine", gain: 0.2 }, 0.3);
  },
  select() {
    blip({ freq: 600, dur: 0.03, type: "sine", gain: 0.07 });
  },
};

export function playForMove(flags: string, opts: { check: boolean; gameOver: boolean }) {
  if (opts.gameOver) return sounds.end();
  if (opts.check) return sounds.check();
  if (flags.includes("k") || flags.includes("q")) return sounds.castle();
  if (flags.includes("c") || flags.includes("e")) return sounds.capture();
  sounds.move();
}
