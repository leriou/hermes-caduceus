# Thinking & Reasoning Display Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix ThinkingIndicator staying visible after response completes, speed up reasoning flush, remove unwanted historical reasoning blocks, and switch thinking timer to zero-render rAF.

**Architecture:** Fix late-delta race in useChatInbox, guard ThinkingIndicator against empty content, replace setTimeout-based reasoning flush with rAF, restore reasoning filter in renderTranscript, move thinking timer into ThinkingIndicator component with DOM-direct writes.

**Tech Stack:** React, TypeScript, Vitest, requestAnimationFrame

---

### Task 1: Fix late-delta race condition

**Files:**
- Modify: `src/renderer/src/screens/Chat/hooks/useChatInbox.ts` (lines ~1161, ~1314)
- Test: `src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test in `useChatInbox.test.tsx` that verifies late `reasoning.delta` after `message.complete` does not re-enable `isLoading`:

```ts
it("ignores late reasoning.delta after message.complete", async () => {
  const updateTab = vi.fn();
  const updateTabMessages = vi.fn();

  const sessions = new Map([
    ["tab-1", {
      isLoading: false,
      streamingReasoning: "",
      streamingText: "",
      toolProgress: null,
      messages: [],
      hermesSessionId: "sid-1",
      dbSessionId: "sid-1",
      relatedSessionIds: [],
      unreadCount: 0,
      todos: [],
    }],
  ]);

  renderHook(() =>
    useChatInbox({
      sessions,
      activeTabId: "tab-1",
      chatVisible: true,
      findTabBySessionId: () => "tab-1",
      updateTab,
      updateTabMessages,
    }),
  );

  // Simulate a completed turn
  eventHandler?.({
    type: "message.start",
    sid: "sid-1",
    payload: {},
  });
  eventHandler?.({
    type: "message.delta",
    sid: "sid-1",
    payload: { text: "hello" },
  });
  eventHandler?.({
    type: "message.complete",
    sid: "sid-1",
    payload: { text: "hello" },
  });

  await waitFor(() => {
    expect(updateTab).toHaveBeenCalledWith("tab-1", expect.objectContaining({ isLoading: false }));
  });

  const callsBefore = updateTab.mock.calls.length;

  // Late reasoning.delta arrives AFTER turn completed
  eventHandler?.({
    type: "reasoning.delta",
    sid: "sid-1",
    payload: { text: "late thinking" },
  });

  // Should NOT set isLoading back to true
  const isLoadingCalls = updateTab.mock.calls
    .slice(callsBefore)
    .filter((c: any[]) => c[1]?.isLoading === true);
  expect(isLoadingCalls).toHaveLength(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx -t "ignores late reasoning.delta"`
Expected: FAIL — late delta re-enables `isLoading`

- [ ] **Step 3: Add `turnCompletedRef` guard to `thinking.delta`/`reasoning.delta` handler**

In `useChatInbox.ts`, at the top of the `thinking.delta`/`reasoning.delta` case block (~line 1162), add:

```ts
        case "thinking.delta":
        case "reasoning.delta": {
          if (turnCompletedRef.current.get(tabId)) return;
          if (!thinkingStartRef.current.has(tabId)) {
```

- [ ] **Step 4: Add `turnCompletedRef` guard to `reasoning.available` handler**

In `useChatInbox.ts`, at the top of the `reasoning.available` case block (~line 1314), add:

```ts
        case "reasoning.available": {
          if (turnCompletedRef.current.get(tabId)) return;
          const reasonText = textFromPayload(payload);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx -t "ignores late reasoning.delta"`
Expected: PASS

- [ ] **Step 6: Run full test suite for useChatInbox**

Run: `npx vitest run src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx`
Expected: All existing tests still pass

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/screens/Chat/hooks/useChatInbox.ts src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx
git commit -m "fix(chat): ignore late thinking/reasoning deltas after turn completed"
```

---

### Task 2: ThinkingIndicator display guard

**Files:**
- Modify: `src/renderer/src/screens/Chat/MessageList.tsx` (line ~283)

- [ ] **Step 1: Add `streamingReasoning` truthiness guard**

In `MessageList.tsx`, change the ThinkingIndicator rendering condition in the `StreamingFooter` useMemo (line ~283):

From:
```tsx
{!streamingText && !toolProgress && (
  <ThinkingIndicator text={streamingReasoning} duration={thinkingDuration} />
)}
```

To:
```tsx
{!streamingText && !toolProgress && !!streamingReasoning && (
  <ThinkingIndicator text={streamingReasoning} duration={thinkingDuration} />
)}
```

- [ ] **Step 2: Run MessageList tests**

Run: `npx vitest run src/renderer/src/screens/Chat/MessageList.test.tsx`
Expected: All tests pass (no existing test asserts that ThinkingIndicator shows with empty reasoning)

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/screens/Chat/MessageList.tsx
git commit -m "fix(chat): hide ThinkingIndicator when no reasoning content"
```

---

### Task 3: Reasoning flush via requestAnimationFrame

**Files:**
- Modify: `src/renderer/src/screens/Chat/hooks/useChatInbox.ts` (lines ~672-698)

- [ ] **Step 1: Replace `scheduleReasoningFlush` with rAF**

In `useChatInbox.ts`, replace the `scheduleReasoningFlush` function (~line 685-698):

From:
```ts
    function scheduleReasoningFlush(tabId: string): void {
      const pending = pendingReasoningRef.current.get(tabId) ?? "";
      if (pending.length >= REASONING_FLUSH_CHARS) {
        flushReasoning(tabId);
        return;
      }
      if (reasoningFlushRef.current.has(tabId)) return;
      const id = setTimeout(() => {
        if (reasoningFlushRef.current.get(tabId) === id) {
          flushReasoning(tabId);
        }
      }, REASONING_FLUSH_MS) as unknown as Symbol;
      reasoningFlushRef.current.set(tabId, id);
    }
```

To:
```ts
    function scheduleReasoningFlush(tabId: string): void {
      if (reasoningFlushRef.current.has(tabId)) return;
      const id = requestAnimationFrame(() => {
        if (reasoningFlushRef.current.get(tabId) === id) {
          flushReasoning(tabId);
        }
      }) as unknown as Symbol;
      reasoningFlushRef.current.set(tabId, id);
    }
```

- [ ] **Step 2: Remove unused constants**

Delete the `REASONING_FLUSH_CHARS` and `REASONING_FLUSH_MS` constants (~lines 672-673):

```ts
    const REASONING_FLUSH_CHARS = 100;
    const REASONING_FLUSH_MS = 1500;
```

- [ ] **Step 3: Update cleanup to use `cancelAnimationFrame`**

Verify that `reasoningFlushRef` cleanup in `message.complete` handler and `finalizeStuckTurn` uses `cancelAnimationFrame` instead of `clearTimeout`. In `message.complete` handler (~line 797):

```ts
          const rFrame = reasoningFlushRef.current.get(tabId);
          if (rFrame != null) {
            cancelAnimationFrame(rFrame as unknown as number);
            reasoningFlushRef.current.delete(tabId);
          }
```

And in `finalizeStuckTurn` (~line 409):

```ts
    const rf = reasoningFlushRef.current.get(tabId);
    if (rf != null) {
      cancelAnimationFrame(rf as unknown as number);
      reasoningFlushRef.current.delete(tabId);
    }
```

Note: `cancelAnimationFrame` works with `setTimeout` IDs without error (no-op), so this is a safe swap. Verify these already use `cancelAnimationFrame` — if they use `clearTimeout`, change to `cancelAnimationFrame`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/screens/Chat/hooks/useChatInbox.ts
git commit -m "perf(chat): switch reasoning flush from setTimeout to requestAnimationFrame"
```

---

### Task 4: Remove historical ThinkingBlock

**Files:**
- Modify: `src/renderer/src/screens/Chat/renderTranscript.ts` (line ~162)
- Modify: `src/renderer/src/screens/Chat/MessageList.tsx` (lines ~227-229, ~13)
- Modify: `src/renderer/src/screens/Chat/renderTranscript.test.ts` (test at line ~276)

- [ ] **Step 1: Update renderTranscript filter to exclude reasoning**

In `renderTranscript.ts`, restore the reasoning filter in `buildRenderableTranscript` (~line 162):

From:
```ts
  const filtered = messages
    .filter((m) => !isHceCompaction(m))
```

To:
```ts
  const filtered = messages
    .filter((m) => kindOf(m) !== "reasoning" && !isHceCompaction(m))
```

Add back the comment above the filter:
```ts
  // Drop reasoning messages — only shown during live streaming.
  // Drop HCE compaction messages — they are system-internal, not for display.
```

- [ ] **Step 2: Remove `k === "reasoning"` render branch in MessageList**

In `MessageList.tsx`, remove the reasoning render branch (~lines 227-229):

```ts
  if (k === "reasoning") {
    const rMsg = msg as ReasoningMessage;
    return <ThinkingBlock text={rMsg.text} duration={rMsg.duration ?? 0} />;
  }
```

Remove the unused `ThinkingBlock` import (~line 13):

```ts
import { ThinkingBlock } from "./ThinkingBlock";
```

- [ ] **Step 3: Update renderTranscript test**

In `renderTranscript.test.ts`, update the test "passes reasoning messages through to MessageList for rendering" (~line 276) to expect reasoning messages to be filtered OUT:

From:
```ts
  it("passes reasoning messages through to MessageList for rendering", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
      { id: "r1", kind: "reasoning", role: "agent", text: "Thinking..." },
      { id: "a1", role: "agent", content: "Answer" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("u1");
    expect(result[1]).toMatchObject({ kind: "reasoning", text: "Thinking..." });
    expect(result[2].id).toBe("a1");
  });
```

To:
```ts
  it("filters reasoning messages out of transcript — only shown during live streaming", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
      { id: "r1", kind: "reasoning", role: "agent", text: "Thinking..." },
      { id: "a1", role: "agent", content: "Answer" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("u1");
    expect(result[1].id).toBe("a1");
  });
```

- [ ] **Step 4: Update useChatInbox test for reasoning message**

The test "keeps live reasoning attached to the current assistant turn" in `useChatInbox.test.tsx` (~line 213) expects a `{ kind: "reasoning" }` message in the transcript. This should still pass — the test checks the `updateTabMessages` updater, not the rendered transcript. But verify:

Run: `npx vitest run src/renderer/src/screens/Chat/hooks/useChatInbox.test.tsx -t "keeps live reasoning"`
Expected: PASS (this test checks message insertion, not rendering)

- [ ] **Step 5: Run full tests**

Run: `npx vitest run src/renderer/src/screens/Chat/`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/screens/Chat/renderTranscript.ts src/renderer/src/screens/Chat/MessageList.tsx src/renderer/src/screens/Chat/renderTranscript.test.ts
git commit -m "fix(chat): filter reasoning messages from transcript — only shown live"
```

---

### Task 5: Thinking timer via DOM direct write

**Files:**
- Modify: `src/renderer/src/screens/Chat/ThinkingIndicator.tsx`
- Modify: `src/renderer/src/screens/Chat/MessageList.tsx` (lines ~38, ~248, ~284, ~302)
- Modify: `src/renderer/src/screens/Chat/Chat.tsx` (lines ~165-180, ~630)

- [ ] **Step 1: Rewrite ThinkingIndicator to self-manage its timer via rAF**

Replace the full content of `ThinkingIndicator.tsx`:

```tsx
import { memo, useEffect, useRef } from "react";

interface ThinkingIndicatorProps {
  text: string;
}

const MAX_VISIBLE_LINES = 3;

export const ThinkingIndicator = memo(function ThinkingIndicator({
  text,
}: ThinkingIndicatorProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  const lines = text ? text.split("\n").filter((l) => l.trim()) : [];
  const visible = lines.length > MAX_VISIBLE_LINES
    ? lines.slice(-MAX_VISIBLE_LINES)
    : lines;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      if (timerRef.current) {
        const elapsed = Date.now() - startRef.current;
        timerRef.current.textContent = elapsed >= 1000
          ? `${Math.floor(elapsed / 1000)}s`
          : `${Math.floor(elapsed)}ms`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="chat-live-reasoning-footprint">
      <div className="chat-live-reasoning-left">
        <div className="chat-live-reasoning-dot" />
      </div>
      <div className="chat-live-reasoning-body">
        <span className="chat-live-reasoning-label">Thinking</span>
        <span className="chat-live-reasoning-duration" ref={timerRef} />
        {lines.length > MAX_VISIBLE_LINES && (
          <span className="chat-live-reasoning-duration">+{lines.length - MAX_VISIBLE_LINES}</span>
        )}
        <div className="chat-live-reasoning-scroll" ref={scrollRef}>
          {visible.length > 0 ? (
            visible.map((line, i) => (
              <div key={i} className="chat-live-reasoning-line">
                {line.length > 120 ? line.slice(0, 117) + "…" : line}
              </div>
            ))
          ) : (
            <div className="chat-live-reasoning-line">…</div>
          )}
        </div>
      </div>
    </div>
  );
});
```

Key changes:
- Removed `duration` prop — timer is self-managed via rAF
- Timer starts on mount, writes directly to DOM span via ref
- Zero React re-renders for timer updates

- [ ] **Step 2: Remove `thinkingDuration` from MessageList props**

In `MessageList.tsx`:

Remove from interface (~line 38):
```ts
  thinkingDuration?: number;
```

Remove from destructured props (~line 248):
```ts
    thinkingDuration = 0,
```

Remove from ThinkingIndicator usage (~line 284), change:
```tsx
<ThinkingIndicator text={streamingReasoning} duration={thinkingDuration} />
```
To:
```tsx
<ThinkingIndicator text={streamingReasoning} />
```

Remove from useMemo deps (~line 302):
```ts
  }, [isLoading, streamingText, streamingReasoning, thinkingDuration, toolProgress, messages, todos]);
```
To:
```ts
  }, [isLoading, streamingText, streamingReasoning, toolProgress, messages, todos]);
```

- [ ] **Step 3: Remove `thinkingDuration` state from Chat.tsx**

In `Chat.tsx`:

Remove state declaration and effect (~lines 165-180):
```ts
  const thinkingStartRef = useRef<number | null>(null);
  const [thinkingDuration, setThinkingDuration] = useState<number | undefined>();

  useEffect(() => {
    if (isLoading && streamingReasoning) {
      if (!thinkingStartRef.current) thinkingStartRef.current = Date.now();
      const interval = setInterval(() => {
        if (thinkingStartRef.current) {
          setThinkingDuration(Date.now() - thinkingStartRef.current);
        }
      }, 1000);
      return () => {
        clearInterval(interval);
        thinkingStartRef.current = null;
        setThinkingDuration(undefined);
      };
    } else {
      thinkingStartRef.current = null;
      setThinkingDuration(undefined);
    }
  }, [isLoading, streamingReasoning]);
```

Remove from MessageList props (~line 630):
```tsx
              thinkingDuration={thinkingDuration}
```

Remove unused `useState` import if no other uses exist in Chat.tsx (verify first).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/renderer/src/screens/Chat/`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/screens/Chat/ThinkingIndicator.tsx src/renderer/src/screens/Chat/MessageList.tsx src/renderer/src/screens/Chat/Chat.tsx
git commit -m "perf(chat): self-managed thinking timer via rAF, zero re-renders"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full chat test suite**

Run: `npx vitest run src/renderer/src/screens/Chat/`
Expected: All tests pass

- [ ] **Step 2: Run full project test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Final commit (if any test fixes needed)**

```bash
git add -A
git commit -m "test(chat): fix tests after thinking/reasoning optimization"
```
