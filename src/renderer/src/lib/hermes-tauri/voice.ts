import { invoke } from "@tauri-apps/api/core";
import { listenOnce } from "./_internal";

export function voiceModelStatus(): Promise<{
  downloaded: boolean;
  path: string;
  size: number;
}> {
  return invoke("voice_model_status");
}
export function voiceDownloadModel(): Promise<void> {
  return invoke("voice_download_model");
}
export function voiceStart(): Promise<void> {
  return invoke("voice_start");
}
export function voiceStop(): Promise<string> {
  return invoke("voice_stop");
}
export function onVoiceDownloadProgress(
  callback: (info: { percent: number }) => void,
): () => void {
  return listenOnce("voice-download-progress", callback);
}
export function onVoiceRecordingStopped(
  callback: () => void,
): () => void {
  return listenOnce("voice-recording-stopped", callback);
}
