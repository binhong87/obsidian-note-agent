import { describe, it, expect } from "vitest";
import { createProvider, listProviderIds } from "../../src/providers/registry";

describe("provider registry", () => {
  it("lists all ten ids", () => {
    expect(listProviderIds().sort()).toEqual(
      ["anthropic","custom","deepseek","kimi","minimax","ollama","openai","openrouter","qwen","zhipu"]
    );
  });
  it("creates openai", () => {
    const p = createProvider("openai", { apiKey: "k", baseUrl: "" });
    expect(p.id).toBe("openai");
  });
  it("creates custom as openai-compatible by default", () => {
    const p = createProvider("custom", { apiKey: "k", baseUrl: "https://example.com/v1" });
    expect(p.id).toBe("openai");
  });
  it("creates custom as anthropic when compat=anthropic", () => {
    const p = createProvider("custom", { apiKey: "k", baseUrl: "https://example.com", compat: "anthropic" });
    expect(p.id).toBe("anthropic");
  });
  it("throws on unknown id", () => {
    expect(() => createProvider("nope" as any, { apiKey: "", baseUrl: "" })).toThrow();
  });
});
