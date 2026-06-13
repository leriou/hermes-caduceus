import { invoke } from "@tauri-apps/api/core";

export function getEnv(profile?: string): Promise<Record<string, string>> {
  return invoke("get_env", { profile });
}
export function setEnv(
  key: string,
  value: string,
  profile?: string,
): Promise<boolean> {
  return invoke("set_env", { key, value, profile });
}
export function getConfig(
  key: string,
  profile?: string,
): Promise<string | null> {
  return invoke("get_config", { key, profile });
}
export function setConfig(
  key: string,
  value: string,
  profile?: string,
): Promise<boolean> {
  return invoke("set_config", { key, value, profile });
}
export function getHermesHome(profile?: string): Promise<string> {
  return invoke("get_hermes_home", { profile });
}
export function readConfigYaml(
  profile?: string,
): Promise<{ content: string; path: string }> {
  return invoke("read_config_yaml", { profile });
}
export function writeConfigYaml(
  content: string,
  profile?: string,
): Promise<boolean> {
  return invoke("write_config_yaml", { content, profile });
}
