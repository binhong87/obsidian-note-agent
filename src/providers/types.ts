import type { Delta, Message, ToolCall } from "../types";
import type { ToolSchema } from "../tools/types";

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools: ToolSchema[];
  temperature?: number;
  signal?: AbortSignal;
  /** messages[0..cacheableBoundary] inclusive are treated as a stable prefix for caching.
   *  Providers that do not support caching ignore this field. */
  cacheableBoundary?: number;
}

export interface LLMProvider {
  id: string;
  chat(req: ChatRequest): AsyncIterable<Delta>;
}

export class ProviderError extends Error {
  constructor(public kind: "auth" | "rate" | "context" | "unavailable" | "unknown", msg: string) { super(msg); }
}

export type { Delta, Message, ToolCall };
