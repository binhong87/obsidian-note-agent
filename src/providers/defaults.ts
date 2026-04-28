import type { ProviderId } from "../types";

export interface ProviderDefault {
  baseUrl: string;
  model: string;
}

export const PROVIDER_DEFAULTS: Record<ProviderId, ProviderDefault> = {
  deepseek:   { baseUrl: "https://api.deepseek.com",                             model: "deepseek-v4-pro" },
  qwen:       { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",    model: "qwen-plus" },
  kimi:       { baseUrl: "https://api.moonshot.cn/v1",                           model: "moonshot-v1-8k" },
  zhipu:      { baseUrl: "https://open.bigmodel.cn/api/paas/v4",                 model: "glm-4.7" },
  zai:        { baseUrl: "https://open.z.ai/api/paas/v4",                       model: "glm-4.7" },
  minimax:    { baseUrl: "https://api.minimax.chat/v1",                          model: "MiniMax-Text-01" },
  openai:     { baseUrl: "https://api.openai.com/v1",                            model: "gpt-4o-mini" },
  anthropic:  { baseUrl: "https://api.anthropic.com",                            model: "claude-sonnet-4-6" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1",                         model: "openai/gpt-4o-mini" },
  ollama:     { baseUrl: "http://localhost:11434",                               model: "llama3.1" },
  lmstudio:   { baseUrl: "http://localhost:1234/v1",                            model: "local-model" },
  custom:     { baseUrl: "",                                                     model: "" },
};

export function defaultProfile(id: ProviderId) {
  const d = PROVIDER_DEFAULTS[id];
  return { apiKey: "", baseUrl: "", model: d.model };
}
