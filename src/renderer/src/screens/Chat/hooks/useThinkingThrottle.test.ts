import { renderHook, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useThinkingThrottle } from "./useThinkingThrottle";

describe("useThinkingThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes when char threshold reached", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("a".repeat(100));
    expect(onFlush).toHaveBeenCalledWith("a".repeat(100));
  });

  it("flushes on time threshold", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("short");
    expect(onFlush).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onFlush).toHaveBeenCalledWith("short");
  });

  it("forceFlush flushes remaining buffer", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("partial");
    result.current.forceFlush();
    expect(onFlush).toHaveBeenCalledWith("partial");
  });

  it("resets timer on new push after flush", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useThinkingThrottle({ onFlush }));
    result.current.push("a".repeat(100));
    expect(onFlush).toHaveBeenCalledTimes(1);
    result.current.push("next");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onFlush).toHaveBeenCalledWith("next");
  });
});
