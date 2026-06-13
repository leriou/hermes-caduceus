import { describe, expect, it } from "vitest";
import {
  baseSessionTitle,
  mergeContinuationLabels,
  parseTitleSegment,
  sessionDisplayPreview,
  sessionDisplayTitle,
  shortModelName,
} from "./sessionDisplay";
import type { ChatMessage } from "./types";

describe("session display helpers", () => {
  it("parses compress-generated title segments", () => {
    expect(parseTitleSegment("Research task #2")).toEqual({
      base: "Research task",
      segment: 2,
    });
    expect(baseSessionTitle("Research task #3")).toBe("Research task");
    expect(parseTitleSegment("Research task")).toBeNull();
  });

  it("falls back from title to preview to placeholder", () => {
    expect(
      sessionDisplayTitle({ title: "New Chat", preview: "first prompt" }),
    ).toBe("first prompt");
    expect(sessionDisplayTitle({ title: "", preview: "first prompt" })).toBe(
      "first prompt",
    );
    expect(sessionDisplayTitle({ title: null, preview: "" })).toBe("-");
  });

  it("uses segment metadata in previews without exposing it as the title", () => {
    expect(
      sessionDisplayTitle({
        title: "Plan migration #2",
        preview: "continue here",
      }),
    ).toBe("Plan migration");
    expect(
      sessionDisplayPreview({
        title: "Plan migration #2",
        preview: "continue here",
      }),
    ).toBe("Part 2 · continue here");
  });

  it("hides bare Message #N continuation labels in the transcript", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Summarize this" },
      { id: "u2", role: "user", content: "Message #2" },
      { id: "a1", role: "agent", content: "continued" },
      { id: "u3", role: "user", content: "消息 #3：" },
    ];

    expect(mergeContinuationLabels(messages).map((m) => m.id)).toEqual([
      "u1",
      "a1",
      "u3",
    ]);
  });
});

describe("shortModelName", () => {
  it("strips path prefix", () => {
    expect(shortModelName("providers/anthropic/claude-opus-4")).toBe(
      "claude-opus-4",
    );
  });

  it("strips models/ prefix", () => {
    expect(shortModelName("models/gemini-pro")).toBe("gemini-pro");
  });

  it("strips colon suffix", () => {
    expect(shortModelName("gpt-4o:2024-01-01")).toBe("gpt-4o");
  });

  it("returns empty for null/undefined", () => {
    expect(shortModelName(null)).toBe("");
    expect(shortModelName(undefined)).toBe("");
  });

  it("returns simple names unchanged", () => {
    expect(shortModelName("claude-opus-4")).toBe("claude-opus-4");
  });
});

describe("sessionDisplayPreview edge cases", () => {
  it("shows msg count and model without preview", () => {
    expect(
      sessionDisplayPreview({ messageCount: 5, model: "claude-opus-4" }),
    ).toBe("5 msgs · claude-opus-4");
  });

  it("shows singular msg count", () => {
    expect(
      sessionDisplayPreview({ messageCount: 1, model: "gpt-4o" }),
    ).toBe("1 msg · gpt-4o");
  });

  it("returns dash for empty session", () => {
    expect(sessionDisplayPreview({})).toBe("-");
  });

  it("truncates preview to 80 chars", () => {
    expect(
      sessionDisplayPreview({ preview: "x".repeat(100) }),
    ).toHaveLength(80);
  });
});

describe("mergeContinuationLabels edge cases", () => {
  const toolMsg = (id: string): ChatMessage =>
    ({ id, kind: "tool_call", name: "read", args: "{}" }) as unknown as ChatMessage;

  it("keeps continuation label when preceded by tool message", () => {
    const messages: ChatMessage[] = [
      toolMsg("t1"),
      { id: "u1", role: "user", content: "Message #3:" },
    ];
    expect(mergeContinuationLabels(messages).map((m) => m.id)).toEqual([
      "t1",
      "u1",
    ]);
  });

  it("keeps all non-continuation user messages", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
      { id: "a1", role: "agent", content: "Hi" },
      { id: "u2", role: "user", content: "How are you?" },
    ];
    expect(mergeContinuationLabels(messages)).toHaveLength(3);
  });

  it("returns empty array unchanged", () => {
    expect(mergeContinuationLabels([])).toEqual([]);
  });
});
