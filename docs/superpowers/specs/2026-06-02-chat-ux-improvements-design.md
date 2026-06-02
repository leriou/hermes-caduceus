# Chat UX Improvements Design

Three independent improvements to the Caduceus chat interaction experience.

## 1. Silent Reconnection Recovery

### Problem

When the Python backend process crashes or the WebSocket disconnects mid-stream, the Rust layer auto-restarts the process, but the frontend's `streamingText` and `streamingReasoning` are lost. The user sees an incomplete response with no recovery.

### Design

**Frontend freezes streaming state on disconnect** — do not clear `streamingText`/`streamingReasoning` when the connection drops. The incomplete text remains visible.

**Three-tier recovery on reconnect (priority order):**

1. **Resume live session** — Rust emits `gateway.reconnected` with `{oldSessionId, newSessionId}`. Frontend calls `tuiSessionStatus(oldSid)`. If alive, continue receiving deltas on the old session. Frontend calls `appendStreaming` to append new deltas to the frozen text.

2. **DB backfill** — If old session is dead, call `getSessionMessages(oldSid)` to fetch the last complete response from the session DB. Frontend calls `commitStreaming` to replace the frozen partial text with the full response.

3. **Graceful degradation** — If DB has no record (full process restart), append a `system_event` message: "Connection interrupted, response incomplete." The partial text is preserved as-is.

### Changes

- **`tui_gateway.rs`**: After `handle_exit` + successful reconnect, emit `gateway.reconnected` event with old/new session IDs.
- **`useChatInbox.ts`**: Handle `gateway.reconnected` event. Implement three-tier recovery logic. Do not clear streaming state on `gateway.error` / `gateway.start_timeout`.
- **`tauriChatGatewayClient.ts`**: `ensureSession` adds resume logic — try old session liveness check before creating a new session.

---

## 2. Thinking/Reasoning Stream Display

### Problem

- Thinking indicator is minimal (dot + "Thinking" + last-line snippet) and disappears once streaming text starts.
- Reasoning deltas fire per-token, scrolling too fast to read.
- Reasoning content is filtered out after `message.complete` — lost from history.

### Design

#### Throttle mechanism

Buffer `thinking.delta` / `reasoning.delta` events and flush to UI on a dual threshold:

- **Character threshold**: 100 characters accumulated
- **Time threshold**: 1000ms elapsed
- **Whichever comes first** triggers a flush to `streamingReasoning` state
- Force flush remaining buffer on `message.complete`

#### UI: Current indicator + expandable detail panel

**Streaming state (default expanded on first thinking in session):**
- Left: existing indicator pill (dot + "Thinking" + duration + line count)
- Right: expandable detail panel showing reasoning text in monospace
- Detail panel max-height 200px, scrollable, cursor at end
- Click ▾ to collapse detail, ▸ to expand

**After `message.complete` (auto-collapsed):**
- Indicator changes to "Reasoned for Xs · N lines"
- Detail collapsed, click to re-expand
- Works in history — reasoning is persisted as a message

#### Timing

- Record `thinkingStartAt` on first `thinking.delta` / `reasoning.delta`
- Display elapsed time in indicator (e.g. "5s")
- On `message.complete`, compute `duration = Date.now() - thinkingStartAt` for summary

#### Persistence

- On `message.complete`, commit `streamingReasoning` content as a `kind: "reasoning"` message in the message array
- `buildRenderableTranscript` no longer filters reasoning messages
- `rewriteTranscript` associates reasoning messages with the following agent reply as a pre-response reasoning block
- Reasoning messages render as `ThinkingBlock` component (collapsed by default in history, expandable on click)

### Changes

- **`useChatInbox.ts`**: Replace immediate delta append with buffer + throttle (100 chars / 1s). Track `thinkingStartAt`. Commit reasoning to message array on `message.complete`.
- **`MessageList.tsx`**: Replace `LiveReasoningRow` with new `ThinkingIndicator` (pill) + `ThinkingDetail` (panel) pair. Add `ThinkingBlock` component for collapsed history reasoning.
- **`renderTranscript.ts`**: Remove reasoning filter. Render reasoning messages as `ThinkingBlock`.

---

## 3. Virtual List for Long Conversations

### Problem

`MessageList` renders all messages via `.map()`. Long conversations (200+ messages) create 400+ DOM nodes, slow React reconciliation, and increasing memory usage.

### Design

Replace `div.chat-messages-inner` + `.map()` with `react-virtuoso`'s `Virtuoso` component.

```tsx
<Virtuoso
  ref={virtuosoRef}
  data={visibleMessages}
  followOutput="smooth"
  startReached={onLoadEarlier}
  itemContent={(index, msg) => renderItem(msg, index)}
  computeItemKey={(index, msg) => msg.id}
  components={{
    Footer: StreamingFooter
  }}
/>
```

#### Key adaptations

1. **Variable item height**: Virtuoso measures actual DOM heights by default. No need for fixed heights.

2. **Streaming anchor**: Streaming text, thinking indicator, and tool progress move into Virtuoso's `Footer` component. `followOutput="smooth"` keeps scroll pinned to bottom during streaming.

3. **Load earlier**: Replace `scrollTop < 60` detection with Virtuoso's `startReached` callback. After loading, call `virtuosoRef.current.adjustForPrependedItems({ prepended: count })` to maintain scroll position.

4. **Tool call collapse/expand height changes**: When a tool group is toggled, notify Virtuoso to re-measure via `requestAnimationFrame(() => virtuosoRef.current.adjustForPrependedItems({}))`.

### New dependency

- `react-virtuoso` (~15KB gzip, MIT, 300K+ weekly downloads, React 18/19 compatible)

### Changes

- **`MessageList.tsx`**: Replace container + `.map()` with `Virtuoso`. Move streaming content to `Footer` component. Dispatch rendering by message `kind` in `itemContent`.
- **`useChatScroll.ts`**: Remove `scrollTop < 60` listener. Keep `userScrolledUp` state for unread indicator. Use Virtuoso's `startReached` for load earlier trigger.
- **`useLoadEarlier.ts`**: Replace manual `scrollTop` correction with `adjustForPrependedItems`.
- **`ToolGroupRow.tsx`**: On collapse/expand toggle, notify Virtuoso to re-measure item height.
