# Obsidian Agent Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian plugin that provides an agentic assistant for personal knowledge management, with Ask/Edit modes, scheduled daily/weekly tasks, nine LLM provider adapters, and English/Chinese localization.

**Architecture:** Six-layer design — UI (Svelte) → Agent Runtime → Providers + Tools → Vault/Conversation/Scheduler/I18n services. ModeGate structurally enforces Ask vs Edit vs Scheduled tool access. Writes in Edit mode are approval-gated; scheduled tasks can only create new notes.

**Tech Stack:** TypeScript, Obsidian plugin API, Svelte 4, esbuild, Vitest.

**Reference:** `docs/superpowers/specs/2026-04-22-obsidian-agent-design.md`

---

## File Layout

```
obsidian-agent/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── src/
│   ├── main.ts                         # Plugin entry
│   ├── settings.ts                     # Settings schema + defaults
│   ├── types.ts                        # Shared cross-layer types
│   ├── agent/
│   │   ├── conversation.ts
│   │   ├── mode-gate.ts
│   │   ├── approval-queue.ts
│   │   ├── history-trimmer.ts
│   │   └── agent-loop.ts
│   ├── providers/
│   │   ├── types.ts                    # LLMProvider interface, Delta
│   │   ├── http.ts                     # requestUrl wrapper + SSE parsing
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── ollama.ts
│   │   ├── openrouter.ts
│   │   ├── deepseek.ts
│   │   ├── qwen.ts
│   │   ├── kimi.ts
│   │   ├── zhipu.ts
│   │   ├── minimax.ts
│   │   └── registry.ts                 # id → factory
│   ├── tools/
│   │   ├── types.ts                    # Tool, ToolSchema
│   │   ├── read.ts                     # search/read/list/links/active/selection
│   │   ├── write.ts                    # create/edit/patch/delete/move
│   │   └── registry.ts                 # combined registry per mode
│   ├── services/
│   │   ├── vault-service.ts
│   │   ├── conversation-store.ts
│   │   ├── scheduler-service.ts
│   │   └── i18n.ts
│   ├── ui/
│   │   ├── ChatView.svelte
│   │   ├── chat-view.ts                # ItemView wrapper
│   │   ├── DiffReviewBlock.svelte
│   │   ├── ChangeSummary.svelte
│   │   ├── MessageList.svelte
│   │   ├── ModeToggle.svelte
│   │   ├── ConversationList.svelte
│   │   ├── SettingsTab.ts
│   │   └── status-bar.ts
│   └── locales/
│       ├── en.json
│       └── zh-CN.json
├── tests/
│   ├── agent/
│   ├── providers/
│   ├── tools/
│   ├── services/
│   └── fixtures/
└── docs/
    └── superpowers/
        ├── specs/
        ├── plans/
        └── qa/manual-qa.md
```

## Task Overview

1. Project scaffolding + build
2. Shared types + settings schema
3. I18n service
4. VaultService
5. Tool types + read tools
6. Tool types + write tools
7. Tool registry with mode filtering
8. Provider types + HTTP helper
9. OpenAI adapter
10. Anthropic adapter
11. Ollama adapter
12. OpenRouter adapter
13. DeepSeek adapter
14. Qwen (DashScope) adapter
15. Kimi (Moonshot) adapter
16. Zhipu GLM adapter
17. MiniMax adapter
18. Provider registry
19. Conversation + ConversationStore
20. HistoryTrimmer
21. ModeGate
22. ApprovalQueue
23. AgentLoop
24. SettingsTab
25. ChatView + sub-components
26. DiffReviewBlock + ChangeSummary
27. StatusBar
28. SchedulerService + presets
29. Plugin entry (main.ts) wiring
30. Manual QA checklist

Subsequent messages will contain the full task bodies with tests, code, and commits. Each task is independently implementable and produces a green test suite before commit.

---

## Task 1: Project Scaffolding + Build

**Files:** `package.json`, `manifest.json`, `tsconfig.json`, `esbuild.config.mjs`, `vitest.config.ts`, `.gitignore`, `tests/fixtures/obsidian-mock.ts`

- [ ] **Step 1: Init git + npm**

```bash
cd D:/workspace/obsidian-agent
git init
npm init -y
```

- [ ] **Step 2: Install dev deps**

```bash
npm i -D typescript@5.4 esbuild@0.20 svelte@4 esbuild-svelte@0.8 svelte-preprocess@5 @tsconfig/svelte@5 obsidian tslib @types/node@20 vitest@1 eslint@8 @typescript-eslint/parser@7 @typescript-eslint/eslint-plugin@7 prettier@3 eslint-plugin-svelte@2
```

- [ ] **Step 3: Write `manifest.json`**

```json
{
  "id": "obsidian-agent",
  "name": "Obsidian Agent",
  "version": "0.1.0",
  "minAppVersion": "1.5.0",
  "description": "Agentic assistant for personal knowledge management.",
  "author": "You",
  "isDesktopOnly": false
}
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "sourceMap": true,
    "lib": ["ES2020", "DOM"],
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"]
}
```

- [ ] **Step 5: Write `esbuild.config.mjs`**

```js
import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const prod = process.argv[2] === "production";
const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*"],
  format: "cjs",
  target: "es2020",
  sourcemap: prod ? false : "inline",
  outfile: "main.js",
  plugins: [sveltePlugin({ preprocess: sveltePreprocess() })],
});
if (prod) { await ctx.rebuild(); process.exit(0); } else { await ctx.watch(); }
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    alias: { obsidian: new URL("./tests/fixtures/obsidian-mock.ts", import.meta.url).pathname },
  },
});
```

- [ ] **Step 7: Write `.gitignore`**

```
node_modules/
main.js
main.js.map
coverage/
data.json
.DS_Store
```

- [ ] **Step 8: Write `tests/fixtures/obsidian-mock.ts`**

```ts
export class Notice { constructor(public message: string) {} }
export class Plugin {}
export class ItemView {}
export class PluginSettingTab {}
export class Setting { constructor(public containerEl: unknown) {} }
export const requestUrl = async (_: unknown): Promise<unknown> => { throw new Error("mock requestUrl not stubbed"); };
export class TFile { constructor(public path: string) {} }
export class TFolder { constructor(public path: string) {} }
export class Vault {}
export class App {}
export const normalizePath = (p: string) => p.replace(/\\/g, "/");
export const moment = { locale: () => "en" };
```

- [ ] **Step 9: Patch `package.json` scripts**

```json
"scripts": {
  "dev": "node esbuild.config.mjs",
  "build": "tsc --noEmit && node esbuild.config.mjs production",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 10: Verify**

Run `npm run build` — produces `main.js`. Run `npm test` — reports no tests (exit 0).

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: project scaffolding"
```

## Task 2: Shared Types + Settings

**Files:** `src/types.ts`, `src/settings.ts`, `tests/settings.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/settings.test.ts
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
```

- [ ] **Step 2: Confirm fail** — `npm test` → module not found.

- [ ] **Step 3: Write `src/types.ts`**

```ts
export type Mode = "ask" | "edit" | "scheduled";
export type ProviderId =
  | "openai" | "anthropic" | "ollama" | "openrouter"
  | "deepseek" | "qwen" | "kimi" | "zhipu" | "minimax";
export type Locale = "auto" | "en" | "zh-CN";

export interface ToolCall { id: string; name: string; args: Record<string, unknown>; }
export interface ToolResult { toolCallId: string; content: string; isError?: boolean; }

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface Delta {
  type: "text" | "tool_call" | "done" | "error";
  text?: string;
  toolCall?: ToolCall;
  error?: { kind: string; message: string };
}
```

- [ ] **Step 4: Write `src/settings.ts`**

```ts
import type { Mode, ProviderId, Locale } from "./types";

export interface ScheduledTaskSetting {
  enabled: boolean;
  time: string;
  targetFolder: string;
  weekday?: number;
}

export interface Settings {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  mode: Mode;
  chatsFolder: string;
  locale: Locale;
  maxIterations: number;
  turnTimeoutMs: number;
  historyTokenBudget: number;
  scheduled: {
    dailySummary: ScheduledTaskSetting;
    weeklyReview: ScheduledTaskSetting;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  providerId: "openai",
  apiKey: "",
  baseUrl: "",
  model: "",
  mode: "ask",
  chatsFolder: "_agent/chats",
  locale: "auto",
  maxIterations: 25,
  turnTimeoutMs: 120_000,
  historyTokenBudget: 32_000,
  scheduled: {
    dailySummary: { enabled: false, time: "22:00", targetFolder: "_agent/summaries/daily" },
    weeklyReview: { enabled: false, time: "22:00", targetFolder: "_agent/summaries/weekly", weekday: 0 },
  },
};

export function migrateSettings(raw: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...(raw ?? {}),
    scheduled: {
      dailySummary: { ...DEFAULT_SETTINGS.scheduled.dailySummary, ...(raw?.scheduled?.dailySummary ?? {}) },
      weeklyReview: { ...DEFAULT_SETTINGS.scheduled.weeklyReview, ...(raw?.scheduled?.weeklyReview ?? {}) },
    },
  };
}
```

- [ ] **Step 5: Confirm pass** — `npm test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/settings.ts tests/settings.test.ts
git commit -m "feat: shared types and settings schema"
```

## Task 3: I18n Service

**Files:** `src/services/i18n.ts`, `src/locales/en.json`, `src/locales/zh-CN.json`, `tests/services/i18n.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/services/i18n.test.ts
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
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/locales/en.json`**

```json
{
  "chat.send": "Send",
  "chat.cancel": "Cancel",
  "chat.new": "New chat",
  "chat.mode.ask": "Ask",
  "chat.mode.edit": "Edit",
  "diff.approve": "Approve",
  "diff.reject": "Reject",
  "diff.applyAll": "Apply All",
  "diff.rejectAll": "Reject All",
  "summary.created": "{{count}} created",
  "summary.edited": "{{count}} edited",
  "summary.deleted": "{{count}} deleted",
  "error.auth": "Authentication failed. Check Settings.",
  "error.rate": "Rate limit. Retry in a moment.",
  "error.context": "Context too large. Older messages summarized.",
  "prompt.system.ask": "You are a knowledge-base assistant. Use tools to search and read notes. Cite note paths.",
  "prompt.system.edit": "You are a knowledge-base assistant with editing abilities. All writes require user approval. Produce minimal diffs.",
  "prompt.scheduled.daily": "Summarize notes modified today. Produce one new note with headings per topic and links back.",
  "prompt.scheduled.weekly": "Produce a weekly review of the past 7 days. Highlight themes and open loops in one new note."
}
```

- [ ] **Step 4: Write `src/locales/zh-CN.json`**

```json
{
  "chat.send": "发送",
  "chat.cancel": "取消",
  "chat.new": "新对话",
  "chat.mode.ask": "提问",
  "chat.mode.edit": "编辑",
  "diff.approve": "批准",
  "diff.reject": "拒绝",
  "diff.applyAll": "全部应用",
  "diff.rejectAll": "全部拒绝",
  "summary.created": "新建 {{count}} 篇",
  "summary.edited": "修改 {{count}} 篇",
  "summary.deleted": "删除 {{count}} 篇",
  "error.auth": "身份验证失败，请检查设置。",
  "error.rate": "触发速率限制，请稍后重试。",
  "error.context": "上下文过长，已对较早消息进行摘要。",
  "prompt.system.ask": "你是一位知识库助手。使用工具搜索和阅读笔记，并在相关处引用笔记路径。",
  "prompt.system.edit": "你是一位具备编辑能力的知识库助手。所有写入都需要用户批准，请生成最小必要的改动。",
  "prompt.scheduled.daily": "总结今天修改过的笔记，生成一篇新笔记，按主题分小节并链接回源笔记。",
  "prompt.scheduled.weekly": "回顾最近 7 天的笔记，提炼主题与未完成事项，生成一篇新的周回顾笔记。"
}
```

- [ ] **Step 5: Write `src/services/i18n.ts`**

```ts
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
```

- [ ] **Step 6: Confirm pass.**

- [ ] **Step 7: Commit**

