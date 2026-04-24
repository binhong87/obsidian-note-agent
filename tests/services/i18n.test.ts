import { describe, it, expect } from "vitest";
import { I18n, detectLocale } from "../../src/services/i18n";
import en from "../../src/locales/en.json";
import zh from "../../src/locales/zh-CN.json";

describe("I18n", () => {
  it("returns key when missing", () => { expect(new I18n("en").t("nope")).toBe("nope"); });
  it("localized en", () => { expect(new I18n("en").t("chat.send")).toBe("Send"); });
  it("interpolates", () => { expect(new I18n("en").t("summary.created", { count: 3 })).toContain("3"); });
  it("switches locale", () => {
    const i = new I18n("en"); i.setLocale("zh-CN");
    expect(i.t("chat.send")).toBe("发送");
  });
  it("detectLocale auto", () => {
    expect(detectLocale("auto", "zh-cn")).toBe("zh-CN");
    expect(detectLocale("auto", "en")).toBe("en");
    expect(detectLocale("en", "zh")).toBe("en");
  });
  it("en and zh-CN have identical key sets", () => {
    const enKeys = new Set(Object.keys(en));
    const zhKeys = new Set(Object.keys(zh));
    const missingInZh = [...enKeys].filter(k => !zhKeys.has(k));
    const missingInEn = [...zhKeys].filter(k => !enKeys.has(k));
    expect(missingInZh, `keys missing in zh-CN: ${missingInZh.join(", ")}`).toEqual([]);
    expect(missingInEn, `keys missing in en: ${missingInEn.join(", ")}`).toEqual([]);
  });
  it("interpolates {{url}} in baseUrl desc", () => {
    const s = new I18n("en").t("settings.baseUrl.desc", { url: "https://x.example" });
    expect(s).toContain("https://x.example");
  });
  it("zh interpolates too", () => {
    const s = new I18n("zh-CN").t("settings.model.desc", { model: "gpt-4o" });
    expect(s).toContain("gpt-4o");
    expect(s).toContain("默认");
  });
});

