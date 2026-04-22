import { createOpenAICompatible } from "./openai-compat";
export const createQwen = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "qwen", apiKey,
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", baseUrl });
