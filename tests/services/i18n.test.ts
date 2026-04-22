import { describe, it, expect } from "vitest";
import { I18n, detectLocale } from "../../src/services/i18n";

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
});
