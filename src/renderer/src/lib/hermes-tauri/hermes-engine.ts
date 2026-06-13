import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";

export function getHermesVersion(): Promise<string | null> {
  return invoke("get_hermes_version");
}
export function refreshHermesVersion(): Promise<string | null> {
  return invoke("refresh_hermes_version");
}
export function runHermesDoctor(): Promise<string> {
  return invoke("run_hermes_doctor");
}
export function runHermesUpdate(): Promise<Result> {
  return invoke("run_hermes_update");
}
export function runHermesBackup(
  profile?: string,
): Promise<{ success: boolean; path?: string; error?: string }> {
  return invoke("run_hermes_backup", { profile });
}
export function runHermesImport(
  archivePath: string,
  profile?: string,
): Promise<Result> {
  return invoke("run_hermes_import", { archivePath, profile });
}
export function runHermesDump(): Promise<string> {
  return invoke("run_hermes_dump");
}
