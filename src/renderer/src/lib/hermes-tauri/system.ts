import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";

export function copyToClipboard(text: string): Promise<void> {
  return invoke("copy_to_clipboard", { text });
}
export function getPathForFile(file: File): string {
  // Tauri augments the native File with a `path` string on macOS/Windows/Linux.
  return (file as File & { path?: string }).path || "";
}
export function openExternal(url: string): Promise<void> {
  return invoke("open_external", { url });
}
export function selectFolder(): Promise<string | null> {
  return invoke("select_folder");
}
export function selectHermesFolder(): Promise<string | null> {
  return invoke("select_hermes_folder");
}
export function readLogs(
  logFile?: string,
  lines?: number,
): Promise<{ content: string; path: string }> {
  return invoke("read_logs", { logFile, lines });
}
export function getPlatformEnabled(
  profile?: string,
): Promise<Record<string, boolean>> {
  return invoke("get_platform_enabled", { profile });
}
export function setPlatformEnabled(
  platform: string,
  enabled: boolean,
  profile?: string,
): Promise<boolean> {
  return invoke("set_platform_enabled", { platform, enabled, profile });
}
export function getPluginMetrics(
  name?: string,
  profile?: string,
): Promise<Array<Record<string, unknown>>> {
  return invoke("get_plugin_metrics", { name: name || null, profile });
}
export function getCredentialPool(
  profile?: string,
): Promise<Record<string, Array<{ key: string; label: string }>>> {
  return invoke("get_credential_pool", { profile });
}
export function setCredentialPool(
  provider: string,
  entries: Array<{ key: string; label: string }>,
  profile?: string,
): Promise<boolean | Result> {
  return invoke("set_credential_pool", { provider, entries, profile });
}
