import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageList } from "./MessageList";

const baseProps = {
  messages: [],
  toolProgress: null,
};

describe("MessageList pending request bars", () => {
  it("does not render sudo or secret prompts in the transcript", () => {
    const { container } = render(<MessageList {...baseProps} isLoading />);
    expect(container.querySelector(".chat-sudo-bar")).toBeNull();
    expect(container.querySelector(".chat-secret-bar")).toBeNull();
  });
});

describe("MessageList system events", () => {
  it("renders system event messages without crashing", () => {
    const { container } = render(
      <MessageList
        {...baseProps}
        isLoading={false}
        messages={[
          {
            id: "model",
            kind: "system_event",
            role: "system",
            event: "model_switch",
            tone: "success",
            title: "Model switched",
            content: "gpt-4o-mini",
          },
          {
            id: "compress",
            kind: "system_event",
            role: "system",
            event: "context_compress",
            tone: "success",
            title: "Session compressed",
            content: "12k -> 4k tokens",
          },
          {
            id: "error",
            kind: "system_event",
            role: "system",
            event: "provider_error",
            tone: "error",
            title: "Provider error 429",
            content: "Rate limit exceeded",
          },
        ]}
      />,
    );
    // Virtuoso renders items — verify the component rendered without error
    expect(container.innerHTML).toBeTruthy();
  });

  it("renders system events with code badge without crashing", () => {
    const { container } = render(
      <MessageList
        {...baseProps}
        isLoading={false}
        messages={[
          {
            id: "error",
            kind: "system_event",
            role: "system",
            event: "provider_error",
            tone: "error",
            title: "Provider error 1305",
            content: "Model overloaded",
            code: "1305",
          },
        ]}
      />,
    );
    expect(container.innerHTML).toBeTruthy();
  });
});
