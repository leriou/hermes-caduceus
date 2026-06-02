import { copyToClipboard } from "@renderer/lib/hermes-tauri";
import { memo } from "react";
import { Plus, FolderOpen, X, Copy, Menu } from "lucide-react";
import { useI18n } from "../../components/useI18n";
import { baseSessionTitle } from "./sessionDisplay";
import type { UsageState } from "./types";

interface ChatHeaderProps {
  sessionId: string | null;
  sessionTitle?: string | null;
  sessionModel?: string | null;
  usage: UsageState | null;
  hasMessages: boolean;
  /** Working folder bound to this conversation (issue #27), or null. */
  contextFolder: string | null;
  /** Whether to show the context-folder control (hidden in remote/SSH mode,
   *  where the picker would browse the wrong machine's filesystem). */
  showContextFolder: boolean;
  onPickFolder: () => void;
  onClearFolder: () => void;
  onNewChat?: () => void;
  onToggleSessionDrawer?: () => void;
}

function UsageBadge({ usage }: { usage: UsageState }): React.JSX.Element {
  const parts = [
    `Prompt: ${usage.promptTokens.toLocaleString()}`,
    `Completion: ${usage.completionTokens.toLocaleString()}`,
  ];
  if (usage.calls) parts.push(`Calls: ${usage.calls}`);
  if (usage.reasoning)
    parts.push(`Reasoning: ${usage.reasoning.toLocaleString()}`);
  if (usage.cacheRead)
    parts.push(`Cache read: ${usage.cacheRead.toLocaleString()}`);
  if (usage.cacheWrite)
    parts.push(`Cache write: ${usage.cacheWrite.toLocaleString()}`);
  if (usage.contextUsed && usage.contextMax) {
    parts.push(
      `Context: ${usage.contextUsed.toLocaleString()} / ${usage.contextMax.toLocaleString()}`,
    );
  }
  if (usage.cost != null) parts.push(`Cost: $${usage.cost.toFixed(4)}`);
  const tooltip = parts.join(" | ");

  return (
    <span className="chat-token-counter" title={tooltip}>
      {usage.totalTokens.toLocaleString()} tokens
      {usage.cost != null && (
        <span className="chat-cost"> · ${usage.cost.toFixed(4)}</span>
      )}
      {usage.contextPercent != null && (
        <span className="chat-context">
          {" "}
          · {Math.round(usage.contextPercent)}%
        </span>
      )}
    </span>
  );
}

/** Last path segment, for the compact chip label (handles \ and /). */
function folderName(p: string): string {
  const parts = p.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || p;
}

export const ChatHeader = memo(function ChatHeader({
  sessionId,
  sessionTitle,
  sessionModel,
  usage,
  hasMessages,
  contextFolder,
  showContextFolder,
  onPickFolder,
  onClearFolder,
  onNewChat,
  onToggleSessionDrawer,
}: ChatHeaderProps): React.JSX.Element {
  const { t } = useI18n();
  const displayTitle = baseSessionTitle(sessionTitle);

  return (
    <div className="chat-header drag-surface" data-tauri-drag-region>
      <div className="chat-header-left">
        {onToggleSessionDrawer && (
          <button
            className="btn-ghost chat-session-drawer-btn"
            onClick={onToggleSessionDrawer}
            title={t("navigation.sessions") || "Sessions"}
          >
            <Menu size={16} />
          </button>
        )}
        <div className="chat-header-title">
          {displayTitle ||
            (sessionId
              ? t("chat.sessionTitle", { id: sessionId.slice(-6) })
              : "")}
          {sessionId && (
            <button
              className="btn-ghost chat-copy-id-btn"
              onClick={() => {
                void copyToClipboard(sessionId);
              }}
              title={sessionId}
            >
              <Copy size={12} />
            </button>
          )}
        </div>
        {sessionModel && (
          <span className="chat-session-model-badge">{sessionModel}</span>
        )}
        {usage && <UsageBadge usage={usage} />}
      </div>
      <div className="chat-header-actions">
        {showContextFolder &&
          (contextFolder ? (
            <div className="chat-ctxfolder">
              <button
                className="btn-ghost chat-ctxfolder-btn chat-ctxfolder-set"
                onClick={onPickFolder}
                title={t("chat.contextFolderActive", { path: contextFolder })}
              >
                <FolderOpen size={14} />
                <span className="chat-ctxfolder-name">
                  {folderName(contextFolder)}
                </span>
              </button>
              <button
                className="btn-ghost chat-ctxfolder-clear"
                onClick={onClearFolder}
                title={t("chat.removeContextFolder")}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost chat-ctxfolder-btn"
              onClick={onPickFolder}
              title={t("chat.setContextFolder")}
            >
              <FolderOpen size={14} />
            </button>
          ))}
        {onNewChat && (
          <button
            className="btn-ghost chat-clear-btn"
            onClick={onNewChat}
            title={t("chat.newChat")}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
});
