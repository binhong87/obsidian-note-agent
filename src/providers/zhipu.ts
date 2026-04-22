import { createOpenAICompatible } from "./openai-compat";
export const createZhipu = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "zhipu", apiKey,
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4", baseUrl });
