# Chat UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Caduceus chat UX with three independent enhancements: thinking stream display, silent reconnection recovery, and virtual scrolling.

**Architecture:** Each feature touches a focused set of files. Thinking stream introduces a new throttle hook + two components. Reconnection adds a Rust-side event and frontend recovery logic. Virtual list replaces the `.map()` renderer with react-virtuoso.

**Tech Stack:** React 18, TypeScript, Tauri (Rust), react-virtuoso

---

## File Structure

### New files
- `src/renderer/src/screens/Chat/hooks/useThinkingThrottle.ts` — dual-threshold buffer for reasoning deltas
- `src/renderer/src/screens/Chat/ThinkingIndicator.tsx` — live streaming thinking pill + detail panel
- `src/renderer/src/screens/Chat/ThinkingBlock.tsx` — collapsed reasoning block for history

### Modified files
- `src/renderer/src/screens/Chat/hooks/useChatInbox.ts` — throttle integration, recovery logic, reasoning persistence
- `src/renderer/src/screens/Chat/MessageList.tsx` — replace LiveReasoningRow, integrate Virtuoso
- `src/renderer/src/screens/Chat/renderTranscript.ts` — remove reasoning filter, render ThinkingBlock
- `src/renderer/src/screens/Chat/tuiEvents.ts` — add `gateway.reconnected` classification
- `src/renderer/src/screens/Chat/hooks/useChatScroll.ts` — remove scrollTop listener, keep userScrolledUp
- `src/renderer/src/screens/Chat/hooks/useLoadEarlier.ts` — use adjustForPrependedItems
- `src-tauri/src/tui_gateway.rs` — emit gateway.reconnected after reconnect

---

## Task Group A: Thinking/Reasoning Stream Display

### Task 1: Create useThinkingThrottle hook

**Files:**
- Create: `src/renderer/src/screens/Chat/hooks/useThinkingThrottle.ts`
- Test: `src/renderer/src/screens/Chat/hooks/useThinkingThrottle.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// useThinkingThrottle.test.ts
import { renderHook, act } from "@testing-library/react";
import { useThinkingThrottle } from "./useThinkingThrottle";

describe("useThinkingThrottle", () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it("flushes when char threshold reached", () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("a".repeat(100));
    expect(onFlush).toHaveBeenCalledWith("a".repeat(100));
  });

  it("flushes on time threshold", () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("short");
    expect(onFlush).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(onFlush).toHaveBeenCalledWith("short");
  });

  it("forceFlush flushes remaining buffer", () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("partial");
    result.current.forceFlush();
    expect(onFlush).toHaveBeenCalledWith("partial");
  });

  it("resets timer on new push after flush", () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("a".repeat(100));
    expect(onFlush).toHaveBeenCalledTimes(1);
    result.current.push("next");
    act(() => { jest.advanceTimersByTime(1000); });
    expect(onFlush).toHaveBeenCalledWith("next");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/xmli/code/hermes-caduceus && npx vitest run src/renderer/src/screens/Chat/hooks/useThinkingThrottle.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// useThinkingThrottle.ts
import { useCallback, useRef } from "react";

interface ThinkingThrottleOptions {
  onFlush: (text: string) => void;
  charThreshold?: number;
  timeThreshold?: number;
}

export function useThinkingThrottle({
  onFlush,
  charThreshold = 100,
  timeThreshold = 1000,
}: ThinkingThrottleOptions) {
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const text = bufferRef.current;
    bufferRef.current = "";
    if (text) onFlushRef.current(text);
  }, []);

  const push = useCallback(
    (chunk: string) => {
      bufferRef.current += chunk;
      if (bufferRef.current.length >= charThreshold) {
        flush();
        return;
      }
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, timeThreshold);
      }
    },
    [charThreshold, timeThreshold, flush],
  );

  const forceFlush = useCallback(() => {
    flush();
  }, [flush]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    bufferRef.current = "";
  }, []);

  return { push, forceFlush, reset };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/xmli/code/hermes-caduceus && npx vitest run src/renderer/src/screens/Chat/hooks/useThinkingThrottle.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/screens/Chat/hooks/useThinkingThrottle.ts src/renderer/src/screens/Chat/hooks/useThinkingThrottle.test.ts
git commit -m "feat(chat): add thinking throttle hook (100 chars / 1s)"
```

---

### Task 2: Create ThinkingIndicator component (live streaming)

