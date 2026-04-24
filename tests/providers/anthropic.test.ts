import { describe, it, expect } from "vitest";
import { AnthropicProvider } from "../../src/providers/anthropic";

describe("AnthropicProvider", () => {
  it("parses text + tool_use blocks", async () => {
    const fakeSSE = async function* () {
      yield { data: '{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}' };
      yield { data: '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}' };
      yield { data: '{"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"tu_1","name":"read_note","input":{}}}' };
      yield { data: '{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"path\\":\\"a.md\\"}"}}' };
      yield { data: '{"type":"content_block_stop","index":1}' };
      yield { data: '{"type":"message_stop"}' };
    };
    const p = new AnthropicProvider({ apiKey: "k" }, fakeSSE);
    const out: any[] = [];
    for await (const d of p.chat({ model: "claude-opus-4-7", messages: [], tools: [] })) out.push(d);
    expect(out.find(d => d.type === "text").text).toBe("Hi");
    const tc = out.find(d => d.type === "tool_call");
    expect(tc.toolCall.name).toBe("read_note");
    expect(tc.toolCall.args.path).toBe("a.md");
  });

  it("uses structured system array with cache_control for cache-capable models", async () => {
    const capturedBodies: any[] = [];
    const capturedHeaders: any[] = [];
    const fakeSSE = async function* (opts: any) {
      capturedBodies.push(JSON.parse(opts.body));
      capturedHeaders.push(opts.headers);
      yield { data: '{"type":"message_stop"}' };
    };
    const p = new AnthropicProvider({ apiKey: "k" }, fakeSSE);
    const out: any[] = [];
    for await (const d of p.chat({
      model: "claude-sonnet-4-5",
      messages: [{ role: "system", content: "You are helpful." }],
      tools: [],
    })) out.push(d);

    const body = capturedBodies[0];
    expect(Array.isArray(body.system)).toBe(true);
    expect(body.system[0].type).toBe("text");
    expect(body.system[0].text).toBe("You are helpful.");
    expect(body.system[0].cache_control).toEqual({ type: "ephemeral" });

    const headers = capturedHeaders[0];
    expect(headers["anthropic-beta"]).toBe("prompt-caching-2024-07-31");
  });

  it("uses plain string system for non-cache models", async () => {
    const capturedBodies: any[] = [];
    const capturedHeaders: any[] = [];
    const fakeSSE = async function* (opts: any) {
      capturedBodies.push(JSON.parse(opts.body));
      capturedHeaders.push(opts.headers);
      yield { data: '{"type":"message_stop"}' };
    };
    // Use a model that doesn't match any anthropic entry (pretend it's a generic openai model name)
    // Actually anthropic table has a catch-all /claude/i so any model used with AnthropicProvider
    // that contains 'claude' will get cache. We need a model name that doesn't match.
    const p = new AnthropicProvider({ apiKey: "k" }, fakeSSE);
    // Passing model name that won't match any table entry → DEFAULT (no cache)
    const out: any[] = [];
    for await (const d of p.chat({
      model: "some-other-model",
      messages: [{ role: "system", content: "You are helpful." }],
      tools: [],
    })) out.push(d);

    const body = capturedBodies[0];
    // Should be a plain string
    expect(typeof body.system).toBe("string");
    expect(body.system).toBe("You are helpful.");

    const headers = capturedHeaders[0];
    expect(headers["anthropic-beta"]).toBeUndefined();
  });

  it("omits system field entirely when no system messages", async () => {
    const capturedBodies: any[] = [];
    const fakeSSE = async function* (opts: any) {
      capturedBodies.push(JSON.parse(opts.body));
      yield { data: '{"type":"message_stop"}' };
    };
    const p = new AnthropicProvider({ apiKey: "k" }, fakeSSE);
    for await (const _ of p.chat({ model: "some-other-model", messages: [], tools: [] })) {}
    expect(capturedBodies[0].system).toBeUndefined();
  });
});
