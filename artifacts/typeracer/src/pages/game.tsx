import { useEffect, useState } from "react";
import { useGetRandomGame, useCreateResult, getGetRandomGameQueryKey } from "@workspace/api-client-react";
import { useTyping } from "@/hooks/use-typing";
import { useTimer } from "@/hooks/use-timer";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Game() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: game, isLoading, refetch } = useGetRandomGame();
  const createResult = useCreateResult();
  
  const { elapsedMs, running, start, pause, reset: resetTimer } = useTimer();
  const { connected, sendMessage } = useSocket();
  const { typed, errors, isComplete, handleChange, reset: resetTyping, inputRef } = useTyping(game?.paragraph || "");

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [game, inputRef]);

  // Start timer on first keystroke
  useEffect(() => {
    if (typed.length === 1 && !running) {
      start();
      if (game && user) {
        sendMessage({ type: "START", gameId: game.id, userId: user.id });
      }
    }
  }, [typed.length, running, start, game, user, sendMessage]);

  // Update WPM and Accuracy
  useEffect(() => {
    if (typed.length > 0 && elapsedMs > 0) {
      const minutes = elapsedMs / 60000;
      const words = typed.length / 5;
      const currentWpm = Math.max(0, Math.round(words / minutes));
      
      const correctChars = typed.length - errors.size;
      const currentAccuracy = Math.max(0, Math.round((correctChars / typed.length) * 100));

      setWpm(currentWpm);
      setAccuracy(currentAccuracy);

      if (running) {
        sendMessage({ type: "WPM_UPDATE", wpm: currentWpm, accuracy: currentAccuracy });
      }
    }
  }, [typed, elapsedMs, errors.size, running, sendMessage]);

  // Handle completion
  useEffect(() => {
    if (isComplete && running && game) {
      pause();
      createResult.mutate({
        data: {
          gameId: game.id,
          wpm,
          accuracy,
          timeTakenMs: elapsedMs
        }
      }, {
        onSuccess: (res: any) => {
          setLocation(`/results/${res.id}`);
        }
      });
    }
  }, [isComplete, running, game, pause, createResult, wpm, accuracy, elapsedMs, setLocation]);

  const handleRestart = () => {
    resetTyping();
    resetTimer();
    setWpm(0);
    setAccuracy(100);
    refetch();
  };

  if (isLoading || !game) return <div className="p-8 text-center text-primary font-mono text-xl animate-pulse">CONNECTING...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 pt-16 flex flex-col gap-12">
      {/* HUD */}
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div className="flex gap-8">
          <div>
            <div className="text-muted-foreground text-sm uppercase tracking-widest mb-1">SPEED</div>
            <div className="text-5xl font-black text-primary font-mono">{wpm}<span className="text-2xl text-muted-foreground ml-1">WPM</span></div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm uppercase tracking-widest mb-1">ACCURACY</div>
            <div className="text-5xl font-black font-mono">{accuracy}<span className="text-2xl text-muted-foreground ml-1">%</span></div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground text-sm uppercase tracking-widest mb-1">TIME</div>
          <div className="text-3xl font-mono text-accent">{(elapsedMs / 1000).toFixed(1)}s</div>
        </div>
      </div>

      {/* Typing Area */}
      <div className="relative text-2xl md:text-3xl leading-relaxed font-mono tracking-tight cursor-text" onClick={() => inputRef.current?.focus()}>
        <input 
          ref={inputRef}
          type="text"
          value={typed}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-text"
          autoFocus
          disabled={isComplete}
        />
        <div className="pointer-events-none select-none">
          {game.paragraph.split("").map((char: string, index: number) => {
            let className = "text-muted-foreground/40"; // untyped
            if (index < typed.length) {
              if (errors.has(index)) {
                className = "bg-destructive text-destructive-foreground"; // error
              } else {
                className = "text-primary"; // correct
              }
            }
            
            // Cursor
            const isCursor = index === typed.length && !isComplete;
            
            return (
              <span key={index} className="relative">
                <span className={className}>{char}</span>
                {isCursor && (
                  <span className="absolute left-0 bottom-0 w-full h-[3px] bg-primary animate-caret-blink" />
                )}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={handleRestart} variant="outline" className="font-mono" disabled={createResult.isPending}>
          {createResult.isPending ? "SAVING..." : "RESTART (ESC)"}
        </Button>
      </div>
    </div>
  );
}