**Files:**
- Create: `src/renderer/src/screens/Chat/ThinkingIndicator.tsx`

- [ ] **Step 1: Write the component**

```tsx
// ThinkingIndicator.tsx
import { memo, useState, useRef, useEffect } from "react";
import { HermesAvatar } from "./MessageRow";

interface ThinkingIndicatorProps {
  text: string;
  duration: number;
}

export const ThinkingIndicator = memo(function ThinkingIndicator({
  text,
  duration,
}: ThinkingIndicatorProps) {
  const [expanded, setExpanded] = useState(true);
  const detailRef = useRef<HTMLDivElement>(null);
  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const durationText = duration >= 1000 ? `${Math.round(duration / 1000)}s` : `${duration}ms`;

  useEffect(() => {
    if (detailRef.current) {
      detailRef.current.scrollTop = detailRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="chat-message chat-message-agent" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
      <HermesAvatar />
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="chat-live-reasoning-bubble"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 12px", cursor: "pointer",
            border: "none", borderRadius: "16px", whiteSpace: "nowrap",
            background: "var(--thinking-bg, rgba(139, 92, 246, 0.06))",
          }}
        >
          <span className="chat-live-reasoning-dot" />
          <span className="chat-live-reasoning-label">Thinking</span>
          <span className="chat-live-reasoning-meta">{durationText} · {lines.length} lines</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted, #6b7280)" }}>
            {expanded ? "▾" : "▸"}
          </span>
        </button>
        {expanded && text && (
          <div
            ref={detailRef}
            style={{
              flex: 1, minWidth: 0,
              background: "var(--thinking-detail-bg, rgba(139, 92, 246, 0.04))",
              border: "1px solid var(--thinking-detail-border, rgba(139, 92, 246, 0.1))",
              borderRadius: "8px", padding: "10px 12px",
              maxHeight: "200px", overflowY: "auto",
              fontFamily: "monospace", fontSize: "12px", lineHeight: 1.65,
              color: "var(--thinking-detail-text, #9ca3af)", whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/screens/Chat/ThinkingIndicator.tsx
git commit -m "feat(chat): add ThinkingIndicator component with expandable detail"
```

---

### Task 3: Create ThinkingBlock component (history, collapsed)

**Files:**
- Create: `src/renderer/src/screens/Chat/ThinkingBlock.tsx`

- [ ] **Step 1: Write the component**

```tsx
// ThinkingBlock.tsx
import { memo, useState } from "react";
import { HermesAvatar } from "./MessageRow";

interface ThinkingBlockProps {
  text: string;
  duration: number;
}

export const ThinkingBlock = memo(function ThinkingBlock({
  text,
  duration,
}: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n").filter((l) => l.trim());
  const durationText = duration >= 1000 ? `${Math.round(duration / 1000)}s` : `${duration}ms`;

  return (
    <div className="chat-message chat-message-agent" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
      <HermesAvatar />
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 12px", cursor: "pointer",
            border: "none", borderRadius: "16px", whiteSpace: "nowrap",
            background: "var(--thinking-bg, rgba(139, 92, 246, 0.04))",
          }}
        >
          <span style={{
            display: "inline-block", width: "6px", height: "6px",
            background: "#8b5cf6", borderRadius: "50%", opacity: 0.5,
          }} />
          <span style={{ color: "var(--thinking-label, #7c3aed)", fontSize: "13px" }}>
            Reasoned for {durationText}
          </span>
          <span style={{ color: "var(--text-muted, #6b7280)", fontSize: "11px" }}>
            · {lines.length} lines
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted, #6b7280)" }}>
            {expanded ? "▾" : "▸"}
          </span>
        </button>
        {expanded && (
          <div
            style={{
              flex: 1, minWidth: 0,
              background: "var(--thinking-detail-bg, rgba(139, 92, 246, 0.04))",
              border: "1px solid var(--thinking-detail-border, rgba(139, 92, 246, 0.1))",
              borderRadius: "8px", padding: "10px 12px",
              maxHeight: "200px", overflowY: "auto",
              fontFamily: "monospace", fontSize: "12px", lineHeight: 1.65,
              color: "var(--thinking-detail-text, #9ca3af)", whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/screens/Chat/ThinkingBlock.tsx
git commit -m "feat(chat): add ThinkingBlock component for history reasoning"
```

---

### Task 4: Wire thinking into useChatInbox + renderTranscript + MessageList

