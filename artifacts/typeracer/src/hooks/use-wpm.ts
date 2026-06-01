import { useState, useEffect } from "react";

export function useWpm(typed: string, startTime: number | null) {
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      const elapsedMinutes = elapsedMs / 60000;

      if (elapsedMinutes > 0) {
        const words = typed.length / 5;
        setWpm(Math.max(0, Math.round(words / elapsedMinutes)));
      }

      // We need error counts here... Assuming accuracy is passed in or calculated differently.
      // This is a simplified WPM calculation.
    }, 500);

    return () => clearInterval(interval);
  }, [typed, startTime]);

  return { wpm, accuracy };
}
