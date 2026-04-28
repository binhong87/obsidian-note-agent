import { createOpenAICompatible } from "./openai-compat";
export const createLMStudio = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "lmstudio", apiKey,
    defaultBaseUrl: "http://localhost:1234/v1", baseUrl });
