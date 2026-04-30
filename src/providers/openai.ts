import type { ChatRequest, Delta, LLMProvider, Message, ToolCall } from "./types";
import { httpSSE } from "./http";
import type { HttpOptions } from "./http";

export interface OpenAIConfig { apiKey: string; baseUrl?: string; }
type SSEIter = (o: HttpOptions) => AsyncIterable<{ data: string }>;

export class OpenAIProvider implements LLMProvider {
  id = "openai";
  constructor(private cfg: OpenAIConfig, private sseFn: SSEIter = httpSSE) {}

  async *chat(req: ChatRequest): AsyncIterable<Delta> {
    const url = (this.cfg.baseUrl || "https://api.openai.com/v1") + "/chat/completions";
    const body = {
      model: req.model,
      messages: req.messages.map(m => this.toOpenAIMsg(m)),
      tools: req.tools.length ? req.tools.map(t => ({ type: "function", function: t })) : undefined,
      stream: true,
      temperature: req.temperature,
    };
    const iter = this.sseFn({
      url, method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify(body), signal: req.signal,
    });
    const pending: Record<number, { id?: string; name: string; args: string }> = {};
    for await (const ev of iter) {
      if (ev.data === "[DONE]") break;
      interface OpenAIChunk {
        choices?: Array<{ delta?: { reasoning_content?: string; content?: string; tool_calls?: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }> } }>;
      }
      let obj: OpenAIChunk; try { obj = JSON.parse(ev.data) as OpenAIChunk; } catch { continue; }
      const delta = obj.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.reasoning_content) yield { type: "reasoning", text: delta.reasoning_content };
      if (delta.content) yield { type: "text", text: delta.content };
      for (const tc of delta.tool_calls ?? []) {
        const i = tc.index;
        pending[i] ??= { name: "", args: "" };
        if (tc.id) pending[i].id = tc.id;
        if (tc.function?.name) pending[i].name = tc.function.name;
        if (tc.function?.arguments) pending[i].args += tc.function.arguments;
      }
    }
    for (const i of Object.keys(pending)) {
      const p = pending[+i]; let args: Record<string, unknown> = {};
      try { args = JSON.parse(p.args || "{}"); } catch { args = { _raw: p.args }; }
      yield { type: "tool_call", toolCall: { id: p.id ?? `tc_${i}`, name: p.name, args } };
    }
    yield { type: "done" };
  }

  private toOpenAIMsg(m: Message): unknown {
    if (m.role === "tool") return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
    if (m.role === "assistant" && m.toolCalls?.length) {
      return { role: "assistant", content: m.content || null,
        reasoning_content: m.reasoningContent || undefined,
        tool_calls: m.toolCalls.map((tc: ToolCall) => ({ id: tc.id, type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.args) } })) };
    }
    if (m.role === "assistant" && m.reasoningContent) {
      return { role: "assistant", content: m.content || null, reasoning_content: m.reasoningContent };
    }
    return { role: m.role, content: m.content };
  }
}
