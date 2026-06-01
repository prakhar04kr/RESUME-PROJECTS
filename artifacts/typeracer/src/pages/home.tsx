import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetLeaderboard, getGetLeaderboardQueryKey, useGetMyStats, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Home() {
  const { user } = useAuth();

  const { data: leaderboard } = useGetLeaderboard({ limit: 5, difficulty: "all" }, {
    query: { queryKey: getGetLeaderboardQueryKey({ limit: 5, difficulty: "all" }) }
  });

  const { data: stats } = useGetMyStats({
    query: { enabled: !!user, queryKey: getGetMyStatsQueryKey() }
  });

  const bestWpm = stats?.bestWpm ?? null;
  const avgWpm = stats?.avgWpm != null ? Math.round(Number(stats.avgWpm)) : null;
  const avgAccuracy = stats?.avgAccuracy != null ? Math.round(Number(stats.avgAccuracy) * 10) / 10 : null;

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] p-8 max-w-4xl mx-auto space-y-12 pt-20">

      {/* Hero */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-primary">TYPERACER</h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          The ultimate competitive typing experience. Race against the world.
        </p>
        <div className="pt-2">
          <Link href="/game">
            <Button size="lg" className="text-lg px-14 h-14 font-black tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
              START RACE
            </Button>
          </Link>
        </div>
      </div>

      {/* Personal Stats Card — only when logged in with results */}
      {user && stats && (stats.totalRaces > 0) && (
        <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Pilot</span>
              <h2 className="text-lg font-black tracking-tight">{user.username}</h2>
            </div>
            <Link href="/history" className="text-xs text-primary hover:underline font-bold uppercase tracking-wider">
              Full History →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            <StatBox label="TOTAL RACES" value={String(stats.totalRaces)} />
            <StatBox label="BEST WPM" value={bestWpm != null ? String(bestWpm) : "—"} highlight />
            <StatBox label="AVG WPM" value={avgWpm != null ? String(avgWpm) : "—"} />
            <StatBox label="AVG ACCURACY" value={avgAccuracy != null ? `${avgAccuracy}%` : "—"} />
          </div>
        </div>
      )}

      {/* Welcome prompt when logged in but no races yet */}
      {user && stats && stats.totalRaces === 0 && (
        <div className="w-full bg-card border border-border rounded-xl p-8 text-center space-y-3">
          <div className="text-3xl">🏁</div>
          <p className="text-muted-foreground">You haven't raced yet. Hit <strong className="text-foreground">Start Race</strong> to set your first record.</p>
        </div>
      )}

      {/* Top Racers */}
      <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight">Top Racers</h2>
          <Link href="/leaderboard" className="text-xs text-primary hover:underline font-bold uppercase tracking-wider">
            View All →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {!leaderboard?.length ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No races yet — be the first!</div>
          ) : leaderboard.map((entry, i) => (
            <div key={i} className={`flex items-center justify-between px-6 py-4 ${user?.username === entry.username ? "bg-primary/5" : "hover:bg-muted/30"} transition-colors`}>
              <div className="flex items-center gap-4">
                <span className="w-8 text-xl text-center">{MEDAL[entry.rank] ?? <span className="font-mono text-muted-foreground text-sm">{entry.rank}</span>}</span>
                <div>
                  <span className="font-bold">{entry.username}</span>
                  {user?.username === entry.username && <span className="ml-2 text-xs text-primary/60">you</span>}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">WPM</div>
                  <div className="font-mono font-bold text-primary text-xl">{entry.wpm}</div>
                </div>
                <div className="text-right w-16">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">ACC</div>
                  <div className="font-mono font-bold">{entry.accuracy}%</div>
                </div>
                <div className="text-right hidden md:block">
                  <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-sm ${
                    entry.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                    entry.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {entry.difficulty}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center gap-1">
      <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className={`text-4xl font-black font-mono ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
