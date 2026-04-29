import type { ChatRequest, Delta, LLMProvider } from "./types";
import { ProviderError } from "./types";

export interface OllamaConfig { baseUrl: string; }
type NDJSONIter = () => AsyncIterable<string>;

export class OllamaProvider implements LLMProvider {
  id = "ollama";
  constructor(private cfg: OllamaConfig, private streamFn?: NDJSONIter) {}

  async *chat(req: ChatRequest): AsyncIterable<Delta> {
    const url = this.cfg.baseUrl.replace(/\/$/, "") + "/api/chat";
    const body = {
      model: req.model, stream: true,
      messages: req.messages.map(m => this.toOllama(m)),
      tools: req.tools.length ? req.tools.map(t => ({ type: "function", function: t })) : undefined,
      options: req.temperature !== undefined ? { temperature: req.temperature } : undefined,
    };
    const iter = this.streamFn ? this.streamFn() : this.fetchNDJSON(url, body, req.signal);
    let counter = 0;
    for await (const line of iter) {
      const trimmed = line.trim(); if (!trimmed) continue;
      let o: any; try { o = JSON.parse(trimmed); } catch { continue; }
      if (o.message?.content) yield { type: "text", text: o.message.content };
      for (const tc of o.message?.tool_calls ?? []) {
        yield { type: "tool_call", toolCall: { id: `tc_${counter++}`, name: tc.function.name, args: tc.function.arguments ?? {} } };
      }
      if (o.done) break;
    }
    yield { type: "done" };
  }

  private async *fetchNDJSON(url: string, body: unknown, signal?: AbortSignal): AsyncIterable<string> {
    // eslint-disable-next-line no-restricted-globals -- requestUrl doesn't support streaming; fetch is required for NDJSON
    const resp = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (resp.status >= 400) throw new ProviderError(resp.status >= 500 ? "unavailable" : "unknown", await resp.text());
    const reader = resp.body!.getReader(); const dec = new TextDecoder(); let buf = "";
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) { yield buf.slice(0, idx); buf = buf.slice(idx + 1); }
    }
    if (buf.trim()) yield buf;
  }

  private toOllama(m: any): unknown {
    if (m.role === "tool") return { role: "tool", content: m.content };
    if (m.role === "assistant" && m.toolCalls?.length) {
      return { role: "assistant", content: m.content || "",
        tool_calls: m.toolCalls.map((tc: any) => ({ function: { name: tc.name, arguments: tc.args } })) };
    }
    return { role: m.role, content: m.content };
  }
}
