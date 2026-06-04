import { createFileRoute } from "@tanstack/react-router";
import ChessGame from "@/components/ChessGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Play Chess · In-browser engine" },
      {
        name: "description",
        content: "Play chess in your browser against a fast local engine. Just you and the board.",
      },
    ],
  }),
  component: Index,
});

const FACTS: { title: string; body: string }[] = [
  {
    title: "Born in 6th-century India",
    body: "Chess descends from chaturanga, a four-player war game played in Gupta-era India around 600 CE. It traveled to Persia as shatranj, where the cry shāh māt — “the king is helpless” — became today’s checkmate.",
  },
  {
    title: "The longest legal game",
    body: "Under the 50-move and threefold-repetition rules, the theoretical maximum length of a chess game is 5,898 moves. The longest tournament game ever played lasted 269 moves — Nikolić vs Arsović, Belgrade 1989 — and ended in a draw.",
  },
  {
    title: "More positions than atoms in the visible universe",
    body: "The Shannon number estimates the game-tree complexity of chess at roughly 10¹²⁰ — vastly more than the ~10⁸⁰ atoms estimated in the observable universe. That is why brute-force search alone cannot solve chess.",
  },
  {
    title: "The first move advantage",
    body: "Across millions of master games, White scores about 54–56%. The pull of the first move is small but real, and it shapes opening theory at the very top level.",
  },
  {
    title: "Deep Blue, 1997",
    body: "IBM’s Deep Blue beat reigning world champion Garry Kasparov 3½–2½ in a six-game match — the first time a computer defeated a world champion under standard time controls. Modern engines now eclipse Deep Blue by hundreds of Elo.",
  },
  {
    title: "The fastest checkmate",
    body: "Fool’s Mate ends the game in two moves: 1.f3 e5 2.g4 Qh4#. It only works if White cooperates — but it shows how quickly a king without defenders can fall.",
  },
  {
    title: "Castling is the only two-piece move",
    body: "Castling is the single move in chess where two of your own pieces move at once. It also encodes a hidden cost: once you forfeit the right, you cannot get it back.",
  },
  {
    title: "Zugzwang — the duty to move",
    body: "From German for “compulsion to move,” zugzwang describes a position where any move worsens your stance. Endgames are full of it; engines hunt for it like a scent.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ChessGame />

        <section className="mt-16">
          <h2 className="font-display text-2xl tracking-tight text-foreground">
            A short history of the game
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Eight things worth knowing while you wait for the engine to think.
          </p>

          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {FACTS.map((f, i) => (
              <li
                key={f.title}
                className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-elegant animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-base text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
