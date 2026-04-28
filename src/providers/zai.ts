import { createOpenAICompatible } from "./openai-compat";
export const createZai = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "zai", apiKey,
    defaultBaseUrl: "https://open.z.ai/api/paas/v4", baseUrl });
