import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS, migrateSettings } from "../src/settings";

describe("settings", () => {
  it("defaults", () => {
    expect(DEFAULT_SETTINGS.providerId).toBe("openai");
    expect(DEFAULT_SETTINGS.mode).toBe("ask");
    expect(DEFAULT_SETTINGS.scheduled.dailySummary.enabled).toBe(false);
  });
  it("migrateSettings fills missing fields", () => {
    const full = migrateSettings({ providerId: "deepseek" } as any);
    expect(full.providerId).toBe("deepseek");
    expect(full.mode).toBe("ask");
    expect(full.scheduled.weeklyReview.weekday).toBe(0);
  });
});
