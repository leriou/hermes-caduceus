import { useCallback, useRef } from "react";

interface ThinkingThrottleOptions {
  onFlush: (text: string) => void;
  charThreshold?: number;
  timeThreshold?: number;
}

export function useThinkingThrottle({
  onFlush,
  charThreshold = 100,
  timeThreshold = 1000,
}: ThinkingThrottleOptions) {
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const text = bufferRef.current;
    bufferRef.current = "";
    if (text) onFlushRef.current(text);
  }, []);

  const push = useCallback(
    (chunk: string) => {
      bufferRef.current += chunk;
      if (bufferRef.current.length >= charThreshold) {
        flush();
        return;
      }
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, timeThreshold);
      }
    },
    [charThreshold, timeThreshold, flush],
  );

  const forceFlush = useCallback(() => {
    flush();
  }, [flush]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    bufferRef.current = "";
  }, []);

  return { push, forceFlush, reset };
}