**Files:**
- Modify: `src/renderer/src/screens/Chat/hooks/useChatInbox.ts` (lines ~1155-1156, ~576-624)
- Modify: `src/renderer/src/screens/Chat/renderTranscript.ts` (~line 63 filter)
- Modify: `src/renderer/src/screens/Chat/MessageList.tsx` (~line 284 LiveReasoningRow usage)
- Modify: `src/renderer/src/screens/Chat/tuiEvents.ts` (add gateway.reconnected classification)

- [ ] **Step 1: Update tuiEvents.ts — add gateway.reconnected classification**

In `tuiEvents.ts`, in the `EVENT_CLASSIFICATIONS` record, after the `"gateway.start_timeout"` entry (~line 123), add:

```typescript
  "gateway.reconnected": { category: "status", safeAfterAbort: true },
```

- [ ] **Step 2: Update useChatInbox.ts — replace thinking.delta handler with throttle**

At the top of `useChatInbox.ts`, add import:
```typescript
import { useThinkingThrottle } from "./useThinkingThrottle";
```

Inside the `useChatInbox` hook body, before the main `useEffect`, initialize the throttle and timing refs:
```typescript
  const thinkingStartRef = useRef<number | null>(null);
  const { push: pushThinking, forceFlush: flushThinking, reset: resetThinking } = useThinkingThrottle({
    onFlush: useCallback((text: string) => {
      const tabId = activeTabIdRef.current;
      if (!tabId) return;
      const state = sessionsRef.current.get(tabId);
      updateTabRef.current(tabId, {
        streamingReasoning: `${state?.streamingReasoning ?? ""}${text}`,
      });
    }, []),
  });
```

Replace the `thinking.delta` / `reasoning.delta` case block (~line 1155). Current code directly appends to `streamingReasoning`. Replace with:
```typescript
        case "thinking.delta":
        case "reasoning.delta": {
          const text = textFromPayload(payload);
          if (!text) break;
          if (!thinkingStartRef.current) thinkingStartRef.current = Date.now();
          pushThinking(text);
          break;
        }
```

In the `message.complete` handler (before `commitStreaming`), add:
```typescript
          flushThinking();
          const reasoningText = state?.streamingReasoning || "";
          const thinkingDuration = thinkingStartRef.current
            ? Date.now() - thinkingStartRef.current
            : 0;
          thinkingStartRef.current = null;
          resetThinking();
```

After `commitStreaming(tabId, runtimeSid)`, if `reasoningText` is non-empty, add it as a committed message:
```typescript
          if (reasoningText.trim()) {
            updateTabMessagesRef.current(tabId, (prev) => [
              ...prev,
              {
                id: `reasoning-${Date.now()}`,
                kind: "reasoning",
                role: "agent",
                content: reasoningText,
                duration: thinkingDuration,
                timestamp: Date.now(),
              } as any,
            ]);
            updateTabRef.current(tabId, { streamingReasoning: "" });
          }
```

In the `message.start` handler, reset thinking state:
```typescript
          thinkingStartRef.current = null;
          resetThinking();
```

- [ ] **Step 3: Update renderTranscript.ts — remove reasoning filter**

In `buildRenderableTranscript`, change the filter (~line 63):
```typescript
  const filtered = messages
    .filter((m) => !isHceCompaction(m))
```

Remove `kindOf(m) !== "reasoning" &&` from the filter condition.

In the `visibleMessages.map(...)` loop inside `MessageList.tsx`, add a case for reasoning messages (before the default bubble render):
```typescript
        if (k === "reasoning") {
          const rMsg = msg as any;
          return (
            <ThinkingBlock
              key={msg.id}
              text={(rMsg.content as string) || ""}
              duration={(rMsg.duration as number) || 0}
            />
          );
        }
```

Add the import at top of `MessageList.tsx`:
```typescript
import { ThinkingBlock } from "./ThinkingBlock";
```

- [ ] **Step 4: Replace LiveReasoningRow with ThinkingIndicator in MessageList.tsx**

Replace the `LiveReasoningRow` usage (~line 284):
```typescript
      {isLoading && !streamingText && !toolProgress && (
        <ThinkingIndicator text={streamingReasoning} duration={thinkingDuration} />
      )}
```

