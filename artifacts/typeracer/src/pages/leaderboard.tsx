import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Leaderboard() {
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const { user } = useAuth();

  const { data: entries, isLoading } = useGetLeaderboard({ difficulty, limit: 100 }, {
    query: { queryKey: getGetLeaderboardQueryKey({ difficulty, limit: 100 }) }
  });

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-primary mb-2">GLOBAL LEADERBOARD</h1>
        <p className="text-muted-foreground">All-time race history, ranked by speed.</p>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => setDifficulty(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-border">
          <TabsTrigger value="all">ALL</TabsTrigger>
          <TabsTrigger value="easy">EASY</TabsTrigger>
          <TabsTrigger value="medium">MEDIUM</TabsTrigger>
          <TabsTrigger value="hard">HARD</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-16 text-center font-bold">#</TableHead>
              <TableHead className="font-bold">PILOT</TableHead>
              <TableHead className="text-right font-bold">WPM</TableHead>
              <TableHead className="text-right font-bold">ACC</TableHead>
              <TableHead className="text-right font-bold">MODE</TableHead>
              <TableHead className="text-right font-bold">DATE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">LOADING DATA...</TableCell>
              </TableRow>
            ) : !entries?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="space-y-2">
                    <div className="text-2xl">🏁</div>
                    <div>No races yet. Be the first!</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry: any, idx: number) => (
                <TableRow
                  key={`${entry.username}-${idx}`}
                  className={user?.username === entry.username ? "bg-primary/10 border-l-2 border-l-primary" : ""}
                >
                  <TableCell className="text-center font-bold font-mono">
                    {MEDAL[entry.rank] ?? <span className="text-muted-foreground">{entry.rank}</span>}
                  </TableCell>
                  <TableCell className="font-bold">
                    {entry.username}
                    {user?.username === entry.username && (
                      <span className="ml-2 text-xs text-primary/60 font-normal">you</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary font-bold text-lg">
                    {entry.wpm}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={entry.accuracy >= 98 ? "text-green-500" : entry.accuracy >= 90 ? "text-yellow-500" : "text-red-500"}>
                      {entry.accuracy}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-sm ${
                      entry.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                      entry.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {entry.difficulty}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDate(entry.racedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {entries && entries.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {entries.length} race{entries.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
