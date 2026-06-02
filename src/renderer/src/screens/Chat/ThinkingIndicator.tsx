import { memo } from "react";

interface ThinkingIndicatorProps {
  text: string;
  duration: number;
}

export const ThinkingIndicator = memo(function ThinkingIndicator({
  text,
}: ThinkingIndicatorProps): React.JSX.Element {
  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const lastLine = lines.length > 0 ? lines[lines.length - 1].trim() : "";
  const displayLine =
    lastLine.length > 80 ? lastLine.slice(0, 77) + "…" : lastLine;

  return (
    <div className="chat-live-reasoning-footprint">
      <div className="chat-live-reasoning-left">
        <div className="chat-live-reasoning-dot" />
      </div>
      <div className="chat-live-reasoning-body">
        <span className="chat-live-reasoning-label">Thinking</span>
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
