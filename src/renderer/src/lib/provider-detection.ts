export function detectProviderFromUrl(rawUrl: string): string | null {
  const url = rawUrl.trim().toLowerCase();
  if (!url) return null;

  // Hosted providers — match by hostname.
  if (/(^|\/\/)openrouter\.ai(\/|:|$)/.test(url)) return "openrouter";
  if (/(^|\/\/)api\.anthropic\.com(\/|:|$)/.test(url)) return "anthropic";
  if (/(^|\/\/)api\.openai\.com(\/|:|$)/.test(url)) return "openai";
  if (/(^|\/\/)generativelanguage\.googleapis\.com(\/|:|$)/.test(url))
    return "google";
  if (/(^|\/\/)api\.x\.ai(\/|:|$)/.test(url)) return "xai";
  if (/api\.groq\.com/.test(url)) return "groq";
  if (/api\.deepseek\.com/.test(url)) return "deepseek";
  if (/api\.together\.xyz/.test(url)) return "together";
  if (/api\.fireworks\.ai/.test(url)) return "fireworks";
  if (/api\.cerebras\.ai/.test(url)) return "cerebras";
  if (/api\.mistral\.ai/.test(url)) return "mistral";
  if (/api\.perplexity\.ai/.test(url)) return "perplexity";
  if (/huggingface\.co/.test(url)) return "huggingface";
  if (/nousresearch\.com/.test(url)) return "nous";
  if (/dashscope(-intl)?\.aliyuncs\.com/.test(url)) return "qwen";
  if (/api\.minimax(i)?\.(chat|com)/.test(url)) return "minimax";

  // Private / loopback → custom (self-hosted OpenAI-compatible endpoint)
  const host = extractHost(url);
  if (host && isPrivateOrLoopback(host)) return "custom";

  // Well-known local-LLM ports — Ollama 11434, LM Studio 1234, vLLM 8000, llama.cpp 8080
  if (/:(11434|1234|8000|8080)(\/|$)/.test(url)) return "custom";

  return null;
}

function extractHost(url: string): string | null {
  const stripped = url.replace(/^https?:\/\//, "").split("/")[0];
  if (!stripped) return null;
  return stripped.split(":")[0] || null;
}

function isPrivateOrLoopback(host: string): boolean {
  if (host === "localhost") return true;
  if (host === "127.0.0.1" || host === "::1" || host === "[::1]") return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m) {
    const second = parseInt(m[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (/\.local$/.test(host)) return true;
  return false;
}
