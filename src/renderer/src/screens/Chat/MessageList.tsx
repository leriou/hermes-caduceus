import { memo, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { HermesAvatar, MessageRow } from "./MessageRow";
import { ToolResultRow } from "./HistoryRow";
import { SubagentRow } from "./SubagentRow";
import { ToolGroupRow, getFriendlyToolDescription } from "./ToolGroupRow";
import { StreamingMarkdown } from "../../components/StreamingMarkdown";
import { AgentMarkdown } from "../../components/AgentMarkdown";
import { buildRenderableTranscript, stripHceCompaction } from "./renderTranscript";
import { TodoPanel } from "../../components/common/TodoPanel";
import { ChatEventRow } from "./ChatEventRow";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ThinkingBlock } from "./ThinkingBlock";
import type {
  ChatMessage,
  ReasoningMessage,
  SystemEventMessage,
  SystemStatusMessage,
  ToolGroupMessage,
  TodoMessage,
  ToolCallMessage,
  TodoItem,
} from "./types";
import type { RenderTranscriptItem } from "./renderTranscript";

export interface MessageListHandle {
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
  adjustForPrependedItems: (opts: { prepended: number }) => void;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  toolProgress: string | null;
  streamingText?: string;
  streamingReasoning?: string;
  thinkingDuration?: number;
  todos?: TodoItem[];
  onLoadEarlier?: () => void;
  onPrepended?: (count: number) => void;
  atBottomStateChange?: (atBottom: boolean) => void;
}

function getActiveToolCall(messages: ChatMessage[]): ToolCallMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.kind === "tool_group") {
      const runningCall = msg.calls.find((c) => c.result === undefined && c.success === undefined);
      if (runningCall) return runningCall;
    }
  }
  return null;
}

