import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";
import type { Attachment } from "@shared/attachments";

type SessionMessageItem =
  | {
      kind: "user";
      id: number;
      content: string;
      timestamp: number;
      attachments?: Attachment[];
    }
  | {
      kind: "assistant";
      id: number;
      content: string;
      timestamp: number;
      attachments?: Attachment[];
    }
  | {
      kind: "reasoning";
      id: number;
      assistantId: number;
      text: string;
      timestamp: number;
    }
  | {
      kind: "tool_call";
      id: number;
      assistantId: number;
      callId: string;
      name: string;
      args: string;
      timestamp: number;
    }
  | {
      kind: "tool_result";
      id: number;
      callId: string;
      name: string;
      content: string;
      timestamp: number;
      attachments?: Attachment[];
    };

export function listSessions(
  profile?: string,
  limit?: number,
  offset?: number,
): Promise<
  Array<{
    id: string;
    source: string;
    startedAt: number;
    endedAt: number | null;
    messageCount: number;
    model: string;
    title: string | null;
    preview: string;
  }>
> {
  return invoke("list_sessions", { profile, limit, offset });
}
export function getRelatedSessionIds(
  sessionId: string,
  profile?: string,
): Promise<string[]> {
  return invoke("get_related_session_ids", { sessionId, profile });
}
export function getSessionMessages(
  sessionId: string,
  profile?: string,
): Promise<SessionMessageItem[]> {
  return invoke("get_session_messages", { sessionId, profile });
}
export function getSessionMessagesBefore(
  sessionId: string,
  beforeTimestamp: number,
  limit?: number,
  profile?: string,
): Promise<SessionMessageItem[]> {
  return invoke("get_session_messages_before", { sessionId, beforeTimestamp, limit, profile });
}
export function deleteSession(sessionId: string): Promise<void> {
  return invoke("delete_session", { sessionId });
}
export function deleteSessionChain(sessionId: string, profile?: string): Promise<number> {
  return invoke("delete_session_chain", { sessionId, profile });
}
export function listCachedSessions(
  profile?: string,
  limit?: number,
  offset?: number,
): Promise<
  Array<{
    id: string;
    title: string;
    startedAt: number;
    source: string;
    messageCount: number;
    model: string;
  }>
> {
  return invoke("list_cached_sessions", { profile, limit, offset });
}
export function syncSessionCache(profile?: string): Promise<
  Array<{
    id: string;
    title: string;
    startedAt: number;
    source: string;
    messageCount: number;
    model: string;
  }>
> {
  return invoke("sync_session_cache", { profile });
}
export function searchSessions(
  query: string,
  limit?: number,
  profile?: string,
): Promise<
  Array<{
    sessionId: string;
    title: string | null;
    startedAt: number;
    source: string;
    messageCount: number;
    model: string;
    snippet: string;
  }>
> {
  return invoke("search_sessions", { query, limit, profile });
}

export function listProfiles(): Promise<
  Array<{
    name: string;
    path: string;
    isDefault: boolean;
    isActive: boolean;
    model: string;
    provider: string;
    hasEnv: boolean;
    hasSoul: boolean;
    skillCount: number;
    gatewayRunning: boolean;
  }>
> {
  return invoke("list_profiles");
}
export function createProfile(name: string, clone: boolean): Promise<Result> {
  return invoke("create_profile", { name, clone });
}
export function deleteProfile(name: string): Promise<Result> {
  return invoke("delete_profile", { name });
}
export function setActiveProfile(name: string): Promise<boolean> {
  return invoke("set_active_profile", { name });
}