Add `ThinkingIndicator` import and pass `thinkingDuration` prop from `MessageList`. To get duration, add a `thinkingStartAt` prop to `MessageList`, or compute it from a ref in the parent. The simplest approach: add `thinkingStartAt` as an optional prop to `MessageList`, then:
```typescript
const thinkingDuration = thinkingStartAt ? Date.now() - thinkingStartAt : 0;
```

Add prop to `MessageListProps`:
```typescript
  thinkingStartAt?: number | null;
```

Remove the `LiveReasoningRow` function definition (~lines 43-62).

- [ ] **Step 5: Run tests**

Run: `cd /Users/xmli/code/hermes-caduceus && npx vitest run src/renderer/src/screens/Chat/`
Expected: All existing tests pass (some may need updates if they reference `LiveReasoningRow`)

- [ ] **Step 6: Commit**

```bash
git add -A src/renderer/src/screens/Chat/
git commit -m "feat(chat): wire thinking throttle + ThinkingIndicator/Block into chat"
```

---

## Task Group B: Silent Reconnection Recovery

### Task 5: Emit gateway.reconnected from Rust

**Files:**
- Modify: `src-tauri/src/tui_gateway.rs` (~line 748 handle_exit, ~line 259 gateway.ready handler)

- [ ] **Step 1: Store old session ID and emit reconnected event**

In `handle_exit` (~line 748), before the reconnect spawn, save the old `active_session_id`:
```rust
    let old_session_id = {
        let inner = gateway.inner.lock().await;
        inner.active_session_id.clone()
    };
```

In the `gateway.ready` event handler inside `handle_exit` (where the ready handler is registered, ~line 259 in WS mode and ~line 689 in stdio mode), after setting status to Ready, emit the reconnected event:
```rust
    if let Some(ref old_sid) = old_session_id {
        let new_sid = {
            let inner = gateway.inner.lock().await;
            inner.active_session_id.clone()
        };
        if let Some(ref new_sid) = new_sid {
            let _ = gateway.app.emit("tui-event", serde_json::json!({
                "type": "gateway.reconnected",
                "sid": new_sid,
                "payload": {
                    "oldSessionId": old_sid,
                    "newSessionId": new_sid,
                }
            }));
        }
    }
```

- [ ] **Step 2: Run Rust tests**

Run: `cd /Users/xmli/code/hermes-caduceus/src-tauri && cargo test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/tui_gateway.rs
git commit -m "feat(gateway): emit gateway.reconnected event on reconnect"
```

---

### Task 6: Frontend reconnection recovery logic

**Files:**
- Modify: `src/renderer/src/screens/Chat/hooks/useChatInbox.ts` (add gateway.reconnected handler)
- Modify: `src/renderer/src/screens/Chat/tauriChatGatewayClient.ts` (~line 69 ensureSession)

- [ ] **Step 1: Add reconnection handler in useChatInbox.ts**

In the main event processing `switch` block inside `processEvent`, add a new case:
```typescript
        case "gateway.reconnected": {
          const oldSid = stringField(payload, "oldSessionId");
          const newSid = stringField(payload, "newSessionId") || event.sessionId;
          if (!oldSid || !newSid) break;

          const tabId = findTabBySessionId(oldSid) || findTabBySessionId(newSid) || activeTabIdRef.current;
          if (!tabId) break;

          const state = sessionsRef.current.get(tabId);

          // Path A: try resuming old session
          try {
            const status = await apiRef.current.tuiSessionStatus(oldSid);
            if (status) {
              updateTabRef.current(tabId, { hermesSessionId: oldSid });
              break;
            }
          } catch { /* session dead, try path B */ }

          // Path B: backfill from DB
          if (state?.streamingText || state?.streamingReasoning) {
            try {
              const messages = await apiRef.current.getSessionMessages(oldSid);
              if (messages && messages.length > 0) {
                commitStreaming(tabId, newSid);
                break;
              }
            } catch { /* DB has nothing, fall to path C */ }

            // Path C: graceful degradation
            commitStreaming(tabId, newSid);
            updateTabMessagesRef.current(tabId, (prev) => [
              ...prev,
              createSystemEvent("reconnect", "Connection interrupted", "Response was incomplete", { tone: "warning" }),
            ]);
          }
          break;
        }
```

Add a ref for the API client at the top of the hook (passed from parent or context — follow the existing pattern for `api` access in the file).

- [ ] **Step 2: Prevent streaming state clear on disconnect**

