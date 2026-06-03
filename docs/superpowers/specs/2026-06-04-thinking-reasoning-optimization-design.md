# Thinking & Reasoning Display Optimization

Reference: `~/code/athena/` implementation patterns.

## Problem

1. **ThinkingIndicator stays visible after response completes**: Late `thinking.delta`/`reasoning.delta` events arrive after `message.complete` and re-enable `isLoading`, causing the indicator to show until the 30s `DELTA_IDLE_TIMEOUT_MS` expires.
2. **ThinkingIndicator shows with empty content**: Displays "Thinking + ..." even when `streamingReasoning` is empty.
3. **Reasoning flush is slow**: `setTimeout(1500ms)` + 100-char threshold causes noticeable lag.
4. **Historical ThinkingBlock unwanted**: `reasoning` messages persist in transcript as "Reasoned for Xs" blocks — user doesn't need them.
5. **Thinking timer causes re-renders**: `thinkingDuration` driven through React state.

## Design

### 1. Fix late-delta race condition

File: `src/renderer/src/screens/Chat/hooks/useChatInbox.ts`

Add `turnCompletedRef` guard at the top of the `thinking.delta`/`reasoning.delta` handler and `reasoning.available` handler:

```ts
case "thinking.delta":
case "reasoning.delta": {
  if (turnCompletedRef.current.get(tabId)) return;
  // ... existing logic unchanged
}

case "reasoning.available": {
  if (turnCompletedRef.current.get(tabId)) return;
  // ... existing logic unchanged
}
```

### 2. ThinkingIndicator display guard

File: `src/renderer/src/screens/Chat/MessageList.tsx`

Change StreamingFooter condition from:

```tsx
{!streamingText && !toolProgress && (
  <ThinkingIndicator ... />
)}
```

To:

```tsx
{!streamingText && !toolProgress && !!streamingReasoning && (
  <ThinkingIndicator ... />
)}
```

When there's no reasoning content, don't show the indicator at all.

### 3. Reasoning flush via requestAnimationFrame

File: `src/renderer/src/screens/Chat/hooks/useChatInbox.ts`

Replace the `setTimeout(1500ms)` + char-threshold flush with rAF-based flush (matching athena):

- Remove `REASONING_FLUSH_CHARS` and `REASONING_FLUSH_MS` constants.
- Rewrite `scheduleReasoningFlush` to use `requestAnimationFrame` instead of `setTimeout`.
- Accumulate in `pendingReasoningRef`, flush all at once per frame.

```ts
function scheduleReasoningFlush(tabId: string): void {
  if (reasoningFlushRef.current.has(tabId)) return;
  const id = requestAnimationFrame(() => {
    if (reasoningFlushRef.current.get(tabId) === id) {
      reasoningFlushRef.current.delete(tabId);
      const batch = pendingReasoningRef.current.get(tabId) ?? "";
      pendingReasoningRef.current.delete(tabId);
      if (!batch) return;
      const state = sessionsRef.current.get(tabId);
      updateTab(tabId, {
        streamingReasoning: `${state?.streamingReasoning ?? ""}${batch}`,
      });
    }
  }) as unknown as Symbol;
  reasoningFlushRef.current.set(tabId, id);
}
```

The existing cleanup in `message.complete` and `finalizeStuckTurn` already cancels reasoning flush frames — just verify they work with the new rAF-based ref.

### 4. Remove historical ThinkingBlock

Files:
- `src/renderer/src/screens/Chat/renderTranscript.ts`
- `src/renderer/src/screens/Chat/MessageList.tsx`

Restore the reasoning filter in `buildRenderableTranscript`:

```ts
const filtered = messages
  .filter((m) => kindOf(m) !== "reasoning" && !isHceCompaction(m))
```

Remove the `k === "reasoning"` render branch in `MessageList.tsx` (the `ThinkingBlock` rendering).

Reasoning is displayed only during live streaming via `ThinkingIndicator`. After completion, it is not persisted as a visible block.

### 5. Thinking timer via DOM direct write

File: `src/renderer/src/screens/Chat/ThinkingIndicator.tsx`

- Add a `<span>` with a stable ID (e.g., `data-thinking-timer`) inside the component.
- Start an rAF loop on mount that writes elapsed time directly to the DOM element's `textContent`.
- Stop on unmount via cleanup.
- Keep the `duration` prop as initial value only — the rAF loop takes over for live updates.

In `useChatInbox.ts`:
- Replace `thinkingDuration` React state with a ref-based approach.
- Start the rAF timer when first `thinking.delta`/`reasoning.delta` arrives (existing `thinkingStartRef`).
- The ThinkingIndicator component manages its own timer display internally.

## Files to modify

| File | Changes |
|------|---------|
| `useChatInbox.ts` | Late-delta guard, rAF flush, timer refactor |
| `MessageList.tsx` | Display guard, remove ThinkingBlock branch |
| `ThinkingIndicator.tsx` | rAF-based timer, remove dependency on duration prop for live updates |
| `renderTranscript.ts` | Restore reasoning filter |

## Not in scope

- Changing the ThinkingIndicator visual design/CSS
- Changing the ChatHeader reasoning display
- Modifying backend event emission
