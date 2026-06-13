import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";

export function getToolsets(
  profile?: string,
): Promise<
  Array<{
    key: string;
    label: string;
    description: string;
    enabled: boolean;
    source: string;
  }>
> {
  return invoke("get_toolsets", { profile });
}
export function setToolsetEnabled(
  key: string,
  enabled: boolean,
  profile?: string,
): Promise<boolean | Result> {
  return invoke("set_toolset_enabled", { key, enabled, profile });
}

export function listInstalledSkills(
  profile?: string,
): Promise<
  Array<{ name: string; entry_name: string; category: string; description: string; path: string; usage_count?: number }>
> {
  return invoke("list_installed_skills", { profile });
}
export function listBundledSkills(profile?: string): Promise<
  Array<{
    name: string;
    entry_name: string;
    description: string;
    category: string;
    source: string;
    installed: boolean;
    usage_count?: number;
  }>
> {
  return invoke("list_bundled_skills", { profile });
}
export function getSkillContent(skillPath: string): Promise<string> {
  return invoke("get_skill_content", { path: skillPath });
}
export function installSkill(
  identifier: string,
  profile?: string,
): Promise<Result> {
  return invoke("install_skill", { identifier, profile });
}
export function uninstallSkill(
  name: string,
  profile?: string,
): Promise<Result> {
  return invoke("uninstall_skill", { name, profile });
}

export function getPlugins(
  profile?: string,
): Promise<
  Array<{
    name: string;
    description: string;
    enabled: boolean;
    version?: string;
    source?: string;
  }>
> {
  return invoke("get_plugins", { profile });
}
export function setPluginEnabled(
  name: string,
  enabled: boolean,
  profile?: string,
): Promise<Result> {
  return invoke("set_plugin_enabled", { name, enabled, profile });
}
