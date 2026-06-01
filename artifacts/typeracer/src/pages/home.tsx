import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetLeaderboard, getGetLeaderboardQueryKey, useGetMyStats, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  
  const { data: leaderboard } = useGetLeaderboard({ limit: 5, difficulty: "all" }, {
    query: { queryKey: getGetLeaderboardQueryKey({ limit: 5, difficulty: "all" }) }
  });

  const { data: stats } = useGetMyStats({
    query: { enabled: !!user, queryKey: getGetMyStatsQueryKey() }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-primary">TYPERACER</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The ultimate competitive typing experience. Race against the world.
        </p>
        <div className="pt-4">
          <Link href="/game">
            <Button size="lg" className="text-lg px-12 h-14 bg-primary text-primary-foreground hover:bg-primary/90">
              START RACE
            </Button>
          </Link>
        </div>
      </div>

      {user && stats && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl text-center">
            <div className="text-muted-foreground text-sm uppercase tracking-widest mb-2">TOTAL RACES</div>
            <div className="text-4xl font-bold font-mono text-primary">{stats.totalRaces}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl text-center">
            <div className="text-muted-foreground text-sm uppercase tracking-widest mb-2">BEST WPM</div>
            <div className="text-4xl font-bold font-mono">{stats.bestWpm || '-'}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl text-center">
            <div className="text-muted-foreground text-sm uppercase tracking-widest mb-2">AVG ACCURACY</div>
            <div className="text-4xl font-bold font-mono">{stats.avgAccuracy ? `${stats.avgAccuracy}%` : '-'}</div>
          </div>
        </div>
      )}

      <div className="w-full bg-card border border-border rounded-xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Racers</h2>
          <Link href="/leaderboard" className="text-primary hover:underline">View All</Link>
        </div>
        
        <div className="space-y-4">
          {leaderboard?.map((entry, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-muted-foreground w-8">{entry.rank}</span>
                <span className="font-bold text-lg">{entry.username}</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">WPM</div>
                  <div className="text-xl font-mono text-primary">{entry.wpm}</div>
                </div>
                <div className="text-right w-20">
                  <div className="text-sm text-muted-foreground">ACC</div>
                  <div className="text-xl font-mono">{entry.accuracy}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
