import { useState, useRef, useCallback } from "react";

export function useTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!running) {
      startTimeRef.current = Date.now() - elapsedMs;
      setRunning(true);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 100);
    }
  }, [running, elapsedMs]);

  const pause = useCallback(() => {
    if (running) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [running]);

  const reset = useCallback(() => {
    setRunning(false);
    setElapsedMs(0);
    startTimeRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { elapsedMs, running, start, pause, reset, startTimeRef };
}
