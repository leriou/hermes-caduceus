import { memo, useEffect, useRef, useState } from "react";
import { HermesAvatar } from "./MessageRow";

interface ThinkingIndicatorProps {
  text: string;
  duration: number;
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

  useEffect(() => {
    if (expanded && detailRef.current) {
      detailRef.current.scrollTop = detailRef.current.scrollHeight;
    }
  }, [text, expanded]);

  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const lineCount = lines.length;

  return (
    <div className="chat-message chat-message-agent">
      <HermesAvatar />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          className="chat-bubble chat-bubble-agent chat-live-reasoning-bubble"
          onClick={() => setExpanded((prev) => !prev)}
          style={{ cursor: "pointer" }}
        >
          <span className="chat-live-reasoning-dot" />
          <span className="chat-live-reasoning-label">Thinking</span>
          {duration > 0 && (
            <span className="chat-live-reasoning-meta">
              {formatDuration(duration)}
            </span>
          )}
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
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
});
