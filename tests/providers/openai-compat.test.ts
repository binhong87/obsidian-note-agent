import { describe, it, expect } from "vitest";
import { createOpenAICompatible } from "../../src/providers/openai-compat";
import { createDeepSeek } from "../../src/providers/deepseek";
import { createQwen } from "../../src/providers/qwen";
import { createKimi } from "../../src/providers/kimi";
import { createZhipu } from "../../src/providers/zhipu";
import { createMiniMax } from "../../src/providers/minimax";
import { createOpenRouter } from "../../src/providers/openrouter";

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

describe("CN + OpenRouter adapters", () => {
  const cases: Array<[string, (k: string) => any, string]> = [
    ["deepseek", createDeepSeek, "https://api.deepseek.com/v1"],
    ["qwen", createQwen, "https://dashscope.aliyuncs.com/compatible-mode/v1"],
    ["kimi", createKimi, "https://api.moonshot.cn/v1"],
    ["zhipu", createZhipu, "https://open.bigmodel.cn/api/paas/v4"],
    ["minimax", createMiniMax, "https://api.minimax.chat/v1"],
    ["openrouter", createOpenRouter, "https://openrouter.ai/api/v1"],
  ];
  for (const [id, factory, url] of cases) {
    it(`${id} adapter has id and default baseUrl`, () => {
      const p = factory("key");
      expect(p.id).toBe(id);
      expect((p as any).cfg.baseUrl).toBe(url);
    });
  }
});