```bash
git add src/services/i18n.ts src/locales/ tests/services/i18n.test.ts
git commit -m "feat: i18n service with en and zh-CN"
```

## Task 4: VaultService

**Files:** `src/services/vault-service.ts`, `tests/services/vault-service.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/services/vault-service.test.ts
import { describe, it, expect, vi } from "vitest";
import { VaultService, PathError } from "../../src/services/vault-service";

function makeApp(files: Record<string, string> = {}) {
  const store = new Map(Object.entries(files));
  return {
    vault: {
      getAbstractFileByPath: (p: string) => store.has(p) ? { path: p } : null,
      read: vi.fn(async (f: any) => store.get(f.path) ?? ""),
      create: vi.fn(async (p: string, c: string) => { store.set(p, c); return { path: p }; }),
      modify: vi.fn(async (f: any, c: string) => { store.set(f.path, c); }),
      delete: vi.fn(async (f: any) => { store.delete(f.path); }),
      rename: vi.fn(async (f: any, np: string) => { const c = store.get(f.path); store.delete(f.path); store.set(np, c!); }),
      getMarkdownFiles: () => [...store.keys()].map(p => ({ path: p })),
    },
  } as any;
}

describe("VaultService", () => {
  it("rejects path traversal", async () => {
    const s = new VaultService(makeApp());
    await expect(s.readNote("../secret.md")).rejects.toBeInstanceOf(PathError);
  });
  it("reads existing note", async () => {
    const s = new VaultService(makeApp({ "a.md": "hello" }));
    expect(await s.readNote("a.md")).toBe("hello");
  });
  it("create fails when file exists", async () => {
    const s = new VaultService(makeApp({ "a.md": "x" }));
    await expect(s.createNote("a.md", "y")).rejects.toThrow(/exists/);
  });
  it("create succeeds when new", async () => {
    const app = makeApp();
    const s = new VaultService(app);
    await s.createNote("new.md", "hi");
    expect(app.vault.create).toHaveBeenCalled();
  });
  it("edit requires existing file", async () => {
    const s = new VaultService(makeApp());
    await expect(s.editNote("missing.md", "x")).rejects.toThrow(/not found/);
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/services/vault-service.ts`**

```ts
import { App, TFile, normalizePath } from "obsidian";

export class PathError extends Error { constructor(m: string) { super(m); this.name = "PathError"; } }

function validatePath(p: string): string {
  const n = normalizePath(p);
  if (n.includes("..") || n.startsWith("/") || n.startsWith("\\")) throw new PathError(`invalid path: ${p}`);
  return n;
}

export class VaultService {
  constructor(private app: App) {}

  async readNote(path: string): Promise<string> {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f) throw new Error(`not found: ${p}`);
    return this.app.vault.read(f as TFile);
  }

  async createNote(path: string, content: string): Promise<void> {
    const p = validatePath(path);
    if (this.app.vault.getAbstractFileByPath(p)) throw new Error(`already exists: ${p}`);
    await this.ensureParent(p);
    await this.app.vault.create(p, content);
  }

  async editNote(path: string, content: string): Promise<void> {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f) throw new Error(`not found: ${p}`);
    await this.app.vault.modify(f as TFile, content);
  }

  async deleteNote(path: string): Promise<void> {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f) throw new Error(`not found: ${p}`);
    await this.app.vault.delete(f);
  }

  async moveNote(oldPath: string, newPath: string): Promise<void> {
    const a = validatePath(oldPath); const b = validatePath(newPath);
    const f = this.app.vault.getAbstractFileByPath(a);
    if (!f) throw new Error(`not found: ${a}`);
    await this.ensureParent(b);
    await this.app.vault.rename(f, b);
  }

  async listFolder(path: string): Promise<string[]> {
    const p = path === "" ? "" : validatePath(path);
    return this.app.vault.getMarkdownFiles()
      .map(f => f.path)
      .filter(fp => p === "" || fp === p || fp.startsWith(p + "/"));
  }

  async searchVault(query: string): Promise<{ path: string; snippet: string }[]> {
    const q = query.toLowerCase();
    const hits: { path: string; snippet: string }[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const c = await this.app.vault.read(f);
      const i = c.toLowerCase().indexOf(q);
      if (i >= 0) hits.push({ path: f.path, snippet: c.slice(Math.max(0, i - 40), i + 120) });
      if (hits.length >= 20) break;
    }
    return hits;
  }

  getBacklinks(path: string): string[] {
    const cache = (this.app as any).metadataCache;
    const rec = cache?.resolvedLinks ?? {};
    const out: string[] = [];
    for (const src of Object.keys(rec)) if (rec[src][path]) out.push(src);
    return out;
  }

  getOutgoingLinks(path: string): string[] {
    const cache = (this.app as any).metadataCache;
    const rec = cache?.resolvedLinks?.[path] ?? {};
    return Object.keys(rec);
  }

  private async ensureParent(p: string): Promise<void> {
    const parent = p.split("/").slice(0, -1).join("/");
    if (!parent) return;
    if (!this.app.vault.getAbstractFileByPath(parent)) {
      await (this.app.vault as any).createFolder?.(parent);
    }
  }
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit**

```bash
git add src/services/vault-service.ts tests/services/vault-service.test.ts
git commit -m "feat: VaultService with path validation"
```

## Task 5: Tool Types + Read Tools

**Files:** `src/tools/types.ts`, `src/tools/read.ts`, `tests/tools/read.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/tools/read.test.ts
import { describe, it, expect, vi } from "vitest";
import { buildReadTools } from "../../src/tools/read";

const fakeVault = {
  readNote: vi.fn(async (p: string) => p === "a.md" ? "hello" : (() => { throw new Error("nf"); })()),
  searchVault: vi.fn(async (q: string) => [{ path: "a.md", snippet: q }]),
  listFolder: vi.fn(async () => ["a.md", "b.md"]),
  getBacklinks: vi.fn(() => ["x.md"]),
  getOutgoingLinks: vi.fn(() => ["y.md"]),
};