function ToolProgressIndicator({
  toolProgress,
  messages,
}: {
  toolProgress: string | null;
  messages: ChatMessage[];
}): React.JSX.Element | null {
  const activeCall = useMemo(() => getActiveToolCall(messages), [messages]);

  if (toolProgress) {
    const draftMatch = toolProgress.match(/^drafting\s+(.+?)(?:…)?$/);
    if (draftMatch) {
      const fileName = draftMatch[1];
      const displayPath = fileName.length > 50 ? "…" + fileName.slice(-47) : fileName;
      return (
        <div className="chat-message chat-message-agent">
          <HermesAvatar />
          <div className="chat-bubble chat-bubble-agent">
            <div className="chat-tool-progress-drafting">
              <span className="chat-tool-progress-icon-write">✍️</span>
              <span className="chat-tool-progress-text-shimmer">Drafting</span>
              <code className="chat-tool-progress-file-badge" title={fileName}>
                {displayPath}
              </code>
            </div>
          </div>
        </div>
      );
    }

    if (
      toolProgress === "analyzing tool output…" ||
      toolProgress.startsWith("analyzing")
    ) {
      return (
        <div className="chat-message chat-message-agent">
          <HermesAvatar />
          <div className="chat-bubble chat-bubble-agent">
            <div className="chat-tool-progress-analyzing">
              <div className="chat-tool-progress-spinner-dual" />
              <span className="chat-tool-progress-text-pulse">
                Analyzing tool output…
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="chat-message chat-message-agent">
        <HermesAvatar />
        <div className="chat-bubble chat-bubble-agent">
          <div className="chat-tool-progress">{toolProgress}</div>
        </div>
      </div>
    );
  }

  if (activeCall) {
    const desc = getFriendlyToolDescription(activeCall.name || "tool", activeCall.args || "");
    return (
      <div className="chat-message chat-message-agent">
        <HermesAvatar />
        <div className="chat-bubble chat-bubble-agent">
          <div className="chat-tool-progress-active">
            <div className="chat-tool-progress-spinner-dual" />
            <span className="chat-tool-progress-icon">{desc.icon}</span>
            <span className="chat-tool-progress-action-label">{desc.action}</span>
            {desc.kind === "code" || desc.kind === "path" ? (
              <code className={desc.kind === "code" ? "chat-tool-progress-code-badge" : "chat-tool-progress-file-badge"}>
                {desc.detail}
              </code>
            ) : (
              <span className="chat-tool-progress-detail-text">{desc.detail}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function SystemStatusRow({
  msg,
}: {
  msg: SystemStatusMessage;
}): React.JSX.Element {
  const isMultiLine = msg.content && msg.content.includes("\n");

  if (isMultiLine) {
    return (
      <div
        className={`chat-system-status-block chat-system-status-block-${msg.tone}`}
      >
        <div className="chat-system-status-block-header">
          <span className="chat-system-status-block-icon">
            {msg.tone === "success"
              ? "✓"
              : msg.tone === "warning"
                ? "⚠"
                : msg.tone === "error"
                  ? "✗"
                  : "ℹ"}
          </span>
          <span className="chat-system-status-block-title">{msg.title}</span>
        </div>
        <div className="chat-system-status-block-content">
          <AgentMarkdown>{msg.content!}</AgentMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-system-status chat-system-status-${msg.tone}`}>
      <span className="chat-system-status-title">{msg.title}</span>
      {msg.content && (
        <span className="chat-system-status-content">{msg.content}</span>
      )}
    </div>
  );
}

function SystemEventRow({ msg }: { msg: SystemEventMessage }): React.JSX.Element {
  return <ChatEventRow msg={msg} />;
}

function renderMessage(
  msg: RenderTranscriptItem,
  index: number,
  totalCount: number,
  isLoading: boolean,
): React.JSX.Element {
  const k = (msg as { kind?: string }).kind;
  if (k === "tool_group") {
    return <ToolGroupRow msg={msg as ToolGroupMessage} />;
  }
  if (k === "subagent") {
    return (
      <SubagentRow
        msg={msg as Extract<ChatMessage, { kind: "subagent" }>}
      />
    );
  }
  if (k === "tool_result") {
    return (
      <ToolResultRow
        msg={msg as Extract<ChatMessage, { kind: "tool_result" }>}
      />
    );
  }
  if (k === "system_status") {
    return <SystemStatusRow msg={msg as SystemStatusMessage} />;
  }
  if (k === "system_event") {
    return <SystemEventRow msg={msg as SystemEventMessage} />;
  }
  if (k === "todo") {
    const todoMsg = msg as TodoMessage;
    return <TodoPanel todos={todoMsg.todos} defaultCollapsed={true} />;
  }
  if (k === "tool_progress") {
    const progressMsg = msg as Extract<
      RenderTranscriptItem,
      { kind: "tool_progress" }
    >;
    return <div className="chat-tool-progress-inline">{progressMsg.content}</div>;
  }
  if (k === "reasoning") {
    const rMsg = msg as ReasoningMessage;
    return <ThinkingBlock text={rMsg.text} duration={rMsg.duration ?? 0} />;
  }
  const bubble = msg as Extract<ChatMessage, { role: "user" | "agent" }>;
  return (
    <MessageRow
      msg={bubble}
      isLast={index === totalCount - 1}
      isLoading={isLoading}
    />
  );
}

export const MessageList = memo(
  forwardRef<MessageListHandle, MessageListProps>(function MessageList({
    messages,
    isLoading,
    toolProgress,
    streamingText = "",
    streamingReasoning = "",
    thinkingDuration = 0,
    todos = [],
    onLoadEarlier,
    atBottomStateChange,
  }, ref) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const visibleMessages = useMemo(
    () =>
      buildRenderableTranscript({
        messages,
        isLoading,
        toolProgress,
        streamingText: "",
        streamingReasoning: "",
        todos: [],
      }),
    [messages, isLoading, toolProgress],
  );

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => virtuosoRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" }),
    scrollToMessage: (messageId: string) => {
      const idx = visibleMessages.findIndex(m => m.id === messageId);
      if (idx >= 0) {
        virtuosoRef.current?.scrollToIndex({ index: idx, behavior: "smooth", align: "start" });
      }
    },
    adjustForPrependedItems: (opts) => (virtuosoRef.current as any)?.adjustForPrependedItems(opts),
  }), [visibleMessages]);

  const StreamingFooter = useMemo(() => {
    if (!isLoading) return null;
    return (
      <div className="chat-messages-inner">
        {!streamingText && !toolProgress && (
          <ThinkingIndicator text={streamingReasoning} duration={thinkingDuration} />
        )}
        {!streamingText && toolProgress && (
          <ToolProgressIndicator toolProgress={toolProgress} messages={messages} />
        )}
        {todos.length > 0 && (
          <TodoPanel todos={todos} defaultCollapsed />
        )}
        {streamingText && !streamingText.startsWith("[HCE COMPACTION") && (
          <div className="chat-message chat-message-agent">
            <HermesAvatar />
            <div className="chat-bubble chat-bubble-agent">
              <StreamingMarkdown>{stripHceCompaction(streamingText) || streamingText}</StreamingMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  }, [isLoading, streamingText, streamingReasoning, thinkingDuration, toolProgress, messages, todos]);

  const streamingFooterRef = useRef<React.JSX.Element | null>(null);
  streamingFooterRef.current = StreamingFooter;

  const virtuosoComponents = useMemo(() => ({
    Footer: () => <>{streamingFooterRef.current}</>,
    List: forwardRef(function VirtuosoList(
      { style, children, ...props }: any,
      ref: any,
    ) {
      return (
        <div
          ref={ref}
          {...props}
          style={style}
          className="chat-messages-inner"
        >
          {children}
        </div>
      );
    }),
  }), []);

  return (
    <Virtuoso<RenderTranscriptItem>
      ref={virtuosoRef}
      data={visibleMessages}
      followOutput="smooth"
      increaseViewportBy={{ top: 200, bottom: 200 }}
      startReached={onLoadEarlier}
      atBottomStateChange={atBottomStateChange}
      computeItemKey={(_index, msg) => msg.id}
      itemContent={(index, msg) =>
        renderMessage(msg, index, visibleMessages.length, isLoading)
      }
      components={virtuosoComponents}
    />
  );
  })
);

