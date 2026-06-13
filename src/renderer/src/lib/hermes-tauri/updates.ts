import { invoke } from "@tauri-apps/api/core";
import { listenOnce } from "./_internal";

export function checkForUpdates(): Promise<string | null> {
  return invoke("check_for_updates");
}
export function downloadUpdate(): Promise<boolean> {
  return invoke("download_update");
}
export function installUpdate(): Promise<void> {
  return invoke("install_update");
}
export function getAppVersion(): Promise<string> {
  return invoke("get_app_version");
}
export function getBuildInfo(): Promise<{
  version: string;
  gitCommit: string;
  buildTimestamp: string;
  buildTimeDisplay: string;
  hermesHome: string;
  pythonPath: string;
  repoPath: string;
  appDataDir: string;
}> {
  return invoke("get_build_info");
}
export function onUpdateAvailable(
  callback: (info: { version: string; releaseNotes: string }) => void,
): () => void {
  return listenOnce("updateavailable", callback);
}
export function onUpdateDownloadProgress(
  callback: (info: { percent: number }) => void,
): () => void {
  return listenOnce("updatedownloadprogress", callback);
}
export function onUpdateDownloaded(callback: () => void): () => void {
  return listenOnce("updatedownloaded", callback);
}
export function onUpdateError(callback: (message: string) => void): () => void {
  return listenOnce("updateerror", callback);
}
export function onMenuNewChat(callback: () => void): () => void {
  return listenOnce("menunewchat", callback);
}
export function onMenuSearchSessions(callback: () => void): () => void {
  return listenOnce("menusearchsessions", callback);
}
