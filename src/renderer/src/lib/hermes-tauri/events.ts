import { listenOnce, type GatewayResult } from "./_internal";

export function onTuiEvent(
  callback: (params: { type: string; payload: GatewayResult; sid?: string }) => void,
): () => void {
  return listenOnce("tui-event", callback);
}