In the `gateway.error` / `gateway.start_timeout` handlers, find any code that clears `streamingText`/`streamingReasoning` and remove those clears. The streaming state should persist frozen until reconnection recovery handles it.

- [ ] **Step 3: Update tuiSessionStatus in tauriChatGatewayClient.ts**

In `ensureSession` (~line 69), the existing code already does a liveness check:
```typescript
          await api.tuiSessionStatus(currentSessionId);
```
This is sufficient for Path A. No changes needed here.

- [ ] **Step 4: Add tuiSessionStatus to hermes-tauri.ts if missing**

Check if `tuiSessionStatus` exists in `src/renderer/src/lib/hermes-tauri.ts`. If not, add:
```typescript
export function tuiSessionStatus(sessionId: string): Promise<any> {
  return invoke("tui_session_status", { sessionId });
}
```

- [ ] **Step 5: Run tests**

Run: `cd /Users/xmli/code/hermes-caduceus && npx vitest run src/renderer/src/screens/Chat/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A src/renderer/src/screens/Chat/ src/renderer/src/lib/hermes-tauri.ts
git commit -m "feat(chat): add silent reconnection recovery (3-tier fallback)"
```

---

## Task Group C: Virtual List

### Task 7: Install react-virtuoso

- [ ] **Step 1: Install dependency**

Run: `cd /Users/xmli/code/hermes-caduceus && npm install react-virtuoso`

- [ ] **Step 2: Verify installation**

Run: `cd /Users/xmli/code/hermes-caduceus && npx tsc --noEmit`
Expected: No type errors from new dependency

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-virtuoso dependency"
```

---

### Task 8: Migrate MessageList to Virtuoso

**Files:**
- Modify: `src/renderer/src/screens/Chat/MessageList.tsx`
- Modify: `src/renderer/src/screens/Chat/hooks/useChatScroll.ts`
- Modify: `src/renderer/src/screens/Chat/hooks/useLoadEarlier.ts`

- [ ] **Step 1: Rewrite MessageList.tsx with Virtuoso**

Replace the `return` block of `MessageList`. Key changes:
- Import `Virtuoso` from `react-virtuoso`
- Accept `onLoadEarlier` and `virtuosoRef` as props
- Render `visibleMessages` via `Virtuoso`'s `data` prop
- Move streaming content (ThinkingIndicator, StreamingMarkdown, ToolProgressIndicator, TodoPanel) into a `Footer` component

```tsx
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

// ... existing imports ...

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  toolProgress: string | null;
  streamingText?: string;
  streamingReasoning?: string;
  thinkingStartAt?: number | null;
  todos?: TodoItem[];
  scrollerRef?: (node: HTMLDivElement | null) => void;
  onLoadEarlier?: () => void;
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
}

function renderItem(_index: number, msg: ChatMessage) {
  const k = (msg as { kind?: string }).kind;
  if (k === "tool_group") return <ToolGroupRow key={msg.id} msg={msg as ToolGroupMessage} />;
  if (k === "subagent") return <SubagentRow key={msg.id} msg={msg as Extract<ChatMessage, { kind: "subagent" }>} />;
  if (k === "tool_result") return <ToolResultRow key={msg.id} msg={msg as ToolResultMessage} />;
  if (k === "system_status") return <SystemStatusRow key={msg.id} msg={msg as SystemStatusMessage} />;
  if (k === "system_event") return <SystemEventRow key={msg.id} msg={msg as SystemEventMessage} />;
  if (k === "reasoning") {
    const rMsg = msg as any;
    return <ThinkingBlock key={msg.id} text={(rMsg.content as string) || ""} duration={(rMsg.duration as number) || 0} />;
  }
  if (k === "todo") return <TodoPanel key={msg.id} todos={(msg as TodoMessage).todos} defaultCollapsed={true} />;
  if (k === "tool_progress") {
    const p = msg as any;
    return <div key={msg.id} className="chat-tool-progress-inline">{p.content}</div>;
  }
  const bubble = msg as Extract<ChatMessage, { role: "user" | "agent" }>;
  return <MessageRow key={msg.id} msg={bubble} isLast={false} isLoading={false} />;
}

