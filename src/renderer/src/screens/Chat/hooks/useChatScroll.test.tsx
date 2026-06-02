import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChatScroll } from "./useChatScroll";
import type { ChatMessage } from "../types";

describe("useChatScroll", () => {
  it("returns userScrolledUp=false by default", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    let scrollState = { userScrolledUp: true };

    function TestComponent(): React.JSX.Element {
      const { userScrolledUp } = useChatScroll(messages, vi.fn());
      scrollState.userScrolledUp = userScrolledUp;
      return <div />;
    }

    const { unmount } = render(<TestComponent />);
    expect(scrollState.userScrolledUp).toBe(false);
    unmount();
  });

  it("updates userScrolledUp via handleAtBottomChange", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    let handleAtBottom: ((atBottom: boolean) => void) | null = null;
    let scrollState = { userScrolledUp: false };

    function TestComponent(): React.JSX.Element {
      const { userScrolledUp, handleAtBottomChange } = useChatScroll(messages, vi.fn());
      handleAtBottom = handleAtBottomChange;
      scrollState.userScrolledUp = userScrolledUp;
      return <div />;
    }

    const { unmount } = render(<TestComponent />);
    expect(scrollState.userScrolledUp).toBe(false);

    act(() => {
      handleAtBottom!(false);
    });
    expect(scrollState.userScrolledUp).toBe(true);

    act(() => {
      handleAtBottom!(true);
    });
    expect(scrollState.userScrolledUp).toBe(false);

    unmount();
  });

  it("scrollToBottom with force=true calls the impl and clears userScrolledUp", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    const impl = vi.fn();
    let scrollTrigger: ((force?: boolean) => void) | null = null;
    let handleAtBottom: ((atBottom: boolean) => void) | null = null;
    let scrollState = { userScrolledUp: false };

    function TestComponent(): React.JSX.Element {
      const { scrollToBottom, handleAtBottomChange, userScrolledUp } = useChatScroll(messages, impl);
      scrollTrigger = scrollToBottom;
      handleAtBottom = handleAtBottomChange;
      scrollState.userScrolledUp = userScrolledUp;
      return <div />;
    }

    const { unmount } = render(<TestComponent />);

    act(() => {
      handleAtBottom!(false);
    });
    expect(scrollState.userScrolledUp).toBe(true);

    act(() => {
      scrollTrigger!(true);
    });
    expect(impl).toHaveBeenCalled();
    expect(scrollState.userScrolledUp).toBe(false);

    unmount();
  });

  it("scrollToBottom without force still calls impl", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    const impl = vi.fn();
    let scrollTrigger: ((force?: boolean) => void) | null = null;

    function TestComponent(): React.JSX.Element {
      const { scrollToBottom } = useChatScroll(messages, impl);
      scrollTrigger = scrollToBottom;
      return <div />;
    }

    const { unmount } = render(<TestComponent />);

    act(() => {
      scrollTrigger!();
    });
    expect(impl).toHaveBeenCalled();

    unmount();
  });

  it("resets userScrolledUp when user sends a new message", () => {
    let currentMessages: ChatMessage[] = [{ id: "1", role: "agent", content: "hi" }];
    let handleAtBottom: ((atBottom: boolean) => void) | null = null;
    let scrollState = { userScrolledUp: false };

    function TestComponent({ msgs }: { msgs: ChatMessage[] }): React.JSX.Element {
      const { userScrolledUp, handleAtBottomChange } = useChatScroll(msgs, vi.fn());
      handleAtBottom = handleAtBottomChange;
      scrollState.userScrolledUp = userScrolledUp;
      return <div />;
    }

    const { rerender, unmount } = render(<TestComponent msgs={currentMessages} />);

    act(() => {
      handleAtBottom!(false);
    });
    expect(scrollState.userScrolledUp).toBe(true);

    currentMessages = [...currentMessages, { id: "2", role: "user", content: "hello" }];
    act(() => {
      rerender(<TestComponent msgs={currentMessages} />);
    });

    expect(scrollState.userScrolledUp).toBe(false);
    unmount();
  });
});
