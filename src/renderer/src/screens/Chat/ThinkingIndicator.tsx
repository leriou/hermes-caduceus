import { memo, useEffect, useRef } from "react";

interface ThinkingIndicatorProps {
  text: string;
}

const MAX_VISIBLE_LINES = 3;

export const ThinkingIndicator = memo(function ThinkingIndicator({
  text,
}: ThinkingIndicatorProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const visible = lines.length > MAX_VISIBLE_LINES
    ? lines.slice(-MAX_VISIBLE_LINES)
    : lines;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      if (timerRef.current) {
        const elapsed = Date.now() - startRef.current;
        timerRef.current.textContent = elapsed >= 1000
          ? `${Math.floor(elapsed / 1000)}s`
          : `${Math.floor(elapsed)}ms`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="chat-live-reasoning-footprint">
      <div className="chat-live-reasoning-left">
        <div className="chat-live-reasoning-dot" />
      </div>
      <div className="chat-live-reasoning-body">
        <span className="chat-live-reasoning-label">Thinking</span>
        <span className="chat-live-reasoning-duration" ref={timerRef} />
        {lines.length > MAX_VISIBLE_LINES && (
          <span className="chat-live-reasoning-duration">+{lines.length - MAX_VISIBLE_LINES}</span>
        )}
        <div className="chat-live-reasoning-scroll" ref={scrollRef}>
          {visible.length > 0 ? (
            visible.map((line, i) => (
              <div key={i} className="chat-live-reasoning-line">
                {line.length > 120 ? line.slice(0, 117) + "…" : line}
              </div>
            ))
          ) : (
            <div className="chat-live-reasoning-line">…</div>
          )}
        </div>
      </div>
    </div>
  );
});
