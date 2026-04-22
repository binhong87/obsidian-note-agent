import { describe, it, expect } from "vitest";
import { createOpenAICompatible } from "../../src/providers/openai-compat";

describe("openai-compat factory", () => {
  it("produces a provider with given id and default url", () => {
    const p = createOpenAICompatible({ id: "deepseek", apiKey: "k", defaultBaseUrl: "https://api.deepseek.com/v1" });
    expect(p.id).toBe("deepseek");
  });
  it("uses override baseUrl when given", () => {
    const p = createOpenAICompatible({ id: "deepseek", apiKey: "k", defaultBaseUrl: "https://x", baseUrl: "https://y" });
    expect((p as any).cfg.baseUrl).toBe("https://y");
  });
});
