import { memo, useEffect, useRef, useState } from "react";
import { HermesAvatar } from "./MessageRow";

interface ThinkingIndicatorProps {
  text: string;
  duration: number; // milliseconds
}

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${Math.floor(ms / 1000)}s` : `${Math.floor(ms)}ms`;
}

export const ThinkingIndicator = memo(function ThinkingIndicator({
  text,
  duration,
}: ThinkingIndicatorProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const detailRef = useRef<HTMLDivElement>(null);

  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const lineCount = lines.length;

  useEffect(() => {
    if (expanded && detailRef.current) {
      const el = detailRef.current;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [text, expanded]);

  return (
    <div className="chat-message chat-message-agent">
      <HermesAvatar />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          className="chat-bubble chat-bubble-agent chat-live-reasoning-bubble"
          onClick={() => setExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`Thinking ${formatDuration(duration)}${lineCount > 0 ? `, ${lineCount} lines` : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((prev) => !prev);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <span className="chat-live-reasoning-dot" />
          <span className="chat-live-reasoning-label">Thinking</span>
          <span className="chat-live-reasoning-meta">
            {formatDuration(duration)}
          </span>
          {lineCount > 0 && (
            <span className="chat-live-reasoning-meta">
              {lineCount} line{lineCount !== 1 ? "s" : ""}
            </span>
          )}
          <span
            className="chat-live-reasoning-meta"
            style={{ userSelect: "none" }}
          >
            {expanded ? "▾" : "▸"}
          </span>
        </div>

        {expanded && text && (
          <div
            ref={detailRef}
            className="chat-live-reasoning-detail"
            role="log"
            aria-live="polite"
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
});
