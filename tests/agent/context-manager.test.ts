import { describe, it, expect, vi } from "vitest";
import { ContextManager } from "../../src/agent/context-manager";
import { Conversation } from "../../src/agent/conversation";
import { I18n } from "../../src/services/i18n";

const i18n = new I18n("en");

const DEFAULT_SETTINGS = {
  historyTokenBudget: 0,
  responseReserveTokens: 4096,
  autoCompactThreshold: 0.75,
  keepLastTurns: 6,
};

/** Build a mock provider that returns a canned summary text. */
function mockSummaryProvider(summaryText: string) {
  return {
    id: "mock",
    async *chat() {
      yield { type: "text" as const, text: summaryText };
      yield { type: "done" as const };
    },
  };
}

/** Build a conversation with N user+assistant turns. */
function buildConv(turns: number): Conversation {
  const c = new Conversation({ id: "c", mode: "ask", provider: "openai", model: "gpt-4o" });
  for (let i = 0; i < turns; i++) {
    c.append({ role: "user", content: `User message ${i}` });
    c.append({ role: "assistant", content: `Assistant reply ${i}` });
  }
  return c;
}

describe("ContextManager.prepare() — under threshold", () => {
  it("returns messages as-is when under threshold (no summary call)", async () => {
    const conv = buildConv(2);
    const provider = { id: "mock", chat: vi.fn() };
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider: provider as any,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 100_000, // big cap → no compaction needed
      },
      i18n,
    });
    const result = await mgr.prepare();
    expect(result.messages[0]).toMatchObject({ role: "system", content: "S" });
    expect(result.messages.length).toBe(1 + conv.messages.length);
    expect(provider.chat).not.toHaveBeenCalled();
    expect(conv.summary).toBeUndefined();
  });
});

describe("ContextManager.prepare() — over threshold triggers compaction", () => {
  it("calls provider for summary and updates conversation fields", async () => {
    // Use a very small budget so a 4-turn conversation overflows 75%
    const conv = buildConv(4);
    const provider = mockSummaryProvider("A concise summary of the conversation.");
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 50, // very small → definitely over 75%
        keepLastTurns: 2,
      },
      i18n,
    });
    await mgr.prepare();
    expect(conv.summary).toBe("A concise summary of the conversation.");
    expect(conv.summarizedThroughIndex).toBeGreaterThanOrEqual(0);
  });

  it("subsequent prepare uses summary + tail, cacheableBoundary = 1", async () => {
    const conv = buildConv(4);
    const provider = mockSummaryProvider("Summary text.");
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 50,
        keepLastTurns: 2,
      },
      i18n,
    });
    const result = await mgr.prepare();
    // After compaction: system at 0, summary at 1
    expect(result.cacheableBoundary).toBe(1);
    expect(result.messages[0]).toMatchObject({ role: "system", content: "S" });
    expect(result.messages[1]).toMatchObject({ role: "system", content: "Summary text." });
  });
});

describe("ContextManager.prepare() — keep-last-N", () => {
  it("tail always contains at most keepLastTurns turn-groups verbatim", async () => {
    // 8 turns, keep last 3
    const conv = buildConv(8);
    const provider = mockSummaryProvider("Summary.");
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 50, // force compaction
        keepLastTurns: 3,
      },
      i18n,
    });
    await mgr.prepare();
    // The summarizedThroughIndex should be at (8 - 3) * 2 - 1 = 9
    // i.e., 5 turns (10 msgs) summarized, 3 turns (6 msgs) kept
    const keptCount = conv.messages.length - (conv.summarizedThroughIndex! + 1);
    // keptCount should be 3 turns × 2 messages = 6
    expect(keptCount).toBe(6);
  });
});

describe("ContextManager.prepare() — onStatus callback", () => {
  it("calls onStatus with compacting then idle", async () => {
    const conv = buildConv(4);
    const provider = mockSummaryProvider("Summary.");
    const statusCalls: string[] = [];
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 50,
        keepLastTurns: 2,
      },
      onStatus: (s) => statusCalls.push(s),
      i18n,
    });
    await mgr.prepare();
    expect(statusCalls).toContain("compacting");
    expect(statusCalls[statusCalls.length - 1]).toBe("idle");
  });
});

describe("ContextManager.prepare() — onCompacted callback", () => {
  it("calls onCompacted after compaction", async () => {
    const conv = buildConv(4);
    const provider = mockSummaryProvider("Summary.");
    const onCompacted = vi.fn(async () => {});
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 50,
        keepLastTurns: 2,
      },
      onCompacted,
      i18n,
    });
    await mgr.prepare();
    expect(onCompacted).toHaveBeenCalledTimes(1);
  });
});

describe("ContextManager — no-op when nothing to summarize", () => {
  it("does not update summary when all messages are in keep-last-N tail", async () => {
    const conv = buildConv(2); // only 2 turns
    const provider = mockSummaryProvider("Should not appear.");
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider,
      model: "gpt-4o",
      providerId: "openai",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 50, // force compaction attempt
        keepLastTurns: 6,       // but keep 6 turns, which is > 2 available
      },
      i18n,
    });
    await mgr.prepare();
    // Nothing to summarize, so summary stays undefined
    expect(conv.summary).toBeUndefined();
  });
});

describe("ContextManager — effectiveBudget from model caps when historyTokenBudget=0", () => {
  it("returns a large budget for Anthropic Claude", async () => {
    const conv = buildConv(1);
    const provider = { id: "mock", chat: vi.fn() };
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider: provider as any,
      model: "claude-sonnet-4-5",
      providerId: "anthropic",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 0, // auto
      },
      i18n,
    });
    const result = await mgr.prepare();
    // effectiveBudget = 200000 - 4096 = 195904
    expect(result.effectiveBudget).toBe(200_000 - 4096);
    expect(provider.chat).not.toHaveBeenCalled();
  });

  it("returns a smaller budget for DeepSeek", async () => {
    const conv = buildConv(1);
    const provider = { id: "mock", chat: vi.fn() };
    const mgr = new ContextManager({
      conversation: conv,
      systemPrompt: "S",
      provider: provider as any,
      model: "deepseek-chat",
      providerId: "deepseek",
      settings: {
        ...DEFAULT_SETTINGS,
        historyTokenBudget: 0,
      },
      i18n,
    });
    const result = await mgr.prepare();
    // effectiveBudget = 64000 - 4096 = 59904
    expect(result.effectiveBudget).toBe(64_000 - 4096);
  });
});
