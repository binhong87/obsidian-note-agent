import { describe, it, expect } from "vitest";
import { migrateSettings, activeProfile, DEFAULT_SETTINGS } from "../src/settings";
import { PROVIDER_DEFAULTS } from "../src/providers/defaults";

describe("migrateSettings", () => {
  it("fills defaults when given undefined", () => {
    const s = migrateSettings(undefined);
    expect(s.providerId).toBe(DEFAULT_SETTINGS.providerId);
    // every provider has an entry
    for (const id of Object.keys(PROVIDER_DEFAULTS)) {
      expect(s.providers[id as keyof typeof s.providers]).toBeDefined();
    }
  });

  it("folds legacy flat fields into the active provider's profile", () => {
    const legacy = {
      providerId: "deepseek" as const,
      apiKey: "sk-deepseek-xxx",
      baseUrl: "https://custom.deepseek.example",
      model: "deepseek-reasoner",
    };
    const s = migrateSettings(legacy as any);
    expect(s.providers.deepseek.apiKey).toBe("sk-deepseek-xxx");
    expect(s.providers.deepseek.baseUrl).toBe("https://custom.deepseek.example");
    expect(s.providers.deepseek.model).toBe("deepseek-reasoner");
    // untouched providers keep their default model
    expect(s.providers.openai.model).toBe(PROVIDER_DEFAULTS.openai.model);
    expect(s.providers.openai.apiKey).toBe("");
    // no legacy fields leak into the top level
    expect((s as any).apiKey).toBeUndefined();
    expect((s as any).baseUrl).toBeUndefined();
    expect((s as any).model).toBeUndefined();
  });

  it("preserves existing providers map and merges legacy into active", () => {
    const raw = {
      providerId: "openai" as const,
      apiKey: "sk-openai",
      providers: {
        anthropic: { apiKey: "sk-ant", baseUrl: "", model: "claude-opus-4-1" },
      },
    };
    const s = migrateSettings(raw as any);
    expect(s.providers.openai.apiKey).toBe("sk-openai");
    expect(s.providers.anthropic.apiKey).toBe("sk-ant");
    expect(s.providers.anthropic.model).toBe("claude-opus-4-1");
  });

  it("is idempotent on already-migrated settings", () => {
    const once = migrateSettings({ providerId: "kimi", apiKey: "sk-k" } as any);
    const twice = migrateSettings(once);
    expect(twice.providers.kimi.apiKey).toBe("sk-k");
    expect(twice.providers.openai.apiKey).toBe("");
  });

  it("keeps scheduled defaults intact", () => {
    const s = migrateSettings({ scheduled: { dailySummary: { enabled: true } } } as any);
    expect(s.scheduled.dailySummary.enabled).toBe(true);
    expect(s.scheduled.dailySummary.time).toBe(DEFAULT_SETTINGS.scheduled.dailySummary.time);
    expect(s.scheduled.weeklyReview.time).toBe(DEFAULT_SETTINGS.scheduled.weeklyReview.time);
  });
});

describe("activeProfile", () => {
  it("falls back to default baseUrl and model when empty", () => {
    const s = migrateSettings({ providerId: "deepseek" } as any);
    s.providers.deepseek = { apiKey: "k", baseUrl: "", model: "" };
    const p = activeProfile(s);
    expect(p.baseUrl).toBe(PROVIDER_DEFAULTS.deepseek.baseUrl);
    expect(p.model).toBe(PROVIDER_DEFAULTS.deepseek.model);
    expect(p.apiKey).toBe("k");
  });

  it("uses user-provided overrides when set", () => {
    const s = migrateSettings({ providerId: "openai" } as any);
    s.providers.openai = { apiKey: "k", baseUrl: "https://proxy.example/v1", model: "gpt-4o" };
    const p = activeProfile(s);
    expect(p.baseUrl).toBe("https://proxy.example/v1");
    expect(p.model).toBe("gpt-4o");
  });
});
