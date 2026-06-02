import { memo } from "react";
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
  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const lastLine = lines.length > 0 ? lines[lines.length - 1].trim() : "";
  const displayLine =
    lastLine.length > 80 ? lastLine.slice(0, 77) + "…" : lastLine;

  return (
    <div className="chat-message chat-message-agent">
      <HermesAvatar />
      <div className="chat-bubble chat-bubble-agent chat-live-reasoning-bubble">
        <span className="chat-live-reasoning-dot" />
        <span className="chat-live-reasoning-label">Thinking</span>
        {duration > 0 && (
          <span className="chat-live-reasoning-meta">
            {formatDuration(duration)}
          </span>
        )}
        {lines.length > 0 && (
          <span className="chat-live-reasoning-meta">{lines.length} lines</span>
        )}
        {displayLine && (
          <span className="chat-live-reasoning-snippet">{displayLine}</span>
        )}
      </div>
    </div>
  );
});
