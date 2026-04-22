import { useEffect, useRef } from "react";

export function useDebouncedCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delayMs: number
) {
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (...args: T) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => callback(...args), delayMs);
  };
}
