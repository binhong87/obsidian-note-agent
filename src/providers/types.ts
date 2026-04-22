import type { Delta, Message, ToolCall } from "../types";
import type { ToolSchema } from "../tools/types";

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools: ToolSchema[];
  temperature?: number;
  signal?: AbortSignal;
}

export interface LLMProvider {
  id: string;
  chat(req: ChatRequest): AsyncIterable<Delta>;
}

export class ProviderError extends Error {
  constructor(public kind: "auth" | "rate" | "context" | "unavailable" | "unknown", msg: string) { super(msg); }
}

export type { Delta, Message, ToolCall };
