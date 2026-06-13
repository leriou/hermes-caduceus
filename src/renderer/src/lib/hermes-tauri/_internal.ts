import { listen, type Event } from "@tauri-apps/api/event";

/**
 * Opaque JSON object returned by TUI gateway commands. The Rust side returns
 * `serde_json::Value` (untyped), so the exact shape depends on the Python
 * gateway response. Callers must narrow via type guards or casts.
 */
export type GatewayResult = Record<string, unknown>;

export function listenOnce<T = unknown>(
  event: string,
  callback: (payload: T) => void,
): () => void {
  let unlistenFn: (() => void) | null = null;
  let cleaned = false;
  const unlisten = listen<T>(event, (e: Event<T>) => {
    if (cleaned) return;
    try {
      callback(e.payload);
    } catch (err) {
      console.error("[hermes-tauri] listenOnce error:", err, "raw event:", e);
    }
  });
  unlisten.then((fn) => {
    unlistenFn = fn;
  });
  return () => {
    cleaned = true;
    if (unlistenFn) {
      unlistenFn();
    } else {
      unlisten.then((fn) => fn());
    }
  };
}
