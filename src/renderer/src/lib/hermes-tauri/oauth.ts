import { invoke } from "@tauri-apps/api/core";
import type { Result } from "@shared/api-types";
import { listenOnce } from "./_internal";

export function oauthLogin(
  provider: string,
  profile?: string,
): Promise<Result> {
  return invoke("oauth_login", { provider, profile });
}
export function cancelOAuthLogin(): Promise<boolean> {
  return invoke("cancel_oauth_login");
}
export function onOAuthLoginProgress(
  callback: (chunk: string) => void,
): () => void {
  return listenOnce("oauthloginprogress", callback);
}
