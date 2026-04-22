import { createOpenAICompatible } from "./openai-compat";
export const createKimi = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "kimi", apiKey,
    defaultBaseUrl: "https://api.moonshot.cn/v1", baseUrl });
