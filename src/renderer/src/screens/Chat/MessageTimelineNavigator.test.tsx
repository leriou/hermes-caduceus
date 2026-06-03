import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageTimelineNavigator } from "./MessageTimelineNavigator";
import type { ChatMessage } from "./types";

describe("MessageTimelineNavigator", () => {
  it("filters user messages and renders markers", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "hello first message", timestamp: 1716739200000 },
      { id: "a1", role: "agent", content: "agent reply" },
      { id: "u2", role: "user", content: "user reply 2", timestamp: 1716739201000 },
    ];

    const onScrollToMessage = vi.fn();
    const { container: rendered } = render(
      <MessageTimelineNavigator messages={messages} onScrollToMessage={onScrollToMessage} />
    );

    const navigator = rendered.querySelector(".chat-timeline-navigator");
    expect(navigator).toBeTruthy();

    const markers = screen.getAllByRole("button");
    expect(markers).toHaveLength(2);

    expect(markers[0].getAttribute("title")).toBe("hello first message");
    expect(markers[1].getAttribute("title")).toBe("user reply 2");
  });

  it("calls onScrollToMessage when marker is clicked", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "hello first message", timestamp: 1716739200000 },
      { id: "a1", role: "agent", content: "agent reply" },
      { id: "u2", role: "user", content: "user reply 2", timestamp: 1716739201000 },
    ];

    const onScrollToMessage = vi.fn();
    render(
      <MessageTimelineNavigator messages={messages} onScrollToMessage={onScrollToMessage} />
    );

    const markers = screen.getAllByRole("button");
    fireEvent.click(markers[0]);
    expect(onScrollToMessage).toHaveBeenCalledWith("u1");

    fireEvent.click(markers[1]);
    expect(onScrollToMessage).toHaveBeenCalledWith("u2");
  });

  it("includes backward-compatible user bubble messages with kind user", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", kind: "user", content: "legacy user bubble", timestamp: 1716739200000 },
      { id: "a1", role: "agent", kind: "assistant", content: "agent reply" },
      { id: "u2", role: "user", kind: "user", content: "another user message", timestamp: 1716739201000 },
    ];

    const { container: rendered } = render(
      <MessageTimelineNavigator messages={messages} />
    );

    const buttons = screen.getAllByRole("button", { name: /go to user message/i });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute("title", "legacy user bubble");
    expect(buttons[1]).toHaveAttribute("title", "another user message");
  });

  it("does not render when fewer than 2 user messages", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "hello first message", timestamp: 1716739200000 },
    ];

    const { container: rendered } = render(
      <MessageTimelineNavigator messages={messages} />
    );

    const navigator = rendered.querySelector(".chat-timeline-navigator");
    expect(navigator).toBeNull();
  });

  it("does not render with no user messages", () => {
    const messages: ChatMessage[] = [
      { id: "a1", role: "agent", content: "agent reply" },
    ];

    const { container: rendered } = render(
      <MessageTimelineNavigator messages={messages} />
    );

    const navigator = rendered.querySelector(".chat-timeline-navigator");
    expect(navigator).toBeNull();
  });
});
