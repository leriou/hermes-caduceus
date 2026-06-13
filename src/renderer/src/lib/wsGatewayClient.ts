import type { NormalizedTuiEvent } from "@renderer/screens/Chat/tuiEvents";

export type WsConnectionState = "connected" | "disconnected" | "reconnecting" | "unavailable";

export interface WsGatewayClient {
  connect(): Promise<boolean>;
  call(method: string, params: Record<string, unknown>): Promise<unknown>;
  onEvent(callback: (event: NormalizedTuiEvent) => void): () => void;
  onConnectionChange(callback: (state: WsConnectionState) => void): () => void;
  close(): void;
  isConnected(): boolean;
  getMode(): "ws" | "stdio";
}

