import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";

export default function Leaderboard() {
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const { user } = useAuth();
  
  const { data: entries, isLoading } = useGetLeaderboard({ difficulty, limit: 50 }, {
    query: { queryKey: getGetLeaderboardQueryKey({ difficulty, limit: 50 }) }
  });

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-primary mb-2">GLOBAL LEADERBOARD</h1>
        <p className="text-muted-foreground">The fastest typists in the world.</p>
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
              <TableHead className="w-20 text-center font-bold">RANK</TableHead>
              <TableHead className="font-bold">PILOT</TableHead>
              <TableHead className="text-right font-bold">WPM</TableHead>
              <TableHead className="text-right font-bold">ACCURACY</TableHead>
              <TableHead className="text-right font-bold">MODE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">LOADING DATA...</TableCell>
              </TableRow>
            ) : entries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">NO RECORDS FOUND</TableCell>
              </TableRow>
            ) : (
              entries?.map((entry) => (
                <TableRow key={`${entry.username}-${entry.rank}`} className={user?.username === entry.username ? "bg-primary/10 border-l-2 border-primary" : ""}>
                  <TableCell className="text-center font-bold font-mono">
                    {entry.rank === 1 ? <span className="text-yellow-500">1</span> :
                     entry.rank === 2 ? <span className="text-gray-400">2</span> :
                     entry.rank === 3 ? <span className="text-amber-700">3</span> : entry.rank}
                  </TableCell>
                  <TableCell className="font-bold">{entry.username}</TableCell>
                  <TableCell className="text-right font-mono text-primary text-lg">{entry.wpm}</TableCell>
                  <TableCell className="text-right font-mono">{entry.accuracy}%</TableCell>
                  <TableCell className="text-right uppercase text-xs text-muted-foreground">{entry.difficulty}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
