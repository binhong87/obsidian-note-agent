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
});
