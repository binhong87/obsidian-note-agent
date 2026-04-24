import { describe, it, expect } from "vitest";
import { lookupModelCaps } from "../../src/providers/model-caps";

describe("lookupModelCaps", () => {
  it("returns full context + cache for Anthropic Claude Sonnet 4", () => {
    const caps = lookupModelCaps("anthropic", "claude-sonnet-4-5");
    expect(caps.contextWindow).toBe(200_000);
    expect(caps.supportsPromptCache).toBe(true);
  });

  it("returns full context + cache for generic claude model", () => {
    const caps = lookupModelCaps("anthropic", "claude-2");
    expect(caps.contextWindow).toBe(200_000);
    expect(caps.supportsPromptCache).toBe(true);
  });

  it("is case-insensitive for anthropic model names", () => {
    const caps = lookupModelCaps("anthropic", "CLAUDE-OPUS-4");
    expect(caps.supportsPromptCache).toBe(true);
  });

  it("returns correct caps for DeepSeek", () => {
    const caps = lookupModelCaps("deepseek", "deepseek-chat");
    expect(caps.contextWindow).toBe(64_000);
    expect(caps.supportsPromptCache).toBe(false);
  });

  it("returns correct caps for OpenAI GPT-4o", () => {
    const caps = lookupModelCaps("openai", "gpt-4o");
    expect(caps.contextWindow).toBe(128_000);
    expect(caps.supportsPromptCache).toBe(false);
  });

  it("returns correct caps for OpenAI o1", () => {
    const caps = lookupModelCaps("openai", "o1-preview");
    expect(caps.contextWindow).toBe(200_000);
    expect(caps.supportsPromptCache).toBe(false);
  });

  it("returns correct caps for Ollama", () => {
    const caps = lookupModelCaps("ollama", "llama3");
    expect(caps.contextWindow).toBe(32_000);
    expect(caps.supportsPromptCache).toBe(false);
  });

  it("returns default caps for unknown provider+model", () => {
    const caps = lookupModelCaps("openai", "some-future-model-xyz");
    // Falls through all OpenAI entries; openai has a catch-all pattern actually missing
    // so we get... let's check: no catch-all for openai, falls to DEFAULT
    expect(caps.contextWindow).toBe(32_000);
    expect(caps.supportsPromptCache).toBe(false);
  });

  it("returns minimax caps", () => {
    const caps = lookupModelCaps("minimax", "abab6.5s-chat");
    expect(caps.contextWindow).toBe(245_000);
    expect(caps.supportsPromptCache).toBe(false);
  });
});
