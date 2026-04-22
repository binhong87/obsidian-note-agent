import { describe, it, expect } from "vitest";
import { createProvider, listProviderIds } from "../../src/providers/registry";

describe("provider registry", () => {
  it("lists all nine ids", () => {
    expect(listProviderIds().sort()).toEqual(
      ["anthropic","deepseek","kimi","minimax","ollama","openai","openrouter","qwen","zhipu"]
    );
  });
  it("creates openai", () => {
    const p = createProvider("openai", { apiKey: "k", baseUrl: "" });
    expect(p.id).toBe("openai");
  });
  it("throws on unknown id", () => {
    expect(() => createProvider("nope" as any, { apiKey: "", baseUrl: "" })).toThrow();
  });
});
