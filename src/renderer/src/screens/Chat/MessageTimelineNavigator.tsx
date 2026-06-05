import React, { useState, useRef, useMemo } from "react";
import type { ChatBubbleMessage, ChatMessage } from "./types";

interface MessageTimelineNavigatorProps {
  messages: ChatMessage[];
  onScrollToMessage?: (messageId: string) => void;
}

export function MessageTimelineNavigator({
  messages,
  onScrollToMessage,
}: MessageTimelineNavigatorProps): React.JSX.Element | null {
  const [isHovered, setIsHovered] = useState(false);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const userMessages = useMemo(() => {
    return messages.filter(
      (m): m is ChatBubbleMessage & { role: "user" } =>
        m.role === "user" &&
        (!("kind" in m) || !m.kind || m.kind === "user") &&
        m.content.trim().length > 0
    );
  }, [messages]);

  if (userMessages.length < 2) return null;

  const collapsedHeight = 160;
  const expandedHeight = Math.min(600, 400);
  const activeHeight = isHovered ? expandedHeight : collapsedHeight;

  const sigma = 32;
  const amp = 24;

  const markers = userMessages.map((msg, idx) => {
    const percent = (idx + 0.5) / userMessages.length;
    const baseY = percent * activeHeight;
    let offsetY = 0;
    let scale = 1.0;
    let isClose = false;

    if (isHovered && mouseY !== null) {
      const d = baseY - mouseY;
      offsetY = amp * (d / sigma) * Math.exp(-(d * d) / (2 * sigma * sigma));
      scale = 1 + 1.2 * Math.exp(-(d * d) / (2 * 20 * 20));
      isClose = Math.abs(d) < 28;
    }

    let timeText = "";
    if ("timestamp" in msg && msg.timestamp) {
      timeText = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const rawContent = msg.content;
    const summaryText =
      rawContent.length > 25 ? rawContent.slice(0, 22) + "…" : rawContent;

    return {
      id: msg.id,
      timeText,
      summaryText,
      baseY,
      y: baseY + offsetY,
      scale,
      isClose,
    };
  });

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(false);
    setMouseY(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    setMouseY(e.clientY - rect.top);
  };

  return (
    <div
      className={`chat-timeline-navigator ${isHovered ? "chat-timeline-navigator--expanded" : ""}`}
      style={{ height: `${activeHeight}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={trackRef}
    >
      <div className="chat-timeline-line-rail" />
      {markers.map((marker, idx) => {
        const isBoundary = idx === 0 || idx === markers.length - 1;
        const visible = isHovered || isBoundary;

        return (
          <button
            key={marker.id}
            className={`chat-timeline-marker ${isBoundary ? "chat-timeline-marker--boundary" : ""} ${marker.isClose ? "chat-timeline-marker--close" : ""}`}
            style={{
              transform: `translateY(${marker.y}px) scale(${marker.scale})`,
              opacity: visible ? 1 : 0.25,
            }}
            onClick={() => onScrollToMessage?.(marker.id)}
            title={marker.summaryText}
            aria-label={`Go to user message at ${marker.timeText}`}
          >
            <span className="chat-timeline-marker-dot" />
            {isHovered && (
              <span className={`chat-timeline-tooltip ${marker.isClose ? "chat-timeline-tooltip--visible" : ""}`}>
                <span className="chat-timeline-tooltip-time">{marker.timeText}</span>
                <span className="chat-timeline-tooltip-text">{marker.summaryText}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
