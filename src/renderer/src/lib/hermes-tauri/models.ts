import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";
import type {
  ModelConfigStore,
  ClientProvider,
  ClientModel,
  RegisterProviderInput,
  SaveModelInput,
} from "../model-types";

export function getModelConfig(
  profile?: string,
): Promise<{ provider: string; model: string; baseUrl: string; maxTokens?: number }> {
  return invoke("get_model_config", { profile });
}
export function getRoutingConfig(
  profile?: string,
): Promise<{
  defaultModel?: string;
  defaultProvider?: string;
  defaultBaseUrl?: string;
  provider?: string;
  baseUrl?: string;
  maxTokens?: number;
  fallbacks?: Array<{ model: string; provider: string }>;
  fallbackProviders?: Array<{ model: string; provider: string }>;
}> {
  return invoke("get_routing_config", { profile });
}
export function setModelConfig(
  provider: string,
  model: string,
  baseUrl: string,
  profile?: string,
  maxTokens?: number,
): Promise<boolean> {
  return invoke("set_model_config", {
    provider,
    model,
    baseUrl,
    profile,
    maxTokens,
  });
}
export function discoverProviderModels(
  provider: string,
  baseUrl?: string,
  apiKey?: string,
  profile?: string,
): Promise<{
  models: string[];
  status: "ok" | "no-key" | "unsupported" | "unknown-host";
  cached: boolean;
}> {
  return invoke("discover_provider_models", {
    provider,
    baseUrl,
    apiKey,
    profile,
  });
}
export function listModels(profile?: string): Promise<
  Array<{
    id: string;
    name: string;
    provider: string;
    model: string;
    baseUrl: string;
    createdAt?: number;
    aliases?: string[];
  }>
> {
  return invoke("list_models", { profile });
}
export function listTemplates(): Promise<unknown[]> {
  return invoke("list_templates");
}
export function getModelAliases(profile?: string): Promise<
  Array<{
    name: string;
    model: string;
    provider: string;
    baseUrl: string;
    contextLength?: number;
  }>
> {
  return invoke("get_model_aliases", { profile });
}
export function addModel(
  name: string,
  provider: string,
  model: string,
  baseUrl: string,
  alias?: string,
  profile?: string,
): Promise<
  | Result
  | {
      id: string;
      name: string;
      provider: string;
      model: string;
      baseUrl: string;
      createdAt: number;
    }
> {
  return invoke("add_model", {
    name,
    provider,
    model,
    baseUrl,
    alias,
    profile,
  });
}
export function removeModel(
  id: string,
  profile?: string,
): Promise<boolean | Result> {
  return invoke("remove_model", { id, profile });
}
export function updateModel(
  id: string,
  fields: Record<string, string>,
  profile?: string,
): Promise<boolean | Result> {
  return invoke("update_model", { id, fields, profile });
}

export function checkNeedsMigration(profile?: string): Promise<{
  needsMigration: boolean;
  legacyModelCount: number;
  providerCount: number;
}> {
  return invoke("check_needs_migration", { profile });
}
export function runModelMigration(profile?: string): Promise<ModelConfigStore> {
  return invoke("run_model_migration", { profile });
}
export function readModelStore(profile?: string): Promise<ModelConfigStore> {
  return invoke("read_model_store", { profile });
}
export function registerProvider(
  input: RegisterProviderInput,
  profile?: string,
): Promise<ClientProvider> {
  return invoke("register_provider", { input, profile });
}
export function unregisterProvider(
  providerId: string,
  profile?: string,
): Promise<boolean> {
  return invoke("unregister_provider", { providerId, profile });
}
export function saveModel(
  input: SaveModelInput,
  profile?: string,
): Promise<ClientModel> {
  return invoke("save_model", { input, profile });
}
export function deleteModel(
  modelId: string,
  providerId: string,
  profile?: string,
): Promise<boolean> {
  return invoke("delete_model", { modelId, providerId, profile });
}
