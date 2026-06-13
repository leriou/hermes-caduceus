import { invoke } from "@tauri-apps/api/core";
import type { AppLocale } from "@shared/i18n/types";

export function getLocale(): Promise<AppLocale> {
  return invoke("get_locale");
}
export function setLocale(locale: AppLocale): Promise<AppLocale> {
  return invoke("set_locale", { locale });
}
