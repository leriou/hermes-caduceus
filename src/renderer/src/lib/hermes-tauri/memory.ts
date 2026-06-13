import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";

export function readMemory(profile?: string): Promise<{
  memory: {
    content: string;
    exists: boolean;
    lastModified: number | null;
    entries: unknown[];
    charCount: number;
    charLimit: number;
  };
  user: {
    content: string;
    exists: boolean;
    lastModified: number | null;
    charCount: number;
    charLimit: number;
  };
  stats: { totalSessions: number; totalMessages: number };
}> {
  return invoke("read_memory", { profile });
}
export function addMemoryEntry(
  content: string,
  profile?: string,
): Promise<Result> {
  return invoke("add_memory_entry", { content, profile });
}
export function updateMemoryEntry(
  index: number,
  content: string,
  profile?: string,
): Promise<Result> {
  return invoke("update_memory_entry", { index, content, profile });
}
export function removeMemoryEntry(
  index: number,
  profile?: string,
): Promise<boolean | Result> {
  return invoke("remove_memory_entry", { index, profile });
}
export function writeUserProfile(
  content: string,
  profile?: string,
): Promise<Result> {
  return invoke("write_user_profile", { content, profile });
}
export function writeMemory(
  content: string,
  profile?: string,
): Promise<Result> {
  return invoke("write_memory", { content, profile });
}
export function readSoul(profile?: string): Promise<string> {
  return invoke("read_soul", { profile });
}
export function writeSoul(
  content: string,
  profile?: string,
): Promise<boolean | Result> {
  return invoke("write_soul", { content, profile });
}
export function resetSoul(profile?: string): Promise<string> {
  return invoke("reset_soul", { profile });
}
export function discoverMemoryProviders(profile?: string): Promise<
  Array<{
    name: string;
    description: string;
    installed: boolean;
    active: boolean;
    envVars: string[];
  }>
> {
  return invoke("discover_memory_providers", { profile });
}
export function listMcpServers(
  profile?: string,
): Promise<
  Array<{ name: string; type: string; enabled: boolean; detail: string }>
> {
  return invoke("list_mcp_servers", { profile });
}
