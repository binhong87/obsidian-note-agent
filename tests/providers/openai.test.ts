import { describe, it, expect } from "vitest";
import { OpenAIProvider } from "../../src/providers/openai";

describe("OpenAIProvider", () => {
  it("parses streamed deltas", async () => {
    const fakeSSE = async function* () {
      yield { data: '{"choices":[{"delta":{"content":"Hel"}}]}' };
      yield { data: '{"choices":[{"delta":{"content":"lo"}}]}' };
      yield { data: '{"choices":[{"delta":{"tool_calls":[{"index":0,"id":"t1","function":{"name":"read_note","arguments":"{\\"path\\":\\"a.md\\"}"}}]}}]}' };
      yield { data: "[DONE]" };
    };
    const p = new OpenAIProvider({ apiKey: "k", baseUrl: "" }, fakeSSE);
    const out: any[] = [];
    for await (const d of p.chat({ model: "gpt-4o", messages: [], tools: [] })) out.push(d);
    expect(out.filter(d => d.type === "text").map(d => d.text).join("")).toBe("Hello");
    const tc = out.find(d => d.type === "tool_call");
    expect(tc.toolCall.name).toBe("read_note");
    expect(tc.toolCall.args.path).toBe("a.md");
    expect(out[out.length - 1].type).toBe("done");
  });

  it("streams reasoning_content as reasoning deltas", async () => {
    const fakeSSE = async function* () {
      yield { data: '{"choices":[{"delta":{"reasoning_content":"think..."}}]}' };
      yield { data: '{"choices":[{"delta":{"content":"answer"}}]}' };
      yield { data: "[DONE]" };
    };
    const p = new OpenAIProvider({ apiKey: "k", baseUrl: "" }, fakeSSE);
    const out: any[] = [];
    for await (const d of p.chat({ model: "m", messages: [], tools: [] })) out.push(d);

    const reasoningDelta = out.find(d => d.type === "reasoning");
    expect(reasoningDelta).toBeDefined();
    expect(reasoningDelta.text).toBe("think...");

    const textDelta = out.find(d => d.type === "text");
    expect(textDelta?.text).toBe("answer");
  });

  it("serializes reasoning_content back in toOpenAIMsg for assistant messages", async () => {
    const captured: any[] = [];
    const fakeSSE = async function* (opts: any) {
      captured.push(JSON.parse(opts.body));
      yield { data: "[DONE]" };
    };
    const p = new OpenAIProvider({ apiKey: "k", baseUrl: "" }, fakeSSE as any);

    const msgs: any[] = [
      { role: "assistant", content: "answer", reasoningContent: "think...", toolCalls: [] },
    ];
    for await (const _ of p.chat({ model: "m", messages: msgs, tools: [] })) { /* drain */ }

    const sent = captured[0].messages[0];
    expect(sent.reasoning_content).toBe("think...");
    expect(sent.content).toBe("answer");
  });

  it("serializes reasoning_content in toOpenAIMsg for assistant messages with tool calls", async () => {
    const captured: any[] = [];
    const fakeSSE = async function* (opts: any) {
      captured.push(JSON.parse(opts.body));
      yield { data: "[DONE]" };
    };
    const p = new OpenAIProvider({ apiKey: "k", baseUrl: "" }, fakeSSE as any);

    const msgs: any[] = [
      {
        role: "assistant",
        content: null,
        reasoningContent: "think...",
        toolCalls: [{ id: "tc_0", name: "read_note", args: { path: "a.md" } }],
      },
    ];
    for await (const _ of p.chat({ model: "m", messages: msgs, tools: [] })) { /* drain */ }

    const sent = captured[0].messages[0];
    expect(sent.reasoning_content).toBe("think...");
    expect(sent.tool_calls).toHaveLength(1);
    expect(sent.tool_calls[0].function.name).toBe("read_note");
  });
});
