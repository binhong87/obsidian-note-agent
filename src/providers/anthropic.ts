import type { ChatRequest, Delta, LLMProvider } from "./types";
import { httpSSE } from "./http";
import { lookupModelCaps } from "./model-caps";

export interface AnthropicConfig { apiKey: string; baseUrl?: string; }
type SSEIter = (o: any) => AsyncIterable<{ data: string }>;

export class AnthropicProvider implements LLMProvider {
  id = "anthropic";
  constructor(private cfg: AnthropicConfig, private sseFn: SSEIter = httpSSE) {}

  async *chat(req: ChatRequest): AsyncIterable<Delta> {
    const url = (this.cfg.baseUrl || "https://api.anthropic.com") + "/v1/messages";
    const caps = lookupModelCaps("anthropic", req.model);
    const useCache = caps.supportsPromptCache;

    const sysText = req.messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
    // When using a cache-capable model, send system as a structured array with cache_control
    // so the Anthropic API caches the stable prefix across turns.
    const system = useCache && sysText
      ? [{ type: "text", text: sysText, cache_control: { type: "ephemeral" } }]
      : (sysText || undefined);

    const msgs = req.messages.filter(m => m.role !== "system").map(m => this.toAnthropic(m));
    const body = {
      model: req.model, max_tokens: 4096, stream: true,
      system, messages: msgs,
      tools: req.tools.length ? req.tools.map(t => ({ name: t.name, description: t.description, input_schema: t.parameters })) : undefined,
      temperature: req.temperature,
    };
    const iter = this.sseFn({
      url, method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.cfg.apiKey,
        "anthropic-version": "2023-06-01",
        ...(useCache ? { "anthropic-beta": "prompt-caching-2024-07-31" } : {}),
      },
      body: JSON.stringify(body), signal: req.signal,
    });
    const blocks: Record<number, { type: string; name?: string; id?: string; buf: string }> = {};
    for await (const ev of iter) {
      let o: any; try { o = JSON.parse(ev.data); } catch { continue; }
      if (o.type === "content_block_start") {
        blocks[o.index] = { type: o.content_block.type, name: o.content_block.name, id: o.content_block.id, buf: "" };
      } else if (o.type === "content_block_delta") {
        const b = blocks[o.index]; if (!b) continue;
        if (o.delta.type === "text_delta") yield { type: "text", text: o.delta.text };
        else if (o.delta.type === "input_json_delta") b.buf += o.delta.partial_json;
      } else if (o.type === "content_block_stop") {
        const b = blocks[o.index];
        if (b?.type === "tool_use") {
          let args: any = {}; try { args = JSON.parse(b.buf || "{}"); } catch { args = { _raw: b.buf }; }
          yield { type: "tool_call", toolCall: { id: b.id!, name: b.name!, args } };
        }
      } else if (o.type === "message_stop") break;
    }
    yield { type: "done" };
  }

  private toAnthropic(m: any): any {
    if (m.role === "assistant" && m.toolCalls?.length) {
      const content: any[] = [];
      if (m.content) content.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls) content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args });
      return { role: "assistant", content };
    }
    if (m.role === "tool") {
      return { role: "user", content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }] };
    }
    return { role: m.role, content: m.content };
  }
}