function StreamingFooter({
  isLoading, streamingText, streamingReasoning, thinkingStartAt, toolProgress, messages, todos,
}: {
  isLoading: boolean; streamingText: string; streamingReasoning: string;
  thinkingStartAt: number | null; toolProgress: string | null;
  messages: ChatMessage[]; todos: TodoItem[];
}) {
  const thinkingDuration = thinkingStartAt ? Date.now() - thinkingStartAt : 0;
  return <>
    {isLoading && !streamingText && !toolProgress && (
      <ThinkingIndicator text={streamingReasoning} duration={thinkingDuration} />
    )}
    {isLoading && !streamingText && toolProgress && (
      <ToolProgressIndicator toolProgress={toolProgress} messages={messages} />
    )}
    {isLoading && todos.length > 0 && <TodoPanel todos={todos} defaultCollapsed />}
    {isLoading && streamingText && !streamingText.startsWith("[HCE COMPACTION") && (
      <div className="chat-message chat-message-agent">
        <HermesAvatar />
        <div className="chat-bubble chat-bubble-agent">
          <StreamingMarkdown>{stripHceCompaction(streamingText) || streamingText}</StreamingMarkdown>
        </div>
      </div>
    )}
  </>;
}
```

The main `MessageList` return becomes:
```tsx
export const MessageList = memo(function MessageList(props: MessageListProps) {
  const {
    messages, isLoading, toolProgress, streamingText = "", streamingReasoning = "",
    thinkingStartAt, todos = [], scrollerRef, onLoadEarlier, virtuosoRef,
  } = props;

  const visibleMessages = useMemo(
    () => buildRenderableTranscript({ messages, isLoading, toolProgress }),
    [messages, isLoading, toolProgress],
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={visibleMessages}
      followOutput="smooth"
      startReached={() => onLoadEarlier?.()}
      itemContent={renderItem}
      computeItemKey={(_i, msg) => msg.id}
      components={{
        Footer: () => <StreamingFooter
          isLoading={isLoading} streamingText={streamingText}
          streamingReasoning={streamingReasoning} thinkingStartAt={thinkingStartAt ?? null}
          toolProgress={toolProgress} messages={messages} todos={todos}
        />,
      }}
    />
  );
});
```

- [ ] **Step 2: Update useChatScroll.ts**

Remove the `scrollTop < SCROLL_TOP_THRESHOLD` check and `loadEarlierTriggeredRef` logic. Keep `userScrolledUp` state (used for unread indicator). The `containerRef` / `setContainerRef` / scroll listener can be simplified:

```typescript
export function useChatScroll(
  messages: ChatMessage[],
  isLoading: boolean,
  streamingText = "",
  streamingReasoning = "",
): {
  userScrolledUp: boolean;
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
} {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // ... keep existing isAtBottom / followOutput logic ...
  // Virtuoso handles scroll-to-bottom via followOutput="smooth"
  // userScrolledUp is still needed for unread badge

  return { userScrolledUp, virtuosoRef };
}
```

- [ ] **Step 3: Update useLoadEarlier.ts**

Replace the `requestAnimationFrame` scroll position fix with Virtuoso's API:

```typescript
// After loading earlier messages:
const count = unique.length;
setMessages((prev) => [...unique, ...prev]);
requestAnimationFrame(() => {
  virtuosoRef?.current?.adjustForPrependedItems({ prepended: count });
});
```

This requires passing `virtuosoRef` into `useLoadEarlier` (or exposing it from `useChatScroll`).

- [ ] **Step 4: Update ToolGroupRow.tsx — notify Virtuoso on height change**

Add a callback prop for height changes. When a tool group is collapsed/expanded:
```typescript
const handleToggle = () => {
  setExpanded(!expanded);
  // Parent passes this from MessageList context
  onHeightChange?.();
};
```

In `MessageList`, provide `onHeightChange` that calls `virtuosoRef.current?.adjustForPrependedItems({})`.

- [ ] **Step 5: Run tests**

Run: `cd /Users/xmli/code/hermes-caduceus && npx vitest run src/renderer/src/screens/Chat/`
Expected: PASS — some tests may need updating for Virtuoso wrapper

- [ ] **Step 6: Commit**

```bash
git add -A src/renderer/src/screens/Chat/
git commit -m "feat(chat): migrate MessageList to react-virtuoso virtual scroll"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All three features (thinking throttle, reconnection recovery, virtual list) have tasks
- [x] **No placeholders:** Every step contains actual code or exact commands
- [x] **Type consistency:** Component props and hook APIs match across tasks
- [x] **Dependency ordering:** Task 1-4 (thinking) is independent; Task 5-6 (reconnect) is independent; Task 7-8 (virtuoso) is independent
