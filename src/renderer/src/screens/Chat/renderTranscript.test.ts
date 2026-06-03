import { describe, expect, it } from "vitest";
import { buildRenderableTranscript, rewriteTranscript } from "./renderTranscript";
import type { ChatMessage } from "./types";

describe("buildRenderableTranscript", () => {
  it("processes historical messages by merging continuation labels, grouping tool calls, and filtering empty bubbles", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
      { id: "u2", role: "user", content: "Message #2" },
      { id: "a1", role: "agent", content: "" },
      {
        id: "tc1",
        kind: "tool_call",
        role: "agent",
        callId: "call-1",
        name: "read_file",
        args: "{}",
      },
      {
        id: "tr1",
        kind: "tool_result",
        role: "agent",
        callId: "call-1",
        name: "read_file",
        content: "file content",
      },
      {
        id: "tc2",
        kind: "tool_call",
        role: "agent",
        callId: "call-2",
        name: "read_file",
        args: "{}",
      },
      {
        id: "tr2",
        kind: "tool_result",
        role: "agent",
        callId: "call-2",
        name: "read_file",
        content: "file content 2",
      },
      { id: "a2", role: "agent", content: "Finished" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    expect(result.map((m) => m.id)).toEqual(["u1", "group-tc1-tc2", "a2"]);

    const group = result[1] as any;
    expect(group.kind).toBe("tool_group");
    expect(group.calls).toHaveLength(2);
    expect(group.calls[0].result).toBe("file content");
    expect(group.calls[1].result).toBe("file content 2");
  });

  it("streaming reasoning is not injected into transcript — rendered directly by MessageList", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: true,
      toolProgress: null,
      streamingReasoning: "Thinking about the question...",
    });

    // Streaming content is rendered by MessageList's Footer, not in transcript
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("u1");
  });

  it("streaming text is not injected into transcript — rendered directly by MessageList", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: true,
      toolProgress: null,
      streamingText: "Hello there",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("u1");
  });

  it("renders inline tool progress when isLoading and lastMessageIsAgent is true", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "Hello" },
      { id: "a1", role: "agent", content: "I am working" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: true,
      toolProgress: "Writing test cases...",
    });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("u1");
    expect(result[1].id).toBe("a1");
    expect(result[2]).toEqual({
      id: "tool-progress",
      kind: "tool_progress",
      role: "agent",
      content: "Writing test cases...",
    });
  });

  it("handles out-of-order tool completion (complete arrives for a tool not yet started)", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "fix the bug" },
      {
        id: "tc1-complete",
        sessionId: "s1",
        kind: "tool_call",
        role: "agent",
        callId: "tool-1",
        name: "Read",
        args: "{}",
        result: "file contents",
        success: true,
        durationS: 0.5,
      },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("u1");
    expect(result[1]).toMatchObject({
      kind: "tool_group",
      toolName: "Read",
      calls: [{ callId: "tool-1", result: "file contents" }],
    });
  });

  it("filters empty bubble after tool group", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "read file" },
      {
        id: "tc1",
        kind: "tool_call",
        role: "agent",
        callId: "t1",
        name: "Read",
        args: "{}",
        result: "contents",
      },
      { id: "a1", role: "agent", content: "" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("u1");
    expect(result[1].kind).toBe("tool_group");
  });

  it("produces stable output for identical input (pure check)", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "hello" },
      {
        id: "tc1",
        kind: "tool_call",
        role: "agent",
        callId: "t1",
        name: "Bash",
        args: '{"command":"ls"}',
        result: "file1\nfile2",
        durationS: 1.2,
      },
      { id: "a1", role: "agent", content: "Here are the files." },
    ];

    const args = {
      messages,
      isLoading: false,
      toolProgress: null as string | null,
      streamingText: "",
      streamingReasoning: "",
    };

    const result1 = buildRenderableTranscript(args);
    const result2 = buildRenderableTranscript(args);

    expect(result1).toEqual(result2);
  });

  it("merges consecutive agent bubbles within a turn", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "compare" },
      { id: "a1", role: "agent", content: "| A | B |\n| - | - |" },
      {
        id: "tc1",
        kind: "tool_call" as const,
        role: "agent" as const,
        callId: "c1",
        name: "search",
        args: "{}",
      },
      { id: "a2", role: "agent", content: "| 1 | 2 |\n\nDone" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    const agentBubbles = result.filter(
      (m) => !("kind" in m) || m.kind === "user" || m.kind === "assistant",
    );
    const agentTexts = agentBubbles.filter((m) => m.role === "agent");
    expect(agentTexts).toHaveLength(1);
    const merged = agentTexts[0] as any;
    expect(merged.content).toBe("| A | B |\n| - | - |\n| 1 | 2 |\n\nDone");
  });

  it("does not merge agent bubbles across user turns", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "hi" },
      { id: "a1", role: "agent", content: "hello" },
      { id: "u2", role: "user", content: "bye" },
      { id: "a2", role: "agent", content: "goodbye" },
    ];

    const result = buildRenderableTranscript({
      messages,
      isLoading: false,
      toolProgress: null,
    });

    const agentTexts = result.filter((m) => m.role === "agent" && !("kind" in m));
    expect(agentTexts).toHaveLength(2);
  });

  it("rewriteTranscript merges agent texts within a turn", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "compare" },
      { id: "a1", role: "agent", content: "First part" },
      {
        id: "tc1",
        kind: "tool_call" as const,
        role: "agent" as const,
        callId: "c1",
        name: "Read",
        args: "{}",
      },
      { id: "a2", role: "agent", content: "Second part" },
    ];

    const rewritten = rewriteTranscript(messages);
    const agentTexts = rewritten.filter(
      (m) => m.role === "agent" && !("kind" in m),
    );
    expect(agentTexts).toHaveLength(1);
    expect((agentTexts[0] as any).content).toBe("First part\nSecond part");
  });

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
});
