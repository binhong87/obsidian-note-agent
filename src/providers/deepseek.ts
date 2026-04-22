import { createOpenAICompatible } from "./openai-compat";
export const createDeepSeek = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "deepseek", apiKey, defaultBaseUrl: "https://api.deepseek.com/v1", baseUrl });
