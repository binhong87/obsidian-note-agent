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
});
