import { createOpenAICompatible } from "./openai-compat";
export const createMiniMax = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "minimax", apiKey,
    defaultBaseUrl: "https://api.minimax.chat/v1", baseUrl });
