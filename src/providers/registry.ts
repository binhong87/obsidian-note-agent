import type { LLMProvider } from "./types";
import type { ProviderId } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { OllamaProvider } from "./ollama";
import { createDeepSeek } from "./deepseek";
import { createQwen } from "./qwen";
import { createKimi } from "./kimi";
import { createZhipu } from "./zhipu";
import { createMiniMax } from "./minimax";
import { createOpenRouter } from "./openrouter";

export interface ProviderConfig { apiKey: string; baseUrl?: string; }

export function createProvider(id: ProviderId, cfg: ProviderConfig): LLMProvider {
  switch (id) {
    case "openai": return new OpenAIProvider({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    case "anthropic": return new AnthropicProvider({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    case "ollama": return new OllamaProvider({ baseUrl: cfg.baseUrl || "http://localhost:11434" });
    case "openrouter": return createOpenRouter(cfg.apiKey, cfg.baseUrl);
    case "deepseek": return createDeepSeek(cfg.apiKey, cfg.baseUrl);
    case "qwen": return createQwen(cfg.apiKey, cfg.baseUrl);
    case "kimi": return createKimi(cfg.apiKey, cfg.baseUrl);
    case "zhipu": return createZhipu(cfg.apiKey, cfg.baseUrl);
    case "minimax": return createMiniMax(cfg.apiKey, cfg.baseUrl);
    default: throw new Error(`unknown provider: ${id}`);
  }
}

export function listProviderIds(): ProviderId[] {
  return ["openai","anthropic","ollama","openrouter","deepseek","qwen","kimi","zhipu","minimax"];
}
