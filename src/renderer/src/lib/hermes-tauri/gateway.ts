import { invoke } from "@tauri-apps/api/core";
import type { HomeHealthSummary } from "@shared/api-types";

export function startGateway(profile?: string): Promise<boolean> {
  return invoke("start_gateway", { profile });
}
export function stopGateway(profile?: string): Promise<boolean> {
  return invoke("stop_gateway", { profile });
}
export function gatewayStatus(): Promise<boolean> {
  return invoke("gateway_status");
}
export function homeHealthSummary(profile?: string): Promise<HomeHealthSummary> {
  return invoke("home_health_summary", { profile });
}
export function copyDiagnostics(): Promise<string> {
  return invoke("copy_diagnostics");
}
export function runtimeHealth(): Promise<{
  status: "Stopped" | "Starting" | "Ready" | "Reconnecting" | "Failed";
  restartCount: number;
  maxRestarts: number;
  activeSessionId: string | null;
  lastError: string | null;
  lastReadyAt: number | null;
  pendingRequests: number;
  paths: {
    python: string;
    pythonExists: boolean;
    repo: string;
    repoExists: boolean;
    home: string;
    homeExists: boolean;
  } | null;
}> {
  return invoke("runtime_health");
}
