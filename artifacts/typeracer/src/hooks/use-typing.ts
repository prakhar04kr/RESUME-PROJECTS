import { useState, useCallback, useRef, useEffect } from "react";

export function useTyping(paragraph: string) {
  const [typed, setTyped] = useState("");
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const isComplete = typed.length === paragraph.length && !errors.has(paragraph.length - 1);

  const reset = useCallback(() => {
    setTyped("");
    setErrors(new Set());
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isComplete) return;
      const val = e.target.value;
      
      // Allow only typing forward or backspacing
      if (Math.abs(val.length - typed.length) > 1 && typed.length > 0) return;

      const newTyped = val.substring(0, paragraph.length);
      const newErrors = new Set<number>(errors);

      // Check current char
      const currentIndex = newTyped.length - 1;
      if (currentIndex >= 0) {
        if (newTyped[currentIndex] !== paragraph[currentIndex]) {
          newErrors.add(currentIndex);
        } else {
          newErrors.delete(currentIndex);
        }
      }
      
      // Clean up errors ahead if user backspaced
      for (let i = newTyped.length; i < paragraph.length; i++) {
        newErrors.delete(i);
      }

      setTyped(newTyped);
      setErrors(newErrors);
    },
    [isComplete, paragraph, typed.length, errors]
  );

  return { typed, errors, isComplete, handleChange, reset, inputRef };
}
