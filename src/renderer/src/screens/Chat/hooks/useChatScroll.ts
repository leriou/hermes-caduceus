import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";

export function useChatScroll(
  messages: ChatMessage[],
  scrollToBottomImpl: () => void,
): {
  userScrolledUp: boolean;
  scrollToBottom: (force?: boolean) => void;
  handleAtBottomChange: (atBottom: boolean) => void;
} {
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const userScrolledUpRef = useRef(false);
  const prevMessageCountRef = useRef(messages.length);

  const handleAtBottomChange = useCallback((atBottom: boolean) => {
    userScrolledUpRef.current = !atBottom;
    setUserScrolledUp(!atBottom);
  }, []);

  const scrollToBottom = useCallback(
    (force?: boolean) => {
      if (force) {
        userScrolledUpRef.current = false;
        setUserScrolledUp(false);
      }
      scrollToBottomImpl();
    },
    [scrollToBottomImpl],
  );

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    const userJustSent =
      messages.length > prevCount &&
      messages[messages.length - 1]?.role === "user";
    if (userJustSent) {
      userScrolledUpRef.current = false;
      setUserScrolledUp(false);
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  return { userScrolledUp, scrollToBottom, handleAtBottomChange };
}
