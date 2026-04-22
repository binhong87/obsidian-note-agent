import { OpenAIProvider } from "./openai";

export interface OpenAICompatOptions {
  id: string;
  apiKey: string;
  defaultBaseUrl: string;
  baseUrl?: string;
  authHeader?: "authorization-bearer" | "custom";
  customHeaders?: Record<string, string>;
}

export function createOpenAICompatible(o: OpenAICompatOptions): OpenAIProvider {
  const p = new OpenAIProvider({ apiKey: o.apiKey, baseUrl: o.baseUrl || o.defaultBaseUrl });
  p.id = o.id;
  return p;
}
