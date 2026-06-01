import { useGetResult, getGetResultQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: result, isLoading } = useGetResult(id, {
    query: { enabled: !!id, queryKey: getGetResultQueryKey(id) }
  });

  if (isLoading) return <div className="p-8 text-center text-primary font-mono text-xl animate-pulse">ANALYZING RACE DATA...</div>;
  if (!result) return <div className="p-8 text-center text-destructive font-mono">RECORD NOT FOUND</div>;

  const isNewPb = result.personalBestWpm ? result.wpm > result.personalBestWpm : true;

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter text-primary">RACE COMPLETED</h1>
        <p className="text-muted-foreground uppercase tracking-widest text-sm">Target: {result.difficulty} mode</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-primary/20 flex flex-col items-center justify-center p-6 shadow-xl shadow-primary/5">
          <div className="text-muted-foreground text-sm uppercase tracking-widest mb-2">SPEED</div>
          <div className="text-6xl font-black text-primary font-mono">{result.wpm}</div>
          <div className="text-muted-foreground mt-1">WPM</div>
          {isNewPb && <div className="mt-4 text-xs bg-primary/20 text-primary px-2 py-1 rounded">NEW PERSONAL BEST!</div>}
        </Card>
        
        <Card className="bg-card/50 border-border flex flex-col items-center justify-center p-6">
          <div className="text-muted-foreground text-sm uppercase tracking-widest mb-2">ACCURACY</div>
          <div className={`text-5xl font-black font-mono ${result.accuracy >= 98 ? 'text-primary' : result.accuracy >= 90 ? 'text-accent' : 'text-destructive'}`}>
            {result.accuracy}%
          </div>
        </Card>
        
        <Card className="bg-card/50 border-border flex flex-col items-center justify-center p-6">
          <div className="text-muted-foreground text-sm uppercase tracking-widest mb-2">TIME TAKEN</div>
          <div className="text-4xl font-black font-mono">{(result.timeTakenMs / 1000).toFixed(1)}s</div>
        </Card>
      </div>

      <Card className="bg-muted/30 border-border">
        <CardHeader>
          <CardTitle className="text-lg">Race Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-muted-foreground leading-relaxed p-4 bg-background/50 rounded border border-border/50">
            {result.paragraph}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-6 pt-8">
        <Link href="/game">
          <Button size="lg" className="h-14 px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
            RACE AGAIN
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button size="lg" variant="outline" className="h-14 px-8 font-bold">
            VIEW LEADERBOARD
          </Button>
        </Link>
      </div>
    </div>
  );
}