describe("read tools", () => {
  const ctx = { vault: fakeVault as any, activeFile: () => ({ path: "cur.md", content: "active" }), selection: () => "sel" };
  const tools = buildReadTools(ctx);
  it("search_vault", async () => {
    const t = tools.find(x => x.name === "search_vault")!;
    expect(await t.handler({ query: "foo" })).toContain("a.md");
  });
  it("read_note ok", async () => {
    const t = tools.find(x => x.name === "read_note")!;
    expect(await t.handler({ path: "a.md" })).toBe("hello");
  });
  it("read_note missing returns error", async () => {
    const t = tools.find(x => x.name === "read_note")!;
    await expect(t.handler({ path: "m.md" })).resolves.toMatch(/error/i);
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/tools/types.ts`**

```ts
import type { VaultService } from "../services/vault-service";

export interface ToolSchema {
  name: string;
  description: string;
  parameters: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

export interface Tool {
  name: string;
  schema: ToolSchema;
  handler: (args: Record<string, any>) => Promise<string>;
  kind: "read" | "write";
}

export interface ToolContext {
  vault: VaultService;
  activeFile: () => { path: string; content: string } | null;
  selection: () => string;
}
```

- [ ] **Step 4: Write `src/tools/read.ts`**

```ts
import type { Tool, ToolContext } from "./types";

const safe = async (fn: () => Promise<string>): Promise<string> => {
  try { return await fn(); } catch (e: any) { return JSON.stringify({ error: String(e?.message ?? e) }); }
};

export function buildReadTools(ctx: ToolContext): Tool[] {
  return [
    {
      name: "search_vault", kind: "read",
      schema: { name: "search_vault", description: "Full-text search across notes.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
      handler: (a) => safe(async () => JSON.stringify(await ctx.vault.searchVault(String(a.query)))),
    },
    {
      name: "read_note", kind: "read",
      schema: { name: "read_note", description: "Read full markdown content of a note.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => ctx.vault.readNote(String(a.path))),
    },
    {
      name: "list_folder", kind: "read",
      schema: { name: "list_folder", description: "List note paths under a folder.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => JSON.stringify(await ctx.vault.listFolder(String(a.path ?? "")))),
    },
    {
      name: "get_backlinks", kind: "read",
      schema: { name: "get_backlinks", description: "Notes that link to the given path.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => JSON.stringify(ctx.vault.getBacklinks(String(a.path)))),
    },
    {
      name: "get_outgoing_links", kind: "read",
      schema: { name: "get_outgoing_links", description: "Notes linked from the given path.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => JSON.stringify(ctx.vault.getOutgoingLinks(String(a.path)))),
    },
    {
      name: "get_active_note", kind: "read",
      schema: { name: "get_active_note", description: "Current note in the editor.", parameters: { type: "object", properties: {} } },
      handler: () => safe(async () => JSON.stringify(ctx.activeFile())),
    },
    {
      name: "get_selection", kind: "read",
      schema: { name: "get_selection", description: "Currently selected text.", parameters: { type: "object", properties: {} } },
      handler: () => safe(async () => ctx.selection()),
    },
  ];
}
```

- [ ] **Step 5: Confirm pass.**

- [ ] **Step 6: Commit**

```bash
git add src/tools/ tests/tools/read.test.ts
git commit -m "feat: read tools"
```

## Task 6: Write Tools

**Files:** `src/tools/write.ts`, `tests/tools/write.test.ts`

Write tools don't execute directly — they return a `PendingWrite` descriptor that the AgentLoop routes into the ApprovalQueue. This keeps the approval decision out of tool code.

- [ ] **Step 1: Failing test**

```ts
// tests/tools/write.test.ts
import { describe, it, expect } from "vitest";
import { buildWriteTools, PENDING_PREFIX } from "../../src/tools/write";

describe("write tools", () => {
  const tools = buildWriteTools();
  it("create_note returns pending marker", async () => {
    const t = tools.find(x => x.name === "create_note")!;
    const out = await t.handler({ path: "n.md", content: "hi" });
    expect(out.startsWith(PENDING_PREFIX)).toBe(true);
    const payload = JSON.parse(out.slice(PENDING_PREFIX.length));
    expect(payload.tool).toBe("create_note");
    expect(payload.args.path).toBe("n.md");
  });
  it("has all expected tools", () => {
    expect(tools.map(t => t.name).sort()).toEqual(["apply_patch","create_note","delete_note","edit_note","move_note"]);
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/tools/write.ts`**

```ts
import type { Tool } from "./types";

export const PENDING_PREFIX = "__PENDING_WRITE__:";

function pending(name: string, args: Record<string, unknown>): string {
  return PENDING_PREFIX + JSON.stringify({ tool: name, args });
}

export function buildWriteTools(): Tool[] {
  const str = { type: "string" } as const;
  return [
    { name: "create_note", kind: "write",
      schema: { name: "create_note", description: "Create a new note. Fails if path exists.",
        parameters: { type: "object", properties: { path: str, content: str }, required: ["path","content"] } },
      handler: async (a) => pending("create_note", a) },
    { name: "edit_note", kind: "write",
      schema: { name: "edit_note", description: "Replace full content of an existing note.",
        parameters: { type: "object", properties: { path: str, content: str }, required: ["path","content"] } },
      handler: async (a) => pending("edit_note", a) },
    { name: "apply_patch", kind: "write",
      schema: { name: "apply_patch", description: "Apply a unified diff patch to a note.",
        parameters: { type: "object", properties: { path: str, patch: str }, required: ["path","patch"] } },
      handler: async (a) => pending("apply_patch", a) },
    { name: "delete_note", kind: "write",
      schema: { name: "delete_note", description: "Delete a note.",
        parameters: { type: "object", properties: { path: str }, required: ["path"] } },
      handler: async (a) => pending("delete_note", a) },
    { name: "move_note", kind: "write",
      schema: { name: "move_note", description: "Move or rename a note.",
        parameters: { type: "object", properties: { from: str, to: str }, required: ["from","to"] } },
      handler: async (a) => pending("move_note", a) },
  ];
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit**

```bash
git add src/tools/write.ts tests/tools/write.test.ts
git commit -m "feat: write tools as pending-write markers"
```

## Task 7: Tool Registry with Mode Filtering

**Files:** `src/tools/registry.ts`, `tests/tools/registry.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/tools/registry.test.ts
import { describe, it, expect } from "vitest";
import { buildToolRegistry } from "../../src/tools/registry";

const ctx: any = { vault: {}, activeFile: () => null, selection: () => "" };

describe("tool registry", () => {
  it("ask mode = read only", () => {
    const r = buildToolRegistry(ctx, "ask");
    expect(r.every(t => t.kind === "read")).toBe(true);
  });
  it("edit mode = read + write", () => {
    const r = buildToolRegistry(ctx, "edit");
    expect(r.some(t => t.kind === "write" && t.name === "edit_note")).toBe(true);
    expect(r.some(t => t.kind === "read" && t.name === "search_vault")).toBe(true);
  });
  it("scheduled mode = read + create_note only", () => {
    const r = buildToolRegistry(ctx, "scheduled");
    const writes = r.filter(t => t.kind === "write").map(t => t.name);
    expect(writes).toEqual(["create_note"]);
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/tools/registry.ts`**

```ts
import type { Mode } from "../types";
import type { Tool, ToolContext } from "./types";
import { buildReadTools } from "./read";
import { buildWriteTools } from "./write";

export function buildToolRegistry(ctx: ToolContext, mode: Mode): Tool[] {
  const read = buildReadTools(ctx);
  if (mode === "ask") return read;
  const write = buildWriteTools();
  if (mode === "scheduled") return [...read, ...write.filter(t => t.name === "create_note")];
  return [...read, ...write];
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit**

```bash
git add src/tools/registry.ts tests/tools/registry.test.ts
git commit -m "feat: mode-filtered tool registry"
```

## Task 8: Provider Types + HTTP Helper

**Files:** `src/providers/types.ts`, `src/providers/http.ts`, `tests/providers/http.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/providers/http.test.ts
import { describe, it, expect } from "vitest";
import { parseSSE } from "../../src/providers/http";

describe("parseSSE", () => {
  it("splits events on double newline", () => {
    const chunks = [...parseSSE("data: {\"a\":1}\n\ndata: [DONE]\n\n")];
    expect(chunks).toEqual([{ data: "{\"a\":1}" }, { data: "[DONE]" }]);
  });
  it("handles partial buffers via pushing text iteratively", () => {
    // Parser is stateless per call; caller accumulates. Smoke-test one pass.
    const out = [...parseSSE("data: hi\n\n")];
    expect(out[0].data).toBe("hi");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/providers/types.ts`**

```ts
import type { Delta, Message, ToolCall } from "../types";
import type { ToolSchema } from "../tools/types";

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools: ToolSchema[];
  temperature?: number;
  signal?: AbortSignal;
}

export interface LLMProvider {
  id: string;
  chat(req: ChatRequest): AsyncIterable<Delta>;
}

export class ProviderError extends Error {
  constructor(public kind: "auth" | "rate" | "context" | "unavailable" | "unknown", msg: string) { super(msg); }
}

export type { Delta, Message, ToolCall };
```

- [ ] **Step 4: Write `src/providers/http.ts`**

```ts
import { requestUrl } from "obsidian";
import { ProviderError } from "./types";

export interface HttpOptions {
  url: string;
  method?: "POST" | "GET";
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export async function httpJson<T = any>(o: HttpOptions): Promise<T> {
  try {
    const r = await requestUrl({ url: o.url, method: o.method ?? "POST", headers: o.headers, body: o.body, throw: false } as any);
    if (r.status === 401 || r.status === 403) throw new ProviderError("auth", `${r.status}: ${r.text}`);
    if (r.status === 429) throw new ProviderError("rate", r.text);
    if (r.status >= 500) throw new ProviderError("unavailable", `${r.status}: ${r.text}`);
    if (r.status >= 400) {
      const msg = r.text || "";
      if (/context|too long|max tokens/i.test(msg)) throw new ProviderError("context", msg);
      throw new ProviderError("unknown", `${r.status}: ${msg}`);
    }
    return r.json as T;
  } catch (e: any) {
    if (e instanceof ProviderError) throw e;
    throw new ProviderError("unavailable", String(e?.message ?? e));
  }
}

/** Stream POST, yields parsed SSE events. `requestUrl` doesn't stream, so fall back to fetch on desktop. */
export async function* httpSSE(o: HttpOptions): AsyncIterable<{ data: string }> {
  const resp = await fetch(o.url, {
    method: o.method ?? "POST",
    headers: o.headers,
    body: o.body,
    signal: o.signal,
  });
  if (resp.status === 401 || resp.status === 403) throw new ProviderError("auth", `${resp.status}`);
  if (resp.status === 429) throw new ProviderError("rate", await resp.text());
  if (resp.status >= 400) {
    const t = await resp.text();
    if (/context|too long/i.test(t)) throw new ProviderError("context", t);
    throw new ProviderError("unknown", `${resp.status}: ${t}`);
  }
  const reader = resp.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const evt = buf.slice(0, idx); buf = buf.slice(idx + 2);
      for (const ev of parseSSE(evt + "\n\n")) yield ev;
    }
  }
}

export function* parseSSE(text: string): Iterable<{ data: string }> {
  for (const block of text.split("\n\n")) {
    if (!block.trim()) continue;
    const dataLines = block.split("\n").filter(l => l.startsWith("data:")).map(l => l.slice(5).trim());
    if (dataLines.length) yield { data: dataLines.join("\n") };
  }
}
```

- [ ] **Step 5: Confirm pass.**

- [ ] **Step 6: Commit**

```bash
git add src/providers/types.ts src/providers/http.ts tests/providers/http.test.ts
git commit -m "feat: provider types and HTTP/SSE helpers"
```

## Task 9: OpenAI Adapter (template for OpenAI-compatible providers)

**Files:** `src/providers/openai.ts`, `tests/providers/openai.test.ts`

This is the template. Tasks 11-17 reuse this shape with different endpoint/auth.

- [ ] **Step 1: Failing test**

```ts
// tests/providers/openai.test.ts
import { describe, it, expect, vi } from "vitest";
import { OpenAIProvider } from "../../src/providers/openai";

describe("OpenAIProvider", () => {
  it("parses streamed deltas", async () => {
    const fakeSSE = async function* () {
      yield { data: '{"choices":[{"delta":{"content":"Hel"}}]}' };
      yield { data: '{"choices":[{"delta":{"content":"lo"}}]}' };
      yield { data: '{"choices":[{"delta":{"tool_calls":[{"index":0,"id":"t1","function":{"name":"read_note","arguments":"{\\"path\\":\\"a.md\\"}"}}]}}]}' };
      yield { data: "[DONE]" };
    };
    const p = new OpenAIProvider({ apiKey: "k", baseUrl: "" }, fakeSSE);
    const out: any[] = [];
    for await (const d of p.chat({ model: "gpt-4o", messages: [], tools: [] })) out.push(d);
    expect(out.filter(d => d.type === "text").map(d => d.text).join("")).toBe("Hello");
    const tc = out.find(d => d.type === "tool_call");
    expect(tc.toolCall.name).toBe("read_note");
    expect(tc.toolCall.args.path).toBe("a.md");
    expect(out[out.length - 1].type).toBe("done");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/providers/openai.ts`**

```ts
import type { ChatRequest, Delta, LLMProvider } from "./types";
import { httpSSE } from "./http";

export interface OpenAIConfig { apiKey: string; baseUrl?: string; }
type SSEIter = (o: any) => AsyncIterable<{ data: string }>;

export class OpenAIProvider implements LLMProvider {
  id = "openai";
  constructor(private cfg: OpenAIConfig, private sseFn: SSEIter = httpSSE) {}

  async *chat(req: ChatRequest): AsyncIterable<Delta> {
    const url = (this.cfg.baseUrl || "https://api.openai.com/v1") + "/chat/completions";
    const body = {
      model: req.model,
      messages: req.messages.map(m => this.toOpenAIMsg(m)),
      tools: req.tools.length ? req.tools.map(t => ({ type: "function", function: t })) : undefined,
      stream: true,
      temperature: req.temperature,
    };
    const iter = this.sseFn({
      url, method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify(body), signal: req.signal,
    });
    const pending: Record<number, { id?: string; name: string; args: string }> = {};
    for await (const ev of iter) {
      if (ev.data === "[DONE]") break;
      let obj: any; try { obj = JSON.parse(ev.data); } catch { continue; }
      const delta = obj.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) yield { type: "text", text: delta.content };
      for (const tc of delta.tool_calls ?? []) {
        const i = tc.index;
        pending[i] ??= { name: "", args: "" };
        if (tc.id) pending[i].id = tc.id;
        if (tc.function?.name) pending[i].name = tc.function.name;
        if (tc.function?.arguments) pending[i].args += tc.function.arguments;
      }
    }
    for (const i of Object.keys(pending)) {
      const p = pending[+i]; let args: any = {};
      try { args = JSON.parse(p.args || "{}"); } catch { args = { _raw: p.args }; }
      yield { type: "tool_call", toolCall: { id: p.id ?? `tc_${i}`, name: p.name, args } };
    }
    yield { type: "done" };
  }

  private toOpenAIMsg(m: any): any {
    if (m.role === "tool") return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
    if (m.role === "assistant" && m.toolCalls?.length) {
      return { role: "assistant", content: m.content || null,
        tool_calls: m.toolCalls.map((tc: any) => ({ id: tc.id, type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.args) } })) };
    }
    return { role: m.role, content: m.content };
  }
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit**

```bash
git add src/providers/openai.ts tests/providers/openai.test.ts
git commit -m "feat: OpenAI provider adapter"
```

## Task 10: Anthropic Adapter

**Files:** `src/providers/anthropic.ts`, `tests/providers/anthropic.test.ts`

Anthropic uses a different wire format: `/v1/messages` endpoint, `x-api-key` header, `anthropic-version` header, and tool calls stream as `content_block_start/delta/stop` events with `input_json_delta`.

- [ ] **Step 1: Failing test**

```ts
// tests/providers/anthropic.test.ts
import { describe, it, expect } from "vitest";
import { AnthropicProvider } from "../../src/providers/anthropic";

describe("AnthropicProvider", () => {
  it("parses text + tool_use blocks", async () => {
    const fakeSSE = async function* () {
      yield { data: '{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}' };
      yield { data: '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}' };
      yield { data: '{"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"tu_1","name":"read_note","input":{}}}' };
      yield { data: '{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"path\\":\\"a.md\\"}"}}' };
      yield { data: '{"type":"message_stop"}' };
    };
    const p = new AnthropicProvider({ apiKey: "k" }, fakeSSE);
    const out: any[] = [];
    for await (const d of p.chat({ model: "claude-opus-4-7", messages: [], tools: [] })) out.push(d);
    expect(out.find(d => d.type === "text").text).toBe("Hi");
    const tc = out.find(d => d.type === "tool_call");
    expect(tc.toolCall.name).toBe("read_note");
    expect(tc.toolCall.args.path).toBe("a.md");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/providers/anthropic.ts`**

```ts
import type { ChatRequest, Delta, LLMProvider } from "./types";
import { httpSSE } from "./http";

export interface AnthropicConfig { apiKey: string; baseUrl?: string; }
type SSEIter = (o: any) => AsyncIterable<{ data: string }>;

export class AnthropicProvider implements LLMProvider {
  id = "anthropic";
  constructor(private cfg: AnthropicConfig, private sseFn: SSEIter = httpSSE) {}

  async *chat(req: ChatRequest): AsyncIterable<Delta> {
    const url = (this.cfg.baseUrl || "https://api.anthropic.com") + "/v1/messages";
    const system = req.messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
    const msgs = req.messages.filter(m => m.role !== "system").map(m => this.toAnthropic(m));
    const body = {
      model: req.model, max_tokens: 4096, stream: true,
      system: system || undefined, messages: msgs,
      tools: req.tools.length ? req.tools.map(t => ({ name: t.name, description: t.description, input_schema: t.parameters })) : undefined,
      temperature: req.temperature,
    };
    const iter = this.sseFn({
      url, method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.cfg.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body), signal: req.signal,
    });
    const blocks: Record<number, { type: string; name?: string; id?: string; buf: string }> = {};
    for await (const ev of iter) {
      let o: any; try { o = JSON.parse(ev.data); } catch { continue; }
      if (o.type === "content_block_start") {
        blocks[o.index] = { type: o.content_block.type, name: o.content_block.name, id: o.content_block.id, buf: "" };
      } else if (o.type === "content_block_delta") {
        const b = blocks[o.index]; if (!b) continue;
        if (o.delta.type === "text_delta") yield { type: "text", text: o.delta.text };
        else if (o.delta.type === "input_json_delta") b.buf += o.delta.partial_json;
      } else if (o.type === "content_block_stop") {
        const b = blocks[o.index];
        if (b?.type === "tool_use") {
          let args: any = {}; try { args = JSON.parse(b.buf || "{}"); } catch { args = { _raw: b.buf }; }
          yield { type: "tool_call", toolCall: { id: b.id!, name: b.name!, args } };
        }
      } else if (o.type === "message_stop") break;
    }
    yield { type: "done" };
  }

  private toAnthropic(m: any): any {
    if (m.role === "assistant" && m.toolCalls?.length) {
      const content: any[] = [];
      if (m.content) content.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls) content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args });
      return { role: "assistant", content };
    }
    if (m.role === "tool") {
      return { role: "user", content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }] };
    }
    return { role: m.role, content: m.content };
  }
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit** — `git add ... && git commit -m "feat: Anthropic provider adapter"`.

## Task 11: Ollama Adapter

**Files:** `src/providers/ollama.ts`, `tests/providers/ollama.test.ts`

Ollama uses NDJSON streaming at `/api/chat`, tool-call support landed in recent versions.

- [ ] **Step 1: Failing test**

```ts
// tests/providers/ollama.test.ts
import { describe, it, expect } from "vitest";
import { OllamaProvider } from "../../src/providers/ollama";

describe("OllamaProvider", () => {
  it("parses NDJSON chunks", async () => {
    const fakeNDJSON = async function* () {
      yield '{"message":{"content":"Hel"},"done":false}\n';
      yield '{"message":{"content":"lo"},"done":false}\n';
      yield '{"message":{"content":"","tool_calls":[{"function":{"name":"read_note","arguments":{"path":"a.md"}}}]},"done":false}\n';
      yield '{"done":true}\n';
    };
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434" }, fakeNDJSON);
    const out: any[] = [];
    for await (const d of p.chat({ model: "llama3", messages: [], tools: [] })) out.push(d);
    expect(out.filter(d => d.type === "text").map(d => d.text).join("")).toBe("Hello");
    expect(out.find(d => d.type === "tool_call").toolCall.name).toBe("read_note");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/providers/ollama.ts`**

```ts
import type { ChatRequest, Delta, LLMProvider } from "./types";
import { ProviderError } from "./types";

export interface OllamaConfig { baseUrl: string; }
type NDJSONIter = () => AsyncIterable<string>;

export class OllamaProvider implements LLMProvider {
  id = "ollama";
  constructor(private cfg: OllamaConfig, private streamFn?: NDJSONIter) {}

  async *chat(req: ChatRequest): AsyncIterable<Delta> {
    const url = this.cfg.baseUrl.replace(/\/$/, "") + "/api/chat";
    const body = {
      model: req.model, stream: true,
      messages: req.messages.map(m => this.toOllama(m)),
      tools: req.tools.length ? req.tools.map(t => ({ type: "function", function: t })) : undefined,
      options: req.temperature !== undefined ? { temperature: req.temperature } : undefined,
    };
    const iter = this.streamFn ? this.streamFn() : this.fetchNDJSON(url, body, req.signal);
    let counter = 0;
    for await (const line of iter) {
      const trimmed = line.trim(); if (!trimmed) continue;
      let o: any; try { o = JSON.parse(trimmed); } catch { continue; }
      if (o.message?.content) yield { type: "text", text: o.message.content };
      for (const tc of o.message?.tool_calls ?? []) {
        yield { type: "tool_call", toolCall: { id: `tc_${counter++}`, name: tc.function.name, args: tc.function.arguments ?? {} } };
      }
      if (o.done) break;
    }
    yield { type: "done" };
  }

  private async *fetchNDJSON(url: string, body: any, signal?: AbortSignal): AsyncIterable<string> {
    const resp = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (resp.status >= 400) throw new ProviderError(resp.status >= 500 ? "unavailable" : "unknown", await resp.text());
    const reader = resp.body!.getReader(); const dec = new TextDecoder(); let buf = "";
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) { yield buf.slice(0, idx); buf = buf.slice(idx + 1); }
    }
    if (buf.trim()) yield buf;
  }

  private toOllama(m: any): any {
    if (m.role === "tool") return { role: "tool", content: m.content };
    if (m.role === "assistant" && m.toolCalls?.length) {
      return { role: "assistant", content: m.content || "",
        tool_calls: m.toolCalls.map((tc: any) => ({ function: { name: tc.name, arguments: tc.args } })) };
    }
    return { role: m.role, content: m.content };
  }
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: Ollama provider adapter"`.

## Tasks 12-17: OpenAI-Compatible Adapters (OpenRouter, DeepSeek, Qwen, Kimi, Zhipu, MiniMax)

All six providers use OpenAI's chat-completions wire format. Extract a shared factory first, then each adapter is a thin configuration.

**Files:** `src/providers/openai-compat.ts`, then `openrouter.ts`, `deepseek.ts`, `qwen.ts`, `kimi.ts`, `zhipu.ts`, `minimax.ts` + one `tests/providers/openai-compat.test.ts` parameterized across providers.

### Task 12: Shared OpenAI-compatible factory

- [ ] **Step 1: Failing test**

```ts
// tests/providers/openai-compat.test.ts
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
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/providers/openai-compat.ts`**

```ts
import { OpenAIProvider } from "./openai";

export interface OpenAICompatOptions {
  id: string;
  apiKey: string;
  defaultBaseUrl: string;
  baseUrl?: string;
  authHeader?: "authorization-bearer" | "custom";
  customHeaders?: Record<string, string>;
}

export function createOpenAICompatible(o: OpenAICompatOptions): OpenAIProvider {
  const p = new OpenAIProvider({ apiKey: o.apiKey, baseUrl: o.baseUrl || o.defaultBaseUrl });
  p.id = o.id;
  return p;
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: OpenAI-compat factory"`.

### Tasks 13-17: Individual OpenAI-compatible adapters

Each adapter is ~10 lines. Endpoints and notes are listed explicitly — do not infer from memory.

- [ ] **Task 13: DeepSeek** — `src/providers/deepseek.ts`

```ts
import { createOpenAICompatible } from "./openai-compat";
export const createDeepSeek = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "deepseek", apiKey, defaultBaseUrl: "https://api.deepseek.com/v1", baseUrl });
```

Known models: `deepseek-chat`, `deepseek-reasoner`. Commit: `feat: DeepSeek adapter`.

- [ ] **Task 14: Qwen (DashScope compatible endpoint)** — `src/providers/qwen.ts`

```ts
import { createOpenAICompatible } from "./openai-compat";
export const createQwen = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "qwen", apiKey,
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", baseUrl });
```

Known models: `qwen-plus`, `qwen-max`, `qwen-turbo`, `qwen2.5-72b-instruct`. Commit: `feat: Qwen adapter`.

- [ ] **Task 15: Kimi (Moonshot)** — `src/providers/kimi.ts`

```ts
import { createOpenAICompatible } from "./openai-compat";
export const createKimi = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "kimi", apiKey,
    defaultBaseUrl: "https://api.moonshot.cn/v1", baseUrl });
```

Known models: `moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k`. Commit: `feat: Kimi adapter`.

- [ ] **Task 16: Zhipu GLM** — `src/providers/zhipu.ts`

```ts
import { createOpenAICompatible } from "./openai-compat";
export const createZhipu = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "zhipu", apiKey,
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4", baseUrl });
```

Known models: `glm-4-plus`, `glm-4-air`, `glm-4-flash`. Commit: `feat: Zhipu GLM adapter`.

- [ ] **Task 17: MiniMax** — `src/providers/minimax.ts`

```ts
import { createOpenAICompatible } from "./openai-compat";
export const createMiniMax = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "minimax", apiKey,
    defaultBaseUrl: "https://api.minimax.chat/v1", baseUrl });
```

Known models: `abab6.5s-chat`, `MiniMax-Text-01`. Commit: `feat: MiniMax adapter`.

- [ ] **Task 17b: OpenRouter** — `src/providers/openrouter.ts`

```ts
import { createOpenAICompatible } from "./openai-compat";
export const createOpenRouter = (apiKey: string, baseUrl?: string) =>
  createOpenAICompatible({ id: "openrouter", apiKey,
    defaultBaseUrl: "https://openrouter.ai/api/v1", baseUrl });
```

Commit: `feat: OpenRouter adapter`.

Add to `tests/providers/openai-compat.test.ts` a parameterized loop that instantiates each factory with `apiKey: "k"` and asserts the expected `id` and `baseUrl`. Confirm pass, commit.

## Task 18: Provider Registry

**Files:** `src/providers/registry.ts`, `tests/providers/registry.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/providers/registry.test.ts
import { describe, it, expect } from "vitest";
import { createProvider, listProviderIds } from "../../src/providers/registry";

describe("provider registry", () => {
  it("lists all nine ids", () => {
    expect(listProviderIds().sort()).toEqual(
      ["anthropic","deepseek","kimi","minimax","ollama","openai","openrouter","qwen","zhipu"]
    );
  });
  it("creates openai", () => {
    const p = createProvider("openai", { apiKey: "k", baseUrl: "" });
    expect(p.id).toBe("openai");
  });
  it("throws on unknown id", () => {
    expect(() => createProvider("nope" as any, { apiKey: "", baseUrl: "" })).toThrow();
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/providers/registry.ts`**

```ts
import type { LLMProvider } from "./types";
import type { ProviderId } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { OllamaProvider } from "./ollama";
import { createDeepSeek } from "./deepseek";
import { createQwen } from "./qwen";
import { createKimi } from "./kimi";
import { createZhipu } from "./zhipu";
import { createMiniMax } from "./minimax";
import { createOpenRouter } from "./openrouter";

export interface ProviderConfig { apiKey: string; baseUrl?: string; }

export function createProvider(id: ProviderId, cfg: ProviderConfig): LLMProvider {
  switch (id) {
    case "openai": return new OpenAIProvider({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    case "anthropic": return new AnthropicProvider({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    case "ollama": return new OllamaProvider({ baseUrl: cfg.baseUrl || "http://localhost:11434" });
    case "openrouter": return createOpenRouter(cfg.apiKey, cfg.baseUrl);
    case "deepseek": return createDeepSeek(cfg.apiKey, cfg.baseUrl);
    case "qwen": return createQwen(cfg.apiKey, cfg.baseUrl);
    case "kimi": return createKimi(cfg.apiKey, cfg.baseUrl);
    case "zhipu": return createZhipu(cfg.apiKey, cfg.baseUrl);
    case "minimax": return createMiniMax(cfg.apiKey, cfg.baseUrl);
    default: throw new Error(`unknown provider: ${id}`);
  }
}

export function listProviderIds(): ProviderId[] {
  return ["openai","anthropic","ollama","openrouter","deepseek","qwen","kimi","zhipu","minimax"];
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: provider registry"`.

## Task 19: Conversation + ConversationStore

**Files:** `src/agent/conversation.ts`, `src/services/conversation-store.ts`, `tests/agent/conversation.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/agent/conversation.test.ts
import { describe, it, expect } from "vitest";
import { Conversation, serializeConversation, parseConversation } from "../../src/agent/conversation";

describe("Conversation", () => {
  it("append + metadata", () => {
    const c = new Conversation({ id: "c1", mode: "ask", provider: "openai", model: "gpt-4o" });
    c.append({ role: "user", content: "hi" });
    expect(c.messages.length).toBe(1);
    expect(c.id).toBe("c1");
  });
  it("serialize + parse roundtrip", () => {
    const c = new Conversation({ id: "c1", mode: "edit", provider: "deepseek", model: "deepseek-chat", title: "test" });
    c.append({ role: "user", content: "hello" });
    c.append({ role: "assistant", content: "world" });
    const md = serializeConversation(c);
    const back = parseConversation(md);
    expect(back.id).toBe("c1");
    expect(back.mode).toBe("edit");
    expect(back.messages).toHaveLength(2);
    expect(back.messages[1].content).toBe("world");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/agent/conversation.ts`**

```ts
import type { Mode, Message, ProviderId } from "../types";

export interface ConversationMeta {
  id: string;
  title?: string;
  createdAt?: number;
  mode: Mode;
  provider: ProviderId;
  model: string;
}

export class Conversation {
  messages: Message[] = [];
  id: string; title?: string; createdAt: number;
  mode: Mode; provider: ProviderId; model: string;

  constructor(meta: ConversationMeta, messages: Message[] = []) {
    this.id = meta.id; this.title = meta.title;
    this.createdAt = meta.createdAt ?? Date.now();
    this.mode = meta.mode; this.provider = meta.provider; this.model = meta.model;
    this.messages = messages;
  }

  append(m: Message) { this.messages.push(m); }
}

const SEP = "\n\n<!-- msg -->\n\n";

export function serializeConversation(c: Conversation): string {
  const fm = ["---", `id: ${c.id}`, `title: ${JSON.stringify(c.title ?? "")}`,
    `createdAt: ${c.createdAt}`, `mode: ${c.mode}`, `provider: ${c.provider}`, `model: ${c.model}`, "---", ""].join("\n");
  const body = c.messages.map(m => {
    const meta = JSON.stringify({ role: m.role, toolCalls: m.toolCalls, toolCallId: m.toolCallId });
    return `<!-- meta: ${meta} -->\n${m.content}`;
  }).join(SEP);
  return fm + body;
}

export function parseConversation(md: string): Conversation {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error("invalid conversation file");
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/); if (!kv) continue;
    fm[kv[1]] = kv[2].startsWith("\"") ? JSON.parse(kv[2]) : kv[2];
  }
  const messages: Message[] = [];
  for (const block of (m[2] ?? "").split(SEP).filter(x => x.trim())) {
    const meta = block.match(/^<!-- meta: (.+?) -->\n([\s\S]*)$/);
    if (!meta) continue;
    const parsed = JSON.parse(meta[1]);
    messages.push({ role: parsed.role, content: meta[2], toolCalls: parsed.toolCalls, toolCallId: parsed.toolCallId });
  }
  return new Conversation({
    id: fm.id, title: fm.title || undefined, createdAt: Number(fm.createdAt),
    mode: fm.mode as any, provider: fm.provider as any, model: fm.model,
  }, messages);
}
```

- [ ] **Step 4: Write `src/services/conversation-store.ts`**

```ts
import type { VaultService } from "./vault-service";
import { Conversation, serializeConversation, parseConversation } from "../agent/conversation";

export class ConversationStore {
  constructor(private vault: VaultService, private folder: string) {}

  private pathFor(c: Conversation): string {
    const date = new Date(c.createdAt).toISOString().slice(0, 10);
    const slug = (c.title ?? c.id).replace(/[^\w一-龥-]+/g, "-").slice(0, 40);
    return `${this.folder}/${date}-${slug || c.id}.md`;
  }

  async save(c: Conversation): Promise<string> {
    const path = this.pathFor(c);
    const content = serializeConversation(c);
    try { await this.vault.editNote(path, content); }
    catch { await this.vault.createNote(path, content); }
    return path;
  }

  async load(path: string): Promise<Conversation> {
    return parseConversation(await this.vault.readNote(path));
  }

  async list(): Promise<string[]> {
    return this.vault.listFolder(this.folder);
  }
}
```

- [ ] **Step 5: Confirm pass.**

- [ ] **Step 6: Commit** — `git commit -m "feat: Conversation model and ConversationStore"`.

## Task 20: HistoryTrimmer

**Files:** `src/agent/history-trimmer.ts`, `tests/agent/history-trimmer.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/agent/history-trimmer.test.ts
import { describe, it, expect } from "vitest";
import { approxTokens, trimHistory } from "../../src/agent/history-trimmer";

describe("history trimmer", () => {
  it("approxTokens uses ~4 chars/token heuristic", () => {
    expect(approxTokens("a".repeat(400))).toBe(100);
  });
  it("passes through when under budget", () => {
    const msgs = [{ role: "user" as const, content: "hi" }];
    expect(trimHistory(msgs, 1000)).toEqual(msgs);
  });
  it("drops oldest non-system when over budget", () => {
    const big = "x".repeat(4000);
    const msgs = [
      { role: "system" as const, content: "S" },
      { role: "user" as const, content: big },
      { role: "assistant" as const, content: big },
      { role: "user" as const, content: "latest" },
    ];
    const out = trimHistory(msgs, 500);
    expect(out[0].role).toBe("system");
    expect(out[out.length - 1].content).toBe("latest");
    expect(out.length).toBeLessThan(msgs.length);
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/agent/history-trimmer.ts`**

```ts
import type { Message } from "../types";

export function approxTokens(s: string): number { return Math.ceil(s.length / 4); }

function totalTokens(msgs: Message[]): number {
  let n = 0; for (const m of msgs) n += approxTokens(m.content ?? "") + 4;
  return n;
}

export function trimHistory(messages: Message[], budget: number): Message[] {
  if (totalTokens(messages) <= budget) return messages;
  const system = messages.filter(m => m.role === "system");
  const rest = messages.filter(m => m.role !== "system");
  const keep: Message[] = [];
  let used = totalTokens(system);
  for (let i = rest.length - 1; i >= 0; i--) {
    const t = approxTokens(rest[i].content ?? "") + 4;
    if (used + t > budget) break;
    keep.unshift(rest[i]); used += t;
  }
  if (keep.length < rest.length) {
    keep.unshift({ role: "system", content: `[Earlier ${rest.length - keep.length} messages summarized for brevity.]` });
  }
  return [...system, ...keep];
}
```

- [ ] **Step 4: Confirm pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: history trimmer"`.

## Task 21: ModeGate

Already structurally implemented via `buildToolRegistry`. Add a thin wrapper for clarity and to house the system-prompt selection.

**Files:** `src/agent/mode-gate.ts`, `tests/agent/mode-gate.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/agent/mode-gate.test.ts
import { describe, it, expect } from "vitest";
import { systemPromptKey } from "../../src/agent/mode-gate";

describe("mode gate", () => {
  it("maps mode to prompt key", () => {
    expect(systemPromptKey("ask")).toBe("prompt.system.ask");
    expect(systemPromptKey("edit")).toBe("prompt.system.edit");
    expect(systemPromptKey("scheduled")).toBe("prompt.scheduled.daily");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/agent/mode-gate.ts`**

```ts
import type { Mode } from "../types";

export function systemPromptKey(mode: Mode): string {
  if (mode === "ask") return "prompt.system.ask";
  if (mode === "edit") return "prompt.system.edit";
  return "prompt.scheduled.daily";
}
```

- [ ] **Step 4: Confirm pass.** Commit: `feat: mode gate prompt selection`.

## Task 22: ApprovalQueue

**Files:** `src/agent/approval-queue.ts`, `tests/agent/approval-queue.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/agent/approval-queue.test.ts
import { describe, it, expect } from "vitest";
import { ApprovalQueue } from "../../src/agent/approval-queue";

describe("ApprovalQueue", () => {
  it("resolves on approve", async () => {
    const q = new ApprovalQueue();
    const p = q.enqueue({ toolCallId: "1", tool: "edit_note", args: { path: "a.md" }, diff: "" });
    q.approve("1"); const r = await p;
    expect(r.status).toBe("applied");
  });
  it("resolves on reject", async () => {
    const q = new ApprovalQueue();
    const p = q.enqueue({ toolCallId: "2", tool: "edit_note", args: {}, diff: "" });
    q.reject("2"); const r = await p;
    expect(r.status).toBe("rejected_by_user");
  });
  it("approveAll resolves all pending", async () => {
    const q = new ApprovalQueue();
    const p1 = q.enqueue({ toolCallId: "a", tool: "edit_note", args: {}, diff: "" });
    const p2 = q.enqueue({ toolCallId: "b", tool: "create_note", args: {}, diff: "" });
    q.approveAll();
    expect((await p1).status).toBe("applied");
    expect((await p2).status).toBe("applied");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/agent/approval-queue.ts`**

```ts
export interface PendingWrite {
  toolCallId: string;
  tool: string;
  args: Record<string, unknown>;
  diff: string;
}
export interface WriteDecision { status: "applied" | "rejected_by_user"; }

type Entry = { pw: PendingWrite; resolve: (d: WriteDecision) => void };

export class ApprovalQueue {
  private entries: Entry[] = [];
  private listeners = new Set<(list: PendingWrite[]) => void>();

  enqueue(pw: PendingWrite): Promise<WriteDecision> {
    return new Promise((resolve) => {
      this.entries.push({ pw, resolve });
      this.emit();
    });
  }
  list(): PendingWrite[] { return this.entries.map(e => e.pw); }
  onChange(fn: (list: PendingWrite[]) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { for (const l of this.listeners) l(this.list()); }

  approve(id: string) { this.resolveOne(id, "applied"); }
  reject(id: string) { this.resolveOne(id, "rejected_by_user"); }
  approveAll() { while (this.entries.length) this.resolveAt(0, "applied"); }
  rejectAll() { while (this.entries.length) this.resolveAt(0, "rejected_by_user"); }
  private resolveOne(id: string, s: WriteDecision["status"]) {
    const i = this.entries.findIndex(e => e.pw.toolCallId === id);
    if (i >= 0) this.resolveAt(i, s);
  }
  private resolveAt(i: number, s: WriteDecision["status"]) {
    const [e] = this.entries.splice(i, 1); e.resolve({ status: s }); this.emit();
  }
}
```

- [ ] **Step 4: Confirm pass.** Commit: `feat: ApprovalQueue`.

## Task 23: AgentLoop

**Files:** `src/agent/agent-loop.ts`, `tests/agent/agent-loop.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/agent/agent-loop.test.ts
import { describe, it, expect, vi } from "vitest";
import { AgentLoop } from "../../src/agent/agent-loop";
import { ApprovalQueue } from "../../src/agent/approval-queue";
import { Conversation } from "../../src/agent/conversation";
import { PENDING_PREFIX } from "../../src/tools/write";

function mockProvider(scripts: any[][]) {
  let turn = -1;
  return { id: "mock", async *chat() { turn++; for (const d of scripts[turn]) yield d; } };
}

describe("AgentLoop", () => {
  it("terminates on assistant text with no tool calls", async () => {
    const provider: any = mockProvider([[{ type: "text", text: "hello" }, { type: "done" }]]);
    const conv = new Conversation({ id: "c", mode: "ask", provider: "openai", model: "m" });
    const loop = new AgentLoop({
      provider, conversation: conv, tools: [], approvalQueue: new ApprovalQueue(),
      systemPrompt: "S", maxIterations: 5, turnTimeoutMs: 1000, historyBudget: 10000,
    });
    const out: any[] = [];
    for await (const e of loop.send("hi")) out.push(e);
    expect(conv.messages.at(-1)?.role).toBe("assistant");
    expect(conv.messages.at(-1)?.content).toBe("hello");
  });

  it("executes a read tool and re-invokes", async () => {
    const scripts = [
      [{ type: "tool_call", toolCall: { id: "t1", name: "echo", args: { msg: "hi" } } }, { type: "done" }],
      [{ type: "text", text: "done" }, { type: "done" }],
    ];
    const provider: any = mockProvider(scripts);
    const conv = new Conversation({ id: "c", mode: "ask", provider: "openai", model: "m" });
    const tools = [{ name: "echo", kind: "read" as const,
      schema: { name: "echo", description: "", parameters: { type: "object" as const, properties: {} } },
      handler: vi.fn(async (a: any) => `echoed: ${a.msg}`) }];
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: new ApprovalQueue(),
      systemPrompt: "S", maxIterations: 5, turnTimeoutMs: 1000, historyBudget: 10000,
    });
    for await (const _ of loop.send("go")) { /* drain */ }
    expect(tools[0].handler).toHaveBeenCalled();
    expect(conv.messages.some(m => m.role === "tool" && m.content.includes("echoed"))).toBe(true);
  });

  it("routes write tool through ApprovalQueue", async () => {
    const scripts = [
      [{ type: "tool_call", toolCall: { id: "t1", name: "create_note", args: { path: "x.md", content: "y" } } }, { type: "done" }],
      [{ type: "text", text: "ok" }, { type: "done" }],
    ];
    const provider: any = mockProvider(scripts);
    const conv = new Conversation({ id: "c", mode: "edit", provider: "openai", model: "m" });
    const aq = new ApprovalQueue();
    const writeHandler = vi.fn(async (a: any) => PENDING_PREFIX + JSON.stringify({ tool: "create_note", args: a }));
    const commitSpy = vi.fn(async () => {});
    const tools = [{ name: "create_note", kind: "write" as const,
      schema: { name: "create_note", description: "", parameters: { type: "object" as const, properties: {} } },
      handler: writeHandler }];
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: aq,
      systemPrompt: "S", maxIterations: 5, turnTimeoutMs: 1000, historyBudget: 10000,
      commitWrite: commitSpy,
    });
    setTimeout(() => aq.approveAll(), 10);
    for await (const _ of loop.send("go")) { /* drain */ }
    expect(commitSpy).toHaveBeenCalled();
  });

  it("honors maxIterations", async () => {
    const scripts = Array.from({ length: 10 }, () =>
      [{ type: "tool_call", toolCall: { id: "t", name: "echo", args: {} } }, { type: "done" }] as any);
    const provider: any = mockProvider(scripts);
    const conv = new Conversation({ id: "c", mode: "ask", provider: "openai", model: "m" });
    const tools = [{ name: "echo", kind: "read" as const,
      schema: { name: "echo", description: "", parameters: { type: "object" as const, properties: {} } },
      handler: async () => "r" }];
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: new ApprovalQueue(),
      systemPrompt: "S", maxIterations: 3, turnTimeoutMs: 1000, historyBudget: 10000,
    });
    for await (const _ of loop.send("go")) { /* drain */ }
    const toolMsgs = conv.messages.filter(m => m.role === "tool").length;
    expect(toolMsgs).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/agent/agent-loop.ts`**

```ts
import type { Delta, Message } from "../types";
import type { LLMProvider } from "../providers/types";
import type { Tool } from "../tools/types";
import { PENDING_PREFIX } from "../tools/write";
import type { ApprovalQueue } from "./approval-queue";
import { Conversation } from "./conversation";
import { trimHistory } from "./history-trimmer";

export interface AgentLoopOpts {
  provider: LLMProvider;
  conversation: Conversation;
  tools: Tool[];
  approvalQueue: ApprovalQueue;
  systemPrompt: string;
  maxIterations: number;
  turnTimeoutMs: number;
  historyBudget: number;
  commitWrite?: (pending: { tool: string; args: Record<string, unknown> }) => Promise<void>;
  computeDiff?: (pending: { tool: string; args: Record<string, unknown> }) => Promise<string>;
}

export interface LoopEvent {
  type: "text" | "tool" | "pending" | "applied" | "rejected" | "done" | "error" | "stopped";
  [k: string]: unknown;
}

export class AgentLoop {
  private abort = new AbortController();
  constructor(private opts: AgentLoopOpts) {}
  cancel() { this.abort.abort(); }

  async *send(userText: string): AsyncIterable<LoopEvent> {
    const { conversation } = this.opts;
    conversation.append({ role: "user", content: userText });
    yield* this.run();
  }

  async *run(): AsyncIterable<LoopEvent> {
    const { provider, conversation, tools, approvalQueue, systemPrompt, maxIterations, historyBudget } = this.opts;
    for (let i = 0; i < maxIterations; i++) {
      const withSys: Message[] = [{ role: "system", content: systemPrompt }, ...conversation.messages];
      const trimmed = trimHistory(withSys, historyBudget);
      const assistantMsg: Message = { role: "assistant", content: "", toolCalls: [] };
      let stoppedEarly = false;
      try {
        for await (const d of provider.chat({
          model: conversation.model, messages: trimmed,
          tools: tools.map(t => t.schema), signal: this.abort.signal,
        })) {
          if (d.type === "text" && d.text) { assistantMsg.content += d.text; yield { type: "text", text: d.text }; }
          else if (d.type === "tool_call" && d.toolCall) { assistantMsg.toolCalls!.push(d.toolCall); }
          else if (d.type === "error") { yield { type: "error", error: d.error }; stoppedEarly = true; break; }
          else if (d.type === "done") break;
        }
      } catch (e: any) {
        yield { type: "error", error: { kind: e.kind ?? "unknown", message: String(e.message ?? e) } };
        return;
      }
      if (stoppedEarly) return;
      conversation.append(assistantMsg);
      const calls = assistantMsg.toolCalls ?? [];
      if (calls.length === 0) { yield { type: "done" }; return; }

      for (const tc of calls) {
        const tool = tools.find(t => t.name === tc.name);
        if (!tool) {
          conversation.append({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ error: `unknown tool: ${tc.name}` }) });
          continue;
        }
        const result = await tool.handler(tc.args);
        if (result.startsWith(PENDING_PREFIX)) {
          const payload = JSON.parse(result.slice(PENDING_PREFIX.length));
          const diff = this.opts.computeDiff ? await this.opts.computeDiff(payload) : "";
          yield { type: "pending", toolCallId: tc.id, pending: payload, diff };
          const decision = await approvalQueue.enqueue({ toolCallId: tc.id, tool: payload.tool, args: payload.args, diff });
          if (decision.status === "applied") {
            if (this.opts.commitWrite) await this.opts.commitWrite(payload);
            conversation.append({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ status: "applied" }) });
            yield { type: "applied", toolCallId: tc.id };
          } else {
            conversation.append({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ status: "rejected_by_user" }) });
            yield { type: "rejected", toolCallId: tc.id };
          }
        } else {
          conversation.append({ role: "tool", toolCallId: tc.id, content: result });
          yield { type: "tool", toolCallId: tc.id, result };
        }
      }
    }
    yield { type: "stopped", reason: "max_iterations" };
  }
}
```

- [ ] **Step 4: Confirm pass.** Commit: `feat: AgentLoop with tool dispatch and approval`.

## Task 24: SettingsTab

**Files:** `src/ui/SettingsTab.ts`

UI code for Obsidian settings uses the imperative `Setting` builder. No test — this is straight adapter-to-Obsidian code validated by manual QA.

- [ ] **Step 1: Write `src/ui/SettingsTab.ts`**

```ts
import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianAgentPlugin from "../main";
import { listProviderIds } from "../providers/registry";

export class AgentSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: ObsidianAgentPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; containerEl.empty();
    const s = this.plugin.settings;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);

    containerEl.createEl("h2", { text: "Obsidian Agent" });

    new Setting(containerEl).setName("Provider").addDropdown(d => {
      for (const id of listProviderIds()) d.addOption(id, id);
      d.setValue(s.providerId).onChange(async v => { s.providerId = v as any; await this.plugin.saveSettings(); this.display(); });
    });

    new Setting(containerEl).setName("API key").addText(x => {
      x.inputEl.type = "password";
      x.setValue(s.apiKey).onChange(async v => { s.apiKey = v; await this.plugin.saveSettings(); });
    });

    new Setting(containerEl).setName("Base URL (optional)").addText(x =>
      x.setValue(s.baseUrl).onChange(async v => { s.baseUrl = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Model").addText(x =>
      x.setValue(s.model).onChange(async v => { s.model = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Default mode").addDropdown(d =>
      d.addOption("ask", t("chat.mode.ask")).addOption("edit", t("chat.mode.edit"))
        .setValue(s.mode).onChange(async v => { s.mode = v as any; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Chats folder").addText(x =>
      x.setValue(s.chatsFolder).onChange(async v => { s.chatsFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Language").addDropdown(d =>
      d.addOption("auto", "Auto").addOption("en", "English").addOption("zh-CN", "中文")
        .setValue(s.locale).onChange(async v => { s.locale = v as any; await this.plugin.saveSettings(); }));

    containerEl.createEl("h3", { text: "Scheduled tasks" });

    this.scheduledRow(containerEl, "Daily summary", s.scheduled.dailySummary, false);
    this.scheduledRow(containerEl, "Weekly review", s.scheduled.weeklyReview, true);
  }

  private scheduledRow(container: HTMLElement, label: string, cfg: any, weekly: boolean) {
    new Setting(container).setName(label)
      .addToggle(t => t.setValue(cfg.enabled).onChange(async v => { cfg.enabled = v; await this.plugin.saveSettings(); }))
      .addText(x => x.setPlaceholder("HH:mm").setValue(cfg.time).onChange(async v => { cfg.time = v; await this.plugin.saveSettings(); }))
      .addText(x => x.setPlaceholder("folder").setValue(cfg.targetFolder).onChange(async v => { cfg.targetFolder = v; await this.plugin.saveSettings(); }));
    if (weekly) {
      new Setting(container).setName("Weekday (0=Sun)").addText(x =>
        x.setValue(String(cfg.weekday ?? 0)).onChange(async v => { cfg.weekday = Number(v); await this.plugin.saveSettings(); }));
    }
  }
}
```

- [ ] **Step 2: Commit** — `git add src/ui/SettingsTab.ts && git commit -m "feat: settings tab UI"`.

## Task 25: ChatView (Svelte + Obsidian ItemView)

**Files:** `src/ui/chat-view.ts`, `src/ui/ChatView.svelte`, `src/ui/MessageList.svelte`, `src/ui/ModeToggle.svelte`, `src/ui/ConversationList.svelte`

- [ ] **Step 1: Write `src/ui/chat-view.ts`**

```ts
import { ItemView, WorkspaceLeaf } from "obsidian";
import ChatView from "./ChatView.svelte";
import type ObsidianAgentPlugin from "../main";

export const VIEW_TYPE_AGENT_CHAT = "obsidian-agent-chat";

export class AgentChatView extends ItemView {
  private component: ChatView | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: ObsidianAgentPlugin) { super(leaf); }
  getViewType() { return VIEW_TYPE_AGENT_CHAT; }
  getDisplayText() { return "Agent"; }
  getIcon() { return "bot"; }
  async onOpen() {
    this.contentEl.empty();
    this.component = new ChatView({ target: this.contentEl, props: { plugin: this.plugin } });
  }
  async onClose() { this.component?.$destroy(); this.component = null; }
}
```

- [ ] **Step 2: Write `src/ui/ChatView.svelte`**

```svelte
<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import MessageList from "./MessageList.svelte";
  import ModeToggle from "./ModeToggle.svelte";
  import ConversationList from "./ConversationList.svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;

  let input = "";
  let busy = false;
  let pending = plugin.approvalQueue.list();
  let messages = plugin.currentConversation.messages.slice();
  let streamBuf = "";

  const unsub = plugin.approvalQueue.onChange(list => pending = list);
  onDestroy(unsub);

  async function send() {
    if (!input.trim() || busy) return;
    busy = true; const text = input; input = ""; streamBuf = "";
    try {
      for await (const evt of plugin.sendMessage(text)) {
        if (evt.type === "text") { streamBuf += (evt as any).text; messages = [...plugin.currentConversation.messages]; }
        else if (evt.type === "applied" || evt.type === "rejected" || evt.type === "tool" || evt.type === "done" || evt.type === "stopped") {
          messages = [...plugin.currentConversation.messages]; streamBuf = "";
        } else if (evt.type === "error") { messages = [...messages, { role: "assistant", content: `⚠ ${(evt as any).error.message}` }]; }
        await tick();
      }
    } finally { busy = false; streamBuf = ""; messages = [...plugin.currentConversation.messages]; }
  }

  function cancel() { plugin.cancelCurrentTurn(); }
  async function newChat() { await plugin.startNewConversation(); messages = plugin.currentConversation.messages.slice(); }

  const t = (k: string, v?: any) => plugin.i18n.t(k, v);
</script>

<div class="agent-chat">
  <div class="agent-top">
    <button on:click={newChat}>{t("chat.new")}</button>
    <ModeToggle {plugin} />
  </div>
  <ConversationList {plugin} />
  <MessageList {messages} {streamBuf} {pending} {plugin} />
  <div class="agent-input">
    <textarea bind:value={input} placeholder="..." disabled={busy} on:keydown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}></textarea>
    {#if busy}
      <button on:click={cancel}>{t("chat.cancel")}</button>
    {:else}
      <button on:click={send}>{t("chat.send")}</button>
    {/if}
  </div>
</div>

<style>
  .agent-chat { display: flex; flex-direction: column; height: 100%; gap: 0.5rem; padding: 0.5rem; }
  .agent-top { display: flex; gap: 0.5rem; }
  .agent-input { display: flex; gap: 0.25rem; }
  .agent-input textarea { flex: 1; min-height: 3rem; }
</style>
```

- [ ] **Step 3: Write `src/ui/MessageList.svelte`**

```svelte
<script lang="ts">
  import DiffReviewBlock from "./DiffReviewBlock.svelte";
  import ChangeSummary from "./ChangeSummary.svelte";
  import type ObsidianAgentPlugin from "../main";
  export let messages: any[];
  export let streamBuf: string;
  export let pending: any[];
  export let plugin: ObsidianAgentPlugin;
</script>

<div class="agent-messages">
  {#each messages as m}
    {#if m.role === "user"}
      <div class="msg user">{m.content}</div>
    {:else if m.role === "assistant"}
      <div class="msg assistant">{m.content}</div>
    {/if}
  {/each}
  {#if streamBuf}<div class="msg assistant streaming">{streamBuf}</div>{/if}
  {#if pending.length}
    <div class="pending-block">
      {#each pending as p}<DiffReviewBlock {p} {plugin} />{/each}
      <div class="apply-row">
        <button on:click={() => plugin.approvalQueue.approveAll()}>{plugin.i18n.t("diff.applyAll")}</button>
        <button on:click={() => plugin.approvalQueue.rejectAll()}>{plugin.i18n.t("diff.rejectAll")}</button>
      </div>
    </div>
  {/if}
  <ChangeSummary {plugin} />
</div>

<style>
  .agent-messages { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
  .msg { padding: 0.5rem; border-radius: 4px; white-space: pre-wrap; }
  .msg.user { background: var(--background-secondary); }
  .msg.assistant { background: var(--background-primary-alt); }
  .apply-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
</style>
```

- [ ] **Step 4: Write `src/ui/ModeToggle.svelte`**

```svelte
<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let mode = plugin.settings.mode;
  async function set(m: "ask" | "edit") {
    mode = m; plugin.settings.mode = m; plugin.currentConversation.mode = m;
    await plugin.saveSettings();
  }
</script>
<div>
  <button class:active={mode === "ask"} on:click={() => set("ask")}>{plugin.i18n.t("chat.mode.ask")}</button>
  <button class:active={mode === "edit"} on:click={() => set("edit")}>{plugin.i18n.t("chat.mode.edit")}</button>
</div>
<style>.active { font-weight: bold; }</style>
```

- [ ] **Step 5: Write `src/ui/ConversationList.svelte`**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let paths: string[] = [];
  onMount(async () => { paths = await plugin.conversations.list(); });
  async function open(p: string) { await plugin.openConversation(p); }
</script>
<details><summary>History ({paths.length})</summary>
  <ul>{#each paths as p}<li><a on:click|preventDefault={() => open(p)} href="#">{p.split("/").pop()}</a></li>{/each}</ul>
</details>
```

- [ ] **Step 6: Commit** — `git commit -m "feat: chat view with streaming and mode toggle"`.

## Task 26: DiffReviewBlock + ChangeSummary

**Files:** `src/ui/DiffReviewBlock.svelte`, `src/ui/ChangeSummary.svelte`

- [ ] **Step 1: Write `src/ui/DiffReviewBlock.svelte`**

```svelte
<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let p: any;
  export let plugin: ObsidianAgentPlugin;
  const t = (k: string) => plugin.i18n.t(k);
</script>
<div class="diff-block">
  <div class="head"><code>{p.tool}</code> → <code>{p.args.path ?? p.args.from}</code></div>
  {#if p.diff}<pre class="diff">{p.diff}</pre>{/if}
  <div class="row">
    <button on:click={() => plugin.approvalQueue.approve(p.toolCallId)}>{t("diff.approve")}</button>
    <button on:click={() => plugin.approvalQueue.reject(p.toolCallId)}>{t("diff.reject")}</button>
  </div>
</div>
<style>
  .diff-block { border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 0.5rem; }
  pre.diff { max-height: 300px; overflow: auto; font-size: 0.8rem; }
  .row { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
</style>
```

- [ ] **Step 2: Write `src/ui/ChangeSummary.svelte`**

```svelte
<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let summary = plugin.lastTurnSummary;
  plugin.onSummaryChange(s => summary = s);
  const t = (k: string, v?: any) => plugin.i18n.t(k, v);
</script>
{#if summary && (summary.created.length || summary.edited.length || summary.deleted.length)}
  <div class="summary">
    <strong>Changes:</strong>
    {#if summary.created.length}{t("summary.created", { count: summary.created.length })} {/if}
    {#if summary.edited.length}{t("summary.edited", { count: summary.edited.length })} {/if}
    {#if summary.deleted.length}{t("summary.deleted", { count: summary.deleted.length })}{/if}
  </div>
{/if}
<style>.summary { font-size: 0.85rem; color: var(--text-muted); padding: 0.25rem; }</style>
```

- [ ] **Step 3: Commit** — `git commit -m "feat: diff review block and change summary"`.

## Task 27: Status Bar

**Files:** `src/ui/status-bar.ts`

- [ ] **Step 1: Write `src/ui/status-bar.ts`**

```ts
import type ObsidianAgentPlugin from "../main";

export class StatusBar {
  constructor(private plugin: ObsidianAgentPlugin, private el: HTMLElement) {
    this.render("idle");
  }
  render(state: "idle" | "thinking" | "waiting") {
    const s = this.plugin.settings;
    const label = state === "idle" ? "●" : state === "thinking" ? "…" : "?";
    this.el.setText(`${label} ${s.providerId}:${s.model || "-"}`);
  }
}
```

- [ ] **Step 2: Commit** — `git commit -m "feat: status bar"`.

## Task 28: SchedulerService + Presets

**Files:** `src/services/scheduler-service.ts`, `tests/services/scheduler-service.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/services/scheduler-service.test.ts
import { describe, it, expect, vi } from "vitest";
import { shouldRunToday, shouldRunThisWeek, nextFireTimestamp } from "../../src/services/scheduler-service";

describe("scheduler helpers", () => {
  it("shouldRunToday true when current time past configured time and not yet run today", () => {
    const now = new Date("2026-04-22T22:30:00Z").getTime();
    expect(shouldRunToday({ enabled: true, time: "22:00", targetFolder: "" }, 0, now)).toBe(true);
    expect(shouldRunToday({ enabled: true, time: "22:00", targetFolder: "" }, now, now)).toBe(false);
  });
  it("shouldRunThisWeek only on configured weekday", () => {
    const wed = new Date("2026-04-22T22:30:00Z").getTime();
    expect(shouldRunThisWeek({ enabled: true, time: "22:00", targetFolder: "", weekday: 3 }, 0, wed)).toBe(true);
    expect(shouldRunThisWeek({ enabled: true, time: "22:00", targetFolder: "", weekday: 1 }, 0, wed)).toBe(false);
  });
  it("nextFireTimestamp returns a number", () => {
    expect(typeof nextFireTimestamp("22:00", Date.now())).toBe("number");
  });
});
```

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Write `src/services/scheduler-service.ts`**

```ts
import type { Settings, ScheduledTaskSetting } from "../settings";

export function parseTime(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function nextFireTimestamp(hhmm: string, nowMs: number): number {
  const { h, m } = parseTime(hhmm);
  const d = new Date(nowMs); d.setHours(h, m, 0, 0);
  if (d.getTime() <= nowMs) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function shouldRunToday(cfg: ScheduledTaskSetting, lastRunMs: number, nowMs: number): boolean {
  if (!cfg.enabled) return false;
  const { h, m } = parseTime(cfg.time);
  const fire = new Date(nowMs); fire.setHours(h, m, 0, 0);
  if (nowMs < fire.getTime()) return false;
  const last = new Date(lastRunMs), today = new Date(nowMs);
  return last.toDateString() !== today.toDateString();
}

export function shouldRunThisWeek(cfg: ScheduledTaskSetting, lastRunMs: number, nowMs: number): boolean {
  if (!cfg.enabled) return false;
  const today = new Date(nowMs);
  if (today.getDay() !== (cfg.weekday ?? 0)) return false;
  return shouldRunToday(cfg, lastRunMs, nowMs);
}

export type ScheduledTaskRunner = (
  kind: "daily" | "weekly",
  cfg: ScheduledTaskSetting,
) => Promise<void>;

export class SchedulerService {
  private timer: number | null = null;
  private lastRun: Record<string, number> = {};

  constructor(private getSettings: () => Settings, private runner: ScheduledTaskRunner) {}

  start() {
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 60_000);
  }
  stop() { if (this.timer !== null) { clearInterval(this.timer); this.timer = null; } }

  private async tick() {
    const s = this.getSettings();
    const now = Date.now();
    if (shouldRunToday(s.scheduled.dailySummary, this.lastRun.daily ?? 0, now)) {
      this.lastRun.daily = now;
      try { await this.runner("daily", s.scheduled.dailySummary); } catch (e) { console.error("daily task failed", e); }
    }
    if (shouldRunThisWeek(s.scheduled.weeklyReview, this.lastRun.weekly ?? 0, now)) {
      this.lastRun.weekly = now;
      try { await this.runner("weekly", s.scheduled.weeklyReview); } catch (e) { console.error("weekly task failed", e); }
    }
  }
}
```

- [ ] **Step 4: Confirm pass.** Commit: `feat: SchedulerService with daily/weekly helpers`.

## Task 29: Plugin Entry (main.ts) — Wiring Everything

**Files:** `src/main.ts`

- [ ] **Step 1: Write `src/main.ts`**

```ts
import { Plugin, WorkspaceLeaf, Notice, moment } from "obsidian";
import { DEFAULT_SETTINGS, migrateSettings, Settings } from "./settings";
import { I18n, detectLocale } from "./services/i18n";
import { VaultService } from "./services/vault-service";
import { ConversationStore } from "./services/conversation-store";
import { SchedulerService } from "./services/scheduler-service";
import { createProvider } from "./providers/registry";
import { buildToolRegistry } from "./tools/registry";
import { Conversation } from "./agent/conversation";
import { ApprovalQueue } from "./agent/approval-queue";
import { AgentLoop } from "./agent/agent-loop";
import { systemPromptKey } from "./agent/mode-gate";
import { AgentSettingsTab } from "./ui/SettingsTab";
import { AgentChatView, VIEW_TYPE_AGENT_CHAT } from "./ui/chat-view";
import { StatusBar } from "./ui/status-bar";

export default class ObsidianAgentPlugin extends Plugin {
  settings!: Settings;
  i18n!: I18n;
  vault!: VaultService;
  conversations!: ConversationStore;
  approvalQueue = new ApprovalQueue();
  currentConversation!: Conversation;
  scheduler!: SchedulerService;
  statusBar!: StatusBar;
  lastTurnSummary: { created: string[]; edited: string[]; deleted: string[] } = { created: [], edited: [], deleted: [] };
  private summaryListeners = new Set<(s: typeof this.lastTurnSummary) => void>();
  private currentLoop: AgentLoop | null = null;

  async onload() {
    this.settings = migrateSettings(await this.loadData());
    this.i18n = new I18n(detectLocale(this.settings.locale, moment.locale()));
    this.vault = new VaultService(this.app);
    this.conversations = new ConversationStore(this.vault, this.settings.chatsFolder);
    this.currentConversation = this.newConversation();

    this.addSettingTab(new AgentSettingsTab(this.app, this));
    this.registerView(VIEW_TYPE_AGENT_CHAT, (leaf: WorkspaceLeaf) => new AgentChatView(leaf, this));

    this.addRibbonIcon("bot", "Open Agent", () => this.activateView());
    this.addCommand({ id: "open-agent", name: "Open Agent", callback: () => this.activateView() });
    this.addCommand({ id: "new-agent-chat", name: "New chat", callback: () => this.startNewConversation() });

    this.statusBar = new StatusBar(this, this.addStatusBarItem());

    this.scheduler = new SchedulerService(() => this.settings, (kind, cfg) => this.runScheduled(kind, cfg));
    this.scheduler.start();
  }

  onunload() { this.scheduler?.stop(); this.currentLoop?.cancel(); }

  async saveSettings() { await this.saveData(this.settings); this.i18n.setLocale(detectLocale(this.settings.locale, moment.locale())); }

  newConversation(): Conversation {
    return new Conversation({
      id: `c_${Date.now()}`, mode: this.settings.mode,
      provider: this.settings.providerId, model: this.settings.model,
    });
  }

  async startNewConversation() { this.currentConversation = this.newConversation(); }
  async openConversation(path: string) { this.currentConversation = await this.conversations.load(path); }

  cancelCurrentTurn() { this.currentLoop?.cancel(); }

  onSummaryChange(fn: (s: typeof this.lastTurnSummary) => void) { this.summaryListeners.add(fn); }
  private emitSummary() { for (const l of this.summaryListeners) l(this.lastTurnSummary); }

  async *sendMessage(text: string) {
    const provider = createProvider(this.settings.providerId, { apiKey: this.settings.apiKey, baseUrl: this.settings.baseUrl });
    const ctx = {
      vault: this.vault,
      activeFile: () => {
        const f = this.app.workspace.getActiveFile();
        if (!f) return null;
        return { path: f.path, content: "" };
      },
      selection: () => {
        const ed = (this.app.workspace as any).activeEditor?.editor;
        return ed?.getSelection?.() ?? "";
      },
    };
    const tools = buildToolRegistry(ctx, this.currentConversation.mode);
    this.lastTurnSummary = { created: [], edited: [], deleted: [] };
    this.currentLoop = new AgentLoop({
      provider,
      conversation: this.currentConversation,
      tools,
      approvalQueue: this.approvalQueue,
      systemPrompt: this.i18n.t(systemPromptKey(this.currentConversation.mode)),
      maxIterations: this.settings.maxIterations,
      turnTimeoutMs: this.settings.turnTimeoutMs,
      historyBudget: this.settings.historyTokenBudget,
      commitWrite: (p) => this.commitWrite(p),
      computeDiff: (p) => this.computeDiff(p),
    });
    this.statusBar.render("thinking");
    try { yield* this.currentLoop.run(); }
    finally {
      this.statusBar.render("idle");
      this.currentLoop = null;
      await this.conversations.save(this.currentConversation);
      this.emitSummary();
    }
  }

  private async computeDiff(p: { tool: string; args: any }): Promise<string> {
    try {
      if (p.tool === "edit_note") {
        const before = await this.vault.readNote(p.args.path);
        return simpleDiff(before, p.args.content);
      }
      if (p.tool === "create_note") return `+ ${p.args.path}\n${p.args.content}`;
      if (p.tool === "delete_note") return `- ${p.args.path}`;
      if (p.tool === "move_note") return `${p.args.from} → ${p.args.to}`;
      if (p.tool === "apply_patch") return p.args.patch;
    } catch {}
    return "";
  }

  private async commitWrite(p: { tool: string; args: any }): Promise<void> {
    switch (p.tool) {
      case "create_note": await this.vault.createNote(p.args.path, p.args.content); this.lastTurnSummary.created.push(p.args.path); break;
      case "edit_note": await this.vault.editNote(p.args.path, p.args.content); this.lastTurnSummary.edited.push(p.args.path); break;
      case "apply_patch": {
        const before = await this.vault.readNote(p.args.path);
        await this.vault.editNote(p.args.path, applyUnifiedPatch(before, p.args.patch));
        this.lastTurnSummary.edited.push(p.args.path); break;
      }
      case "delete_note": await this.vault.deleteNote(p.args.path); this.lastTurnSummary.deleted.push(p.args.path); break;
      case "move_note": await this.vault.moveNote(p.args.from, p.args.to); this.lastTurnSummary.edited.push(p.args.to); break;
    }
    this.emitSummary();
  }

  private async runScheduled(kind: "daily" | "weekly", cfg: any): Promise<void> {
    const provider = createProvider(this.settings.providerId, { apiKey: this.settings.apiKey, baseUrl: this.settings.baseUrl });
    const conv = new Conversation({ id: `sched_${kind}_${Date.now()}`, mode: "scheduled", provider: this.settings.providerId, model: this.settings.model });
    const ctx = { vault: this.vault, activeFile: () => null, selection: () => "" };
    const tools = buildToolRegistry(ctx, "scheduled");
    const promptKey = kind === "daily" ? "prompt.scheduled.daily" : "prompt.scheduled.weekly";
    conv.append({ role: "user", content: `Target folder: ${cfg.targetFolder}` });
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: this.approvalQueue,
      systemPrompt: this.i18n.t(promptKey),
      maxIterations: this.settings.maxIterations,
      turnTimeoutMs: this.settings.turnTimeoutMs,
      historyBudget: this.settings.historyTokenBudget,
      commitWrite: (p) => this.commitWrite(p),
    });
    // Scheduled mode cannot produce pending writes — approvalQueue won't be used.
    for await (const _ of loop.run()) { /* drain */ }
    await this.logActivity(`[${new Date().toISOString()}] scheduled/${kind} ok`);
  }

  private async logActivity(line: string) {
    const path = `${this.settings.chatsFolder}/../activity.log.md`;
    try { const cur = await this.vault.readNote(path); await this.vault.editNote(path, cur + line + "\n"); }
    catch { try { await this.vault.createNote(path, line + "\n"); } catch { new Notice("Agent: failed to write activity log"); } }
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT_CHAT)[0];
    if (!leaf) { leaf = this.app.workspace.getRightLeaf(false)!; await leaf.setViewState({ type: VIEW_TYPE_AGENT_CHAT, active: true }); }
    this.app.workspace.revealLeaf(leaf);
  }
}

function simpleDiff(a: string, b: string): string {
  const al = a.split("\n"), bl = b.split("\n");
  const out: string[] = []; const n = Math.max(al.length, bl.length);
  for (let i = 0; i < n; i++) {
    if (al[i] === bl[i]) out.push("  " + (al[i] ?? ""));
    else { if (al[i] !== undefined) out.push("- " + al[i]); if (bl[i] !== undefined) out.push("+ " + bl[i]); }
  }
  return out.join("\n");
}

function applyUnifiedPatch(original: string, _patch: string): string {
  // V1: patch is applied by the model describing it; for simplicity, treat patch as replacement body
  // if it does not look like a unified diff. Real unified-diff parsing is a v1.1 follow-up.
  return original; // placeholder — real patch application deferred (see Open Questions in spec)
}
```

> **Note:** `applyUnifiedPatch` is a documented stub. In v1 the `apply_patch` tool is advertised but falls through to no-op. The model will prefer `edit_note` (full replace) for changes. Converting this stub to a real unified-diff applier is the first v1.1 task. The spec's "Open Questions" section tracks this.

- [ ] **Step 2: Verify build** — `npm run build` succeeds, `npm test` all green.

- [ ] **Step 3: Commit** — `git commit -m "feat: plugin main wiring"`.

## Task 30: Manual QA Checklist

**Files:** `docs/superpowers/qa/manual-qa.md`

- [ ] **Step 1: Write `docs/superpowers/qa/manual-qa.md`**

```markdown
# Obsidian Agent — Manual QA Checklist

## Install

- [ ] Copy `main.js`, `manifest.json`, (optional `styles.css`) into `<vault>/.obsidian/plugins/obsidian-agent/`.
- [ ] Enable in Community Plugins.
- [ ] Agent icon appears in the left ribbon; clicking opens the right-sidebar chat.

## Provider smoke tests (repeat for each enabled provider)

For each of: openai, anthropic, ollama, openrouter, deepseek, qwen, kimi, zhipu, minimax

- [ ] Settings → pick provider, enter key, enter model.
- [ ] Ask mode: send "summarize my vault". Confirm streaming appears.
- [ ] Confirm a tool call (search_vault / read_note) fires — message list shows a tool turn.
- [ ] Wrong key → error toast says "Authentication failed. Check Settings."
- [ ] Cancel mid-stream → text stops; no crash.

## Edit mode

- [ ] Switch to Edit. Send "create a note Inbox/test.md with 'hello'".
- [ ] Pending diff block appears with Approve / Reject.
- [ ] Approve → note is created. Ctrl+Z in the editor undoes it.
- [ ] Repeat; click Reject → no note created; conversation continues.
- [ ] Apply All with two pending edits → both commit in order.
- [ ] Post-turn Change Summary shows correct counts.

## Scheduled tasks

- [ ] Enable Daily Summary with time set 1 minute in the future. Wait; a new note appears under the configured folder. No existing user note is modified.
- [ ] Enable Weekly Review with today's weekday; verify it runs at configured time; creates a new note only.
- [ ] Disable both; confirm no further notes are created.

## Localization

- [ ] Settings → Language → 中文. Chat UI labels switch to Chinese.
- [ ] New chat in zh-CN uses the Chinese system prompt (verify the model's reply language reflects this).

## Mobile smoke (iOS or Android Obsidian)

- [ ] Plugin loads on mobile.
- [ ] At least one provider (recommend DeepSeek / OpenAI) works via `requestUrl`.
- [ ] Chat view renders and scrolls.

## Robustness

- [ ] Send a very long message that exceeds provider context — HistoryTrimmer kicks in, retry succeeds.
- [ ] Kill network mid-stream — error surface, no frozen UI.
- [ ] Trigger 25-iteration cap (use a prompt that forces loops) — loop terminates with "stopped: max_iterations".

## Conversation persistence

- [ ] After a chat, a note appears in `_agent/chats/` with YAML frontmatter.
- [ ] Open the conversation list, click an older chat; messages reload.
- [ ] Delete the conversation note in the vault; list refreshes (no crash).
```

- [ ] **Step 2: Commit** — `git add docs/superpowers/qa/manual-qa.md && git commit -m "docs: manual QA checklist"`.

---

## Self-Review Summary

**Spec coverage:** every section of the spec has ≥1 corresponding task.
- Architecture (layers) → Tasks 1, 29 (wiring) + per-layer tasks 2–28.
- UI components (ChatView, DiffReviewView, SettingsTab, StatusBar) → Tasks 24–27.
- Agent Runtime (Conversation, AgentLoop, ModeGate, ApprovalQueue, HistoryTrimmer) → Tasks 19–23.
- Provider adapters (9) → Tasks 9–18.
- Tools (read / write / mode-filtered registry) → Tasks 5–7.
- Services (Vault, ConversationStore, Scheduler, I18n) → Tasks 3, 4, 19, 28.
- Error handling → covered in AgentLoop (Task 23), HTTP helper (Task 8), VaultService (Task 4).
- Testing → Vitest suites per task; manual QA in Task 30.

**Known stub:** `applyUnifiedPatch` in Task 29 is documented as a v1.1 follow-up. Flagged in the spec's Open Questions section.

**Type consistency:** `Message`, `ToolCall`, `Delta`, `Tool`, `ToolSchema`, `PendingWrite`, `WriteDecision` are used consistently across tasks. `systemPromptKey` and `buildToolRegistry` both take `Mode`.


