import { describe, it, expect } from "vitest";
import { OllamaProvider } from "../../src/providers/ollama";

describe("OllamaProvider", () => {
  it("parses NDJSON chunks", async () => {
    const fakeNDJSON = async function* () {
      yield '{"message":{"content":"Hel"},"done":false}\n';
      yield '{"message":{"content":"lo"},"done":false}\n';
      yield '{"message":{"content":"","tool_calls":[{"function":{"name":"read_note","arguments":{"path":"a.md"}}}]},"done":false}\n';
      yield '{"done":true}\n';
    };
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434" }, fakeNDJSON);
    const out: any[] = [];
    for await (const d of p.chat({ model: "llama3", messages: [], tools: [] })) out.push(d);
    expect(out.filter(d => d.type === "text").map(d => d.text).join("")).toBe("Hello");
    expect(out.find(d => d.type === "tool_call").toolCall.name).toBe("read_note");
  });
});
