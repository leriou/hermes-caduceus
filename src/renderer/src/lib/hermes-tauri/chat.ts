import { invoke } from "@tauri-apps/api/core";
import type { GatewayResult } from "./_internal";

export function abortChat(): Promise<void> {
  return invoke("abort_chat");
}
export function stageAttachment(
  sessionId: string,
  filename: string,
  base64Bytes: string,
): Promise<string> {
  return invoke("stage_attachment", { sessionId, filename, base64Bytes });
}
export function clearStagedAttachments(sessionId: string): Promise<void> {
  return invoke("clear_staged_attachments", { sessionId });
}

export function tuiSlashExec(sessionId: string, command: string): Promise<GatewayResult> {
  return invoke("tui_slash_exec", { sessionId, command });
}
export function tuiCommandDispatch(
  sessionId: string,
  name: string,
  arg?: string,
): Promise<GatewayResult> {
  return invoke("tui_command_dispatch", { sessionId, name, arg });
}
export function tuiCompress(
  sessionId: string,
  focusTopic?: string,
): Promise<GatewayResult> {
  return invoke("tui_compress", { sessionId, focusTopic });
}
export function tuiSetGoal(sessionId: string, goal: string): Promise<GatewayResult> {
  return invoke("tui_set_goal", { sessionId, goal });
}
export function tuiSetModel(sessionId: string, model: string): Promise<GatewayResult> {
  return invoke("tui_set_model", { sessionId, model });
}
export function tuiSteer(sessionId: string, text: string): Promise<GatewayResult> {
  return invoke("tui_steer", { sessionId, text });
}
export function tuiCreateSession(
  model?: string,
): Promise<{ session_id: string }> {
  return invoke("tui_create_session", { model });
}
export function tuiResumeSession(sessionId: string): Promise<GatewayResult> {
  return invoke("tui_resume_session", { sessionId });
}
export function tuiSessionHistory(sessionId: string): Promise<GatewayResult> {
  return invoke("tui_session_history", { sessionId });
}
export function tuiSubmitPrompt(
  sessionId: string,
  text: string,
  profile?: string,
): Promise<void> {
  return invoke("tui_submit_prompt", { sessionId, text, profile });
}
export function tuiInterrupt(sessionId: string): Promise<void> {
  return invoke("tui_interrupt", { sessionId });
}
export function tuiUndo(sessionId: string): Promise<void> {
  return invoke("tui_undo", { sessionId });
}
export function tuiToolsList(sessionId?: string): Promise<GatewayResult> {
  return invoke("tui_tools_list", { sessionId });
}
export function tuiToolsShow(name?: string, sessionId?: string): Promise<GatewayResult> {
  return invoke("tui_tools_show", { name, sessionId });
}
export function tuiToolsConfigure(
  name: string,
  enabled: boolean,
  sessionId?: string,
): Promise<GatewayResult> {
  return invoke("tui_tools_configure", { name, enabled, sessionId });
}
export function tuiApprovalRespond(
  sessionId: string,
  response: string,
  all?: boolean,
): Promise<GatewayResult> {
  return invoke("tui_approval_respond", { sessionId, response, all });
}
export function tuiClarifyRespond(
  sessionId: string,
  answer: string,
  requestId?: string,
): Promise<GatewayResult> {
  return invoke("tui_clarify_respond", { sessionId, answer, requestId });
}
export function tuiSudoRespond(
  sessionId: string,
  password: string,
  requestId?: string,
): Promise<GatewayResult> {
  return invoke("tui_sudo_respond", { sessionId, password, requestId });
}
export function tuiSecretRespond(
  sessionId: string,
  value: string,
  requestId?: string,
): Promise<GatewayResult> {
  return invoke("tui_secret_respond", { sessionId, value, requestId });
}
export function tuiSessionTitle(
  sessionId: string,
): Promise<{ title: string; session_key: string }> {
  return invoke("tui_session_title", { sessionId });
}
export function tuiSessionStatus(sessionId: string): Promise<GatewayResult> {
  return invoke("tui_session_status", { sessionId });
}
export function tuiSessionActiveList(currentSessionId: string): Promise<GatewayResult> {
  return invoke("tui_session_active_list", { currentSessionId });
}
export function tuiSessionUsage(sessionId: string): Promise<GatewayResult> {
  return invoke("tui_session_usage", { sessionId });
}
export function tuiSessionBranch(
  sessionId: string,
  name?: string,
): Promise<GatewayResult> {
  return invoke("tui_session_branch", { sessionId, name });
}
export function tuiCompleteSlash(sessionId: string, prefix: string): Promise<GatewayResult> {
  return invoke("tui_complete_slash", { sessionId, text: prefix });
}
export function tuiCommandsCatalog(): Promise<GatewayResult> {
  return invoke("tui_commands_catalog");
}
export function voiceTts(text: string): Promise<GatewayResult> {
  return invoke("voice_tts", { text });
}
