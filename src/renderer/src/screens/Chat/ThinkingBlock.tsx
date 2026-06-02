import { memo, useState } from "react";
import { HermesAvatar } from "./MessageRow";

interface ThinkingBlockProps {
  text: string;
  duration: number; // milliseconds
}

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${Math.floor(ms / 1000)}s` : `${Math.floor(ms)}ms`;
}

export const ThinkingBlock = memo(function ThinkingBlock({
  text,
  duration,
}: ThinkingBlockProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const lineCount = lines.length;

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
          aria-label={`Reasoned for ${formatDuration(duration)}${lineCount > 0 ? `, ${lineCount} lines` : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((prev) => !prev);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <span
            className="chat-live-reasoning-dot"
            style={{ opacity: 0.5 }}
          />
          <span className="chat-live-reasoning-label">
            Reasoned for {formatDuration(duration)}
          </span>
          {lineCount > 0 && (
            <span className="chat-live-reasoning-meta">
              · {lineCount} line{lineCount !== 1 ? "s" : ""}
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
          <div className="chat-live-reasoning-detail" role="log">
            {text}
          </div>
        )}
      </div>
    </div>
  );
});
