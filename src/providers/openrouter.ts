import { createOpenAICompatible } from "./openai-compat";
export const createOpenRouter = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "openrouter", apiKey,
    defaultBaseUrl: "https://openrouter.ai/api/v1", baseUrl });
