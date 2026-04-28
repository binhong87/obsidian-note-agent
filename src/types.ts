export type Mode = "ask" | "edit" | "scheduled";
export type ProviderId =
  | "deepseek" | "qwen" | "kimi" | "zhipu" | "minimax"
  | "openai" | "anthropic" | "openrouter" | "ollama"
  | "custom";
export type Locale = "auto" | "en" | "zh-CN";

export interface ToolCall { id: string; name: string; args: Record<string, unknown>; }
export interface ToolResult { toolCallId: string; content: string; isError?: boolean; }

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  reasoningContent?: string;
}

export interface Delta {
  type: "text" | "tool_call" | "done" | "error" | "reasoning";
  text?: string;
  toolCall?: ToolCall;
  error?: { kind: string; message: string };
}
