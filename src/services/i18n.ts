import en from "../locales/en.json";
import zh from "../locales/zh-CN.json";
import type { Locale } from "../types";

type Dict = Record<string, string>;
const DICTS: Record<Exclude<Locale, "auto">, Dict> = { en, "zh-CN": zh };

export class I18n {
  private dict: Dict;
  constructor(private locale: Exclude<Locale, "auto"> = "en") { this.dict = DICTS[locale]; }
  setLocale(l: Exclude<Locale, "auto">) { this.locale = l; this.dict = DICTS[l]; }
  getLocale() { return this.locale; }
  t(key: string, vars?: Record<string, string | number>): string {
    let s = this.dict[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(new RegExp(`{{${k}}}`, "g"), String(vars[k]));
    return s;
  }
}

export function detectLocale(pref: Locale, obsidianLocale: string): Exclude<Locale, "auto"> {
  if (pref !== "auto") return pref;
  return obsidianLocale.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}
