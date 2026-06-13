export const DEFAULT_LOCAL_BASE_URL = "http://localhost:1234/v1";


export const PROVIDERS = {
  // Ordered for the Providers / model-picker dropdown.  Each value must
  // match a provider name `hermes-agent` recognises (see
  // hermes_cli/auth.py::resolve_provider — _PROVIDER_ALIASES + PROVIDER_REGISTRY)
  // so the gateway routes correctly when the user picks the entry.  The
  // catch-all `custom` stays last for unlisted OpenAI-compatible endpoints.
  options: [
    { value: "auto", label: "constants.autoDetect" },
    // Aggregators
    { value: "openrouter", label: "constants.openrouterName" },
    // First-party API providers
    { value: "anthropic", label: "constants.anthropicName" },
    { value: "openai", label: "constants.openaiName" },
    { value: "openai-codex", label: "constants.openaiCodexName" },
    { value: "google", label: "constants.googleName" },
    { value: "xai", label: "constants.xaiName" },
    { value: "mistral", label: "Mistral" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "groq", label: "Groq" },
    { value: "together", label: "Together AI" },
    { value: "fireworks", label: "Fireworks AI" },
    { value: "cerebras", label: "Cerebras" },
    { value: "perplexity", label: "Perplexity" },
    { value: "huggingface", label: "Hugging Face" },
    { value: "nvidia", label: "NVIDIA NIM" },
    { value: "zai", label: "Z.ai / GLM" },
    { value: "qwen", label: "Qwen" },
    { value: "minimax", label: "MiniMax" },
    { value: "nous", label: "constants.nousName" },
    // Subscription / OAuth plans
    // openai-codex is listed once above (first-party group) via #102 —
    // not repeated here to avoid a duplicate <option> value.
    { value: "xai-oauth", label: "xAI Grok (OAuth)" },
    { value: "qwen-oauth", label: "Qwen (OAuth)" },
    { value: "google-gemini-cli", label: "Gemini (CLI OAuth)" },
    { value: "minimax-oauth", label: "MiniMax (OAuth)" },
    { value: "kimi-coding", label: "Kimi (Coding Plan)" },
    // Catch-all for any other OpenAI-compatible endpoint or local LLM
    { value: "custom", label: "constants.customOpenAICompatibleName" },
  ],

  labels: {
    openrouter: "constants.openrouterName",
    anthropic: "constants.anthropicName",
    openai: "constants.openaiName",
    "openai-codex": "constants.openaiCodexName",
    google: "constants.googleName",
    xai: "constants.xaiName",
    mistral: "Mistral",
    deepseek: "DeepSeek",
    groq: "Groq",
    together: "Together AI",
    fireworks: "Fireworks AI",
    cerebras: "Cerebras",
    perplexity: "Perplexity",
    huggingface: "Hugging Face",
    nvidia: "NVIDIA NIM",
    zai: "Z.ai / GLM",
    qwen: "Qwen",
    minimax: "MiniMax",
    nous: "constants.nousName",
    "xai-oauth": "xAI Grok (OAuth)",
    "qwen-oauth": "Qwen (OAuth)",
    "google-gemini-cli": "Gemini (CLI OAuth)",
    "minimax-oauth": "MiniMax (OAuth)",
    "kimi-coding": "Kimi (Coding Plan)",
    custom: "OpenAI Compatible / Local",
  } as Record<string, string>,

  setup: [
    {
      id: "openrouter",
      name: "constants.openrouterName",
      desc: "constants.openrouterDesc",
      tag: "constants.openrouterTag",
      envKey: "OPENROUTER_API_KEY",
      url: "https://openrouter.ai/keys",
      placeholder: "sk-or-v1-...",
      configProvider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      needsKey: true,
    },
    {
      id: "anthropic",
      name: "constants.anthropicName",
      desc: "constants.anthropicDesc",
      tag: "",
      envKey: "ANTHROPIC_API_KEY",
      url: "https://console.anthropic.com/settings/keys",
      placeholder: "sk-ant-...",
      configProvider: "anthropic",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "openai",
      name: "constants.openaiName",
      desc: "constants.openaiDesc",
      tag: "",
      envKey: "OPENAI_API_KEY",
      url: "https://platform.openai.com/api-keys",
      placeholder: "sk-...",
      // Routed through the `custom` provider with an explicit base_url:
      // hermes-agent's resolve_provider does not recognise a bare `openai`
      // provider id (issue #294). The `custom` + api.openai.com path is
      // accepted, and the OpenAI key is picked up via the known-host
      // base-URL mapping.
      configProvider: "custom",
      baseUrl: "https://api.openai.com/v1",
      needsKey: true,
    },
    {
      id: "openai-codex",
      name: "constants.openaiCodexName",
      desc: "constants.openaiCodexDesc",
      tag: "constants.openaiCodexTag",
      envKey: "",
      url: "",
      placeholder: "",
      configProvider: "openai-codex",
      baseUrl: "",
      needsKey: false,
    },
    {
      id: "google",
      name: "constants.googleName",
      desc: "constants.googleDesc",
      tag: "",
      envKey: "GOOGLE_API_KEY",
      url: "https://aistudio.google.com/app/apikey",
      placeholder: "AIza...",
      configProvider: "google",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "xai",
      name: "constants.xaiName",
      desc: "constants.xaiDesc",
      tag: "",
      envKey: "XAI_API_KEY",
      url: "https://console.x.ai",
      placeholder: "xai-...",
      configProvider: "xai",
      baseUrl: "",
      needsKey: true,
    },
    {
      id: "nous",
      name: "constants.nousName",
      desc: "constants.nousDesc",
      tag: "constants.nousTag",
      envKey: "",
      url: "",
      placeholder: "",
      configProvider: "nous",
      baseUrl: "",
      needsKey: false,
    },
    {
      id: "local",
      name: "constants.localName",
      desc: "constants.localDesc",
      tag: "constants.localTag",
      envKey: "",
      url: "",
      placeholder: "sk-...",
      configProvider: "custom",
      baseUrl: DEFAULT_LOCAL_BASE_URL,
      needsKey: false,
    },
  ],
};

// Subscription / OAuth-plan providers — these authenticate through an
// interactive browser login (`hermes auth add <id> --type oauth`) rather
// than a static API key. The Providers screen renders a "Sign in" card
// for each. Values must match hermes-agent's provider registry.
export interface OAuthProviderDef {
  id: string;
  name: string;
  desc: string;
}

export const OAUTH_PROVIDERS: OAuthProviderDef[] = [
  {
    id: "openai-codex",
    name: "ChatGPT (Codex Plan)",
    desc: "providers.oauth.codexDesc",
  },
  {
    id: "xai-oauth",
    name: "xAI Grok (OAuth)",
    desc: "providers.oauth.xaiDesc",
  },
  { id: "qwen-oauth", name: "Qwen (OAuth)", desc: "providers.oauth.qwenDesc" },
  {
    id: "google-gemini-cli",
    name: "Gemini (CLI OAuth)",
    desc: "providers.oauth.geminiDesc",
  },
  {
    id: "minimax-oauth",
    name: "MiniMax (OAuth)",
    desc: "providers.oauth.minimaxDesc",
  },
];
