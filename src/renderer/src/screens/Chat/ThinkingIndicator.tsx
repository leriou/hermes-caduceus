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

  // Auto-scroll to bottom on text update
  useEffect(() => {
    if (expanded && detailRef.current) {
      detailRef.current.scrollTop = detailRef.current.scrollHeight;
    }
  }, [text, expanded]);

  return (
    <div className="chat-message chat-message-agent">
      <HermesAvatar />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Pill row */}
        <div
          className="chat-bubble chat-bubble-agent chat-live-reasoning-bubble"
          onClick={() => setExpanded((prev) => !prev)}
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

        {/* Detail panel */}
        {expanded && text && (
          <div
            ref={detailRef}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 12,
              background: "rgba(128, 90, 213, 0.08)",
              maxHeight: 200,
              overflowY: "auto",
              padding: "6px 10px",
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              maxWidth: 600,
            }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
});
