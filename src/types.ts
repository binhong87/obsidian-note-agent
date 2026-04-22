export type Mode = "ask" | "edit" | "scheduled";
export type ProviderId =
  | "openai" | "anthropic" | "ollama" | "openrouter"
  | "deepseek" | "qwen" | "kimi" | "zhipu" | "minimax";
export type Locale = "auto" | "en" | "zh-CN";

export interface ToolCall { id: string; name: string; args: Record<string, unknown>; }
export interface ToolResult { toolCallId: string; content: string; isError?: boolean; }

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface Delta {
  type: "text" | "tool_call" | "done" | "error";
  text?: string;
  toolCall?: ToolCall;
  error?: { kind: string; message: string };
}
