import { invoke } from "@tauri-apps/api/core";
import type { InstallStatus, InstallProgress, Result } from "@shared/api-types";
import { listenOnce } from "./_internal";

export function checkInstall(): Promise<InstallStatus> {
  return invoke("check_install");
}
export function verifyInstall(): Promise<boolean> {
  return invoke("verify_install");
}
export function startInstall(): Promise<Result> {
  return invoke("start_install");
}
export function inspectInstallTarget(): Promise<{
  hermesHome: string;
  repoPath: string;
  state: "fresh" | "update" | "replace";
}> {
  return invoke("inspect_install_target");
}
export function validateHermesHome(dir: string): Promise<boolean> {
  return invoke("validate_hermes_home", { dir });
}
export function adoptHermesHome(dir: string): Promise<boolean> {
  return invoke("adopt_hermes_home", { dir });
}
export function quitApp(): Promise<void> {
  return invoke("quit_app");
}
export function onInstallProgress(
  callback: (progress: InstallProgress) => void,
): () => void {
  return listenOnce("installprogress", callback);
}
