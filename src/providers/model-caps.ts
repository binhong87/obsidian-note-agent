import type { ProviderId } from "../types";

export interface ModelCaps {
  /** Context window size in tokens */
  contextWindow: number;
  supportsPromptCache: boolean;
}

const TABLE: Array<{ provider: ProviderId; match: RegExp; caps: ModelCaps }> = [
  { provider: "anthropic", match: /claude.*(sonnet|opus|haiku).*4/i, caps: { contextWindow: 200_000, supportsPromptCache: true } },
  { provider: "anthropic", match: /claude/i,                          caps: { contextWindow: 200_000, supportsPromptCache: true } },
  { provider: "openai",    match: /gpt-4\.1|gpt-4o/i,                caps: { contextWindow: 128_000, supportsPromptCache: false } },
  { provider: "openai",    match: /o1|o3/i,                           caps: { contextWindow: 200_000, supportsPromptCache: false } },
  { provider: "deepseek",  match: /./,                                caps: { contextWindow: 64_000,  supportsPromptCache: false } },
  { provider: "qwen",      match: /./,                                caps: { contextWindow: 128_000, supportsPromptCache: false } },
  { provider: "kimi",      match: /./,                                caps: { contextWindow: 128_000, supportsPromptCache: false } },
  { provider: "zhipu",     match: /./,                                caps: { contextWindow: 128_000, supportsPromptCache: false } },
  { provider: "zai",       match: /./,                                caps: { contextWindow: 128_000, supportsPromptCache: false } },
  { provider: "minimax",   match: /./,                                caps: { contextWindow: 245_000, supportsPromptCache: false } },
  { provider: "openrouter",match: /./,                                caps: { contextWindow: 128_000, supportsPromptCache: false } },
  { provider: "ollama",    match: /./,                                caps: { contextWindow: 32_000,  supportsPromptCache: false } },
  { provider: "lmstudio", match: /./,                                caps: { contextWindow: 32_000,  supportsPromptCache: false } },
];

const DEFAULT: ModelCaps = { contextWindow: 32_000, supportsPromptCache: false };

/** Look up capability metadata for a given provider + model string.
 *  Matches by substring (first match wins); falls back to DEFAULT. */
export function lookupModelCaps(provider: ProviderId, model: string): ModelCaps {
  for (const entry of TABLE) {
    if (entry.provider === provider && entry.match.test(model)) {
      return entry.caps;
    }
  }
  return DEFAULT;
}
