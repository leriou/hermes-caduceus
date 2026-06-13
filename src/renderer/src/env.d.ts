/// <reference types="vite/client" />

declare module "react-syntax-highlighter/dist/esm/styles/prism/*";
declare module "react-syntax-highlighter/dist/esm/languages/prism/*";

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  hermesAPI: typeof import("./lib/hermes-tauri");
  __TAURI_INTERNALS__?: unknown;
}

interface GPUAdapterInfo {
  vendor?: string;
  architecture?: string;
  description?: string;
}

interface Navigator {
  readonly gpu?: {
    requestAdapter(): Promise<{
      requestAdapterInfo?(): Promise<GPUAdapterInfo>;
      info?: GPUAdapterInfo;
    } | null>;
  };
}
