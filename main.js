"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianAgentPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/settings.ts
var DEFAULT_SETTINGS = {
  providerId: "openai",
  apiKey: "",
  baseUrl: "",
  model: "",
  mode: "ask",
  chatsFolder: "_agent/chats",
  locale: "auto",
  maxIterations: 25,
  turnTimeoutMs: 3e5,
  historyTokenBudget: 32e3,
  scheduled: {
    dailySummary: { enabled: false, time: "22:00", targetFolder: "_agent/summaries/daily" },
    weeklyReview: { enabled: false, time: "22:00", targetFolder: "_agent/summaries/weekly", weekday: 0 }
  }
};
function migrateSettings(raw) {
  return {
    ...DEFAULT_SETTINGS,
    ...raw ?? {},
    scheduled: {
      dailySummary: { ...DEFAULT_SETTINGS.scheduled.dailySummary, ...raw?.scheduled?.dailySummary ?? {} },
      weeklyReview: { ...DEFAULT_SETTINGS.scheduled.weeklyReview, ...raw?.scheduled?.weeklyReview ?? {} }
    }
  };
}

// src/locales/en.json
var en_default = {
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
};

// src/locales/zh-CN.json
var zh_CN_default = {
  "chat.send": "\u53D1\u9001",
  "chat.cancel": "\u53D6\u6D88",
  "chat.new": "\u65B0\u5BF9\u8BDD",
  "chat.mode.ask": "\u63D0\u95EE",
  "chat.mode.edit": "\u7F16\u8F91",
  "diff.approve": "\u6279\u51C6",
  "diff.reject": "\u62D2\u7EDD",
  "diff.applyAll": "\u5168\u90E8\u5E94\u7528",
  "diff.rejectAll": "\u5168\u90E8\u62D2\u7EDD",
  "summary.created": "\u65B0\u5EFA {{count}} \u7BC7",
  "summary.edited": "\u4FEE\u6539 {{count}} \u7BC7",
  "summary.deleted": "\u5220\u9664 {{count}} \u7BC7",
  "error.auth": "\u8EAB\u4EFD\u9A8C\u8BC1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u7F6E\u3002",
  "error.rate": "\u89E6\u53D1\u901F\u7387\u9650\u5236\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
  "error.context": "\u4E0A\u4E0B\u6587\u8FC7\u957F\uFF0C\u5DF2\u5BF9\u8F83\u65E9\u6D88\u606F\u8FDB\u884C\u6458\u8981\u3002",
  "prompt.system.ask": "\u4F60\u662F\u4E00\u4F4D\u77E5\u8BC6\u5E93\u52A9\u624B\u3002\u4F7F\u7528\u5DE5\u5177\u641C\u7D22\u548C\u9605\u8BFB\u7B14\u8BB0\uFF0C\u5E76\u5728\u76F8\u5173\u5904\u5F15\u7528\u7B14\u8BB0\u8DEF\u5F84\u3002",
  "prompt.system.edit": "\u4F60\u662F\u4E00\u4F4D\u5177\u5907\u7F16\u8F91\u80FD\u529B\u7684\u77E5\u8BC6\u5E93\u52A9\u624B\u3002\u6240\u6709\u5199\u5165\u90FD\u9700\u8981\u7528\u6237\u6279\u51C6\uFF0C\u8BF7\u751F\u6210\u6700\u5C0F\u5FC5\u8981\u7684\u6539\u52A8\u3002",
  "prompt.scheduled.daily": "\u603B\u7ED3\u4ECA\u5929\u4FEE\u6539\u8FC7\u7684\u7B14\u8BB0\uFF0C\u751F\u6210\u4E00\u7BC7\u65B0\u7B14\u8BB0\uFF0C\u6309\u4E3B\u9898\u5206\u5C0F\u8282\u5E76\u94FE\u63A5\u56DE\u6E90\u7B14\u8BB0\u3002",
  "prompt.scheduled.weekly": "\u56DE\u987E\u6700\u8FD1 7 \u5929\u7684\u7B14\u8BB0\uFF0C\u63D0\u70BC\u4E3B\u9898\u4E0E\u672A\u5B8C\u6210\u4E8B\u9879\uFF0C\u751F\u6210\u4E00\u7BC7\u65B0\u7684\u5468\u56DE\u987E\u7B14\u8BB0\u3002"
};

// src/services/i18n.ts
var DICTS = { en: en_default, "zh-CN": zh_CN_default };
var I18n = class {
  constructor(locale = "en") {
    this.locale = locale;
    this.dict = DICTS[locale];
  }
  setLocale(l) {
    this.locale = l;
    this.dict = DICTS[l];
  }
  getLocale() {
    return this.locale;
  }
  t(key, vars) {
    let s = this.dict[key] ?? key;
    if (vars)
      for (const k of Object.keys(vars))
        s = s.replace(new RegExp(`{{${k}}}`, "g"), String(vars[k]));
    return s;
  }
};
function detectLocale(pref, obsidianLocale) {
  if (pref !== "auto")
    return pref;
  return obsidianLocale.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

// src/services/vault-service.ts
var import_obsidian = require("obsidian");
var PathError = class extends Error {
  constructor(m) {
    super(m);
    this.name = "PathError";
  }
};
function validatePath(p) {
  const n = (0, import_obsidian.normalizePath)(p);
  if (n.includes("..") || n.startsWith("/") || n.startsWith("\\"))
    throw new PathError(`invalid path: ${p}`);
  return n;
}
var VaultService = class {
  constructor(app) {
    this.app = app;
  }
  async readNote(path) {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f)
      throw new Error(`not found: ${p}`);
    return this.app.vault.read(f);
  }
  async createNote(path, content) {
    const p = validatePath(path);
    if (this.app.vault.getAbstractFileByPath(p))
      throw new Error(`already exists: ${p}`);
    await this.ensureParent(p);
    await this.app.vault.create(p, content);
  }
  async editNote(path, content) {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f)
      throw new Error(`not found: ${p}`);
    await this.app.vault.modify(f, content);
  }
  async deleteNote(path) {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f)
      throw new Error(`not found: ${p}`);
    await this.app.vault.delete(f);
  }
  async moveNote(oldPath, newPath) {
    const a = validatePath(oldPath);
    const b = validatePath(newPath);
    const f = this.app.vault.getAbstractFileByPath(a);
    if (!f)
      throw new Error(`not found: ${a}`);
    await this.ensureParent(b);
    await this.app.vault.rename(f, b);
  }
  async listFolder(path) {
    const p = path === "" ? "" : validatePath(path);
    return this.app.vault.getMarkdownFiles().map((f) => f.path).filter((fp) => p === "" || fp === p || fp.startsWith(p + "/"));
  }
  async searchVault(query) {
    const q = query.toLowerCase();
    const hits = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const c = await this.app.vault.read(f);
      const i = c.toLowerCase().indexOf(q);
      if (i >= 0)
        hits.push({ path: f.path, snippet: c.slice(Math.max(0, i - 40), i + 120) });
      if (hits.length >= 20)
        break;
    }
    return hits;
  }
  getBacklinks(path) {
    const cache = this.app.metadataCache;
    const rec = cache?.resolvedLinks ?? {};
    const out = [];
    for (const src of Object.keys(rec))
      if (rec[src][path])
        out.push(src);
    return out;
  }
  getOutgoingLinks(path) {
    const cache = this.app.metadataCache;
    const rec = cache?.resolvedLinks?.[path] ?? {};
    return Object.keys(rec);
  }
  async ensureParent(p) {
    const parent = p.split("/").slice(0, -1).join("/");
    if (!parent)
      return;
    if (!this.app.vault.getAbstractFileByPath(parent)) {
      await this.app.vault.createFolder?.(parent);
    }
  }
};

// src/agent/conversation.ts
var Conversation = class {
  constructor(meta, messages = []) {
    this.messages = [];
    this.id = meta.id;
    this.title = meta.title;
    this.createdAt = meta.createdAt ?? Date.now();
    this.mode = meta.mode;
    this.provider = meta.provider;
    this.model = meta.model;
    this.messages = messages;
  }
  append(m) {
    this.messages.push(m);
  }
};
var SEP = "\n\n<!-- msg -->\n\n";
function serializeConversation(c) {
  const fm = [
    "---",
    `id: ${c.id}`,
    `title: ${JSON.stringify(c.title ?? "")}`,
    `createdAt: ${c.createdAt}`,
    `mode: ${c.mode}`,
    `provider: ${c.provider}`,
    `model: ${c.model}`,
    "---",
    ""
  ].join("\n");
  const body = c.messages.map((m) => {
    const meta = JSON.stringify({ role: m.role, toolCalls: m.toolCalls, toolCallId: m.toolCallId });
    return `<!-- meta: ${meta} -->
${m.content}`;
  }).join(SEP);
  return fm + body;
}
function parseConversation(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m)
    throw new Error("invalid conversation file");
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv)
      continue;
    fm[kv[1]] = kv[2].startsWith('"') ? JSON.parse(kv[2]) : kv[2];
  }
  const messages = [];
  for (const block of (m[2] ?? "").split(SEP).filter((x) => x.trim())) {
    const meta = block.match(/^<!-- meta: (.+?) -->\n([\s\S]*)$/);
    if (!meta)
      continue;
    const parsed = JSON.parse(meta[1]);
    messages.push({ role: parsed.role, content: meta[2], toolCalls: parsed.toolCalls, toolCallId: parsed.toolCallId });
  }
  return new Conversation({
    id: fm.id,
    title: fm.title || void 0,
    createdAt: Number(fm.createdAt),
    mode: fm.mode,
    provider: fm.provider,
    model: fm.model
  }, messages);
}

// src/services/conversation-store.ts
var ConversationStore = class {
  constructor(vault, folder) {
    this.vault = vault;
    this.folder = folder;
  }
  pathFor(c) {
    const date = new Date(c.createdAt).toISOString().slice(0, 10);
    const slug = (c.title ?? c.id).replace(/[^\w一-龥-]+/g, "-").slice(0, 40);
    return `${this.folder}/${date}-${slug || c.id}.md`;
  }
  async save(c) {
    const path = this.pathFor(c);
    const content = serializeConversation(c);
    try {
      await this.vault.editNote(path, content);
    } catch {
      await this.vault.createNote(path, content);
    }
    return path;
  }
  async load(path) {
    return parseConversation(await this.vault.readNote(path));
  }
  async list() {
    return this.vault.listFolder(this.folder);
  }
};

// src/services/scheduler-service.ts
function parseTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}
function shouldRunToday(cfg, lastRunMs, nowMs) {
  if (!cfg.enabled)
    return false;
  const { h, m } = parseTime(cfg.time);
  const fire = new Date(nowMs);
  fire.setHours(h, m, 0, 0);
  if (nowMs < fire.getTime())
    return false;
  const last = new Date(lastRunMs), today = new Date(nowMs);
  return last.toDateString() !== today.toDateString();
}
function shouldRunThisWeek(cfg, lastRunMs, nowMs) {
  if (!cfg.enabled)
    return false;
  const today = new Date(nowMs);
  if (today.getDay() !== (cfg.weekday ?? 0))
    return false;
  return shouldRunToday(cfg, lastRunMs, nowMs);
}
var SchedulerService = class {
  constructor(getSettings, runner) {
    this.getSettings = getSettings;
    this.runner = runner;
    this.timer = null;
    this.lastRun = {};
  }
  start() {
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 6e4);
  }
  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  async tick() {
    const s = this.getSettings();
    const now2 = Date.now();
    if (shouldRunToday(s.scheduled.dailySummary, this.lastRun.daily ?? 0, now2)) {
      this.lastRun.daily = now2;
      try {
        await this.runner("daily", s.scheduled.dailySummary);
      } catch (e) {
        console.error("daily task failed", e);
      }
    }
    if (shouldRunThisWeek(s.scheduled.weeklyReview, this.lastRun.weekly ?? 0, now2)) {
      this.lastRun.weekly = now2;
      try {
        await this.runner("weekly", s.scheduled.weeklyReview);
      } catch (e) {
        console.error("weekly task failed", e);
      }
    }
  }
};

// src/providers/http.ts
var import_obsidian2 = require("obsidian");

// src/providers/types.ts
var ProviderError = class extends Error {
  constructor(kind, msg) {
    super(msg);
    this.kind = kind;
  }
};

// src/providers/http.ts
var MAX_RETRIES = 4;
function retryDelayMs(attempt, retryAfterHeader) {
  if (retryAfterHeader) {
    const secs = parseInt(retryAfterHeader, 10);
    if (!isNaN(secs))
      return Math.min(secs * 1e3, 6e4);
  }
  return Math.min(5e3 * Math.pow(2, attempt - 1), 6e4);
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}
function parseRateMsg(raw) {
  try {
    return JSON.parse(raw)?.error?.message ?? raw;
  } catch {
    return raw;
  }
}
async function* httpSSE(o) {
  for (let attempt = 0; ; attempt++) {
    const resp = await fetch(o.url, {
      method: o.method ?? "POST",
      headers: o.headers,
      body: o.body,
      signal: o.signal
    });
    if (resp.status === 429 && attempt < MAX_RETRIES) {
      const delay = retryDelayMs(attempt + 1, resp.headers.get("Retry-After"));
      console.warn(`[agent] rate limited, retrying in ${delay / 1e3}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay, o.signal);
      continue;
    }
    if (resp.status === 401 || resp.status === 403)
      throw new ProviderError("auth", `${resp.status}`);
    if (resp.status === 429)
      throw new ProviderError("rate", `Rate limited (gave up after ${MAX_RETRIES} retries): ${parseRateMsg(await resp.text())}`);
    if (resp.status >= 400) {
      const t = await resp.text();
      if (/context|too long/i.test(t))
        throw new ProviderError("context", t);
      throw new ProviderError("unknown", `${resp.status}: ${t}`);
    }
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const evt = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const ev of parseSSE(evt + "\n\n"))
          yield ev;
      }
    }
    return;
  }
}
function* parseSSE(text2) {
  for (const block of text2.split("\n\n")) {
    if (!block.trim())
      continue;
    const dataLines = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
    if (dataLines.length)
      yield { data: dataLines.join("\n") };
  }
}

// src/providers/openai.ts
var OpenAIProvider = class {
  constructor(cfg, sseFn = httpSSE) {
    this.cfg = cfg;
    this.sseFn = sseFn;
    this.id = "openai";
  }
  async *chat(req) {
    const url = (this.cfg.baseUrl || "https://api.openai.com/v1") + "/chat/completions";
    const body = {
      model: req.model,
      messages: req.messages.map((m) => this.toOpenAIMsg(m)),
      tools: req.tools.length ? req.tools.map((t) => ({ type: "function", function: t })) : void 0,
      stream: true,
      temperature: req.temperature
    };
    const iter = this.sseFn({
      url,
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify(body),
      signal: req.signal
    });
    const pending2 = {};
    for await (const ev of iter) {
      if (ev.data === "[DONE]")
        break;
      let obj;
      try {
        obj = JSON.parse(ev.data);
      } catch {
        continue;
      }
      const delta = obj.choices?.[0]?.delta;
      if (!delta)
        continue;
      if (delta.content)
        yield { type: "text", text: delta.content };
      for (const tc of delta.tool_calls ?? []) {
        const i = tc.index;
        pending2[i] ?? (pending2[i] = { name: "", args: "" });
        if (tc.id)
          pending2[i].id = tc.id;
        if (tc.function?.name)
          pending2[i].name = tc.function.name;
        if (tc.function?.arguments)
          pending2[i].args += tc.function.arguments;
      }
    }
    for (const i of Object.keys(pending2)) {
      const p = pending2[+i];
      let args = {};
      try {
        args = JSON.parse(p.args || "{}");
      } catch {
        args = { _raw: p.args };
      }
      yield { type: "tool_call", toolCall: { id: p.id ?? `tc_${i}`, name: p.name, args } };
    }
    yield { type: "done" };
  }
  toOpenAIMsg(m) {
    if (m.role === "tool")
      return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.args) }
        }))
      };
    }
    return { role: m.role, content: m.content };
  }
};

// src/providers/anthropic.ts
var AnthropicProvider = class {
  constructor(cfg, sseFn = httpSSE) {
    this.cfg = cfg;
    this.sseFn = sseFn;
    this.id = "anthropic";
  }
  async *chat(req) {
    const url = (this.cfg.baseUrl || "https://api.anthropic.com") + "/v1/messages";
    const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const msgs = req.messages.filter((m) => m.role !== "system").map((m) => this.toAnthropic(m));
    const body = {
      model: req.model,
      max_tokens: 4096,
      stream: true,
      system: system || void 0,
      messages: msgs,
      tools: req.tools.length ? req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })) : void 0,
      temperature: req.temperature
    };
    const iter = this.sseFn({
      url,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.cfg.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body),
      signal: req.signal
    });
    const blocks = {};
    for await (const ev of iter) {
      let o;
      try {
        o = JSON.parse(ev.data);
      } catch {
        continue;
      }
      if (o.type === "content_block_start") {
        blocks[o.index] = { type: o.content_block.type, name: o.content_block.name, id: o.content_block.id, buf: "" };
      } else if (o.type === "content_block_delta") {
        const b = blocks[o.index];
        if (!b)
          continue;
        if (o.delta.type === "text_delta")
          yield { type: "text", text: o.delta.text };
        else if (o.delta.type === "input_json_delta")
          b.buf += o.delta.partial_json;
      } else if (o.type === "content_block_stop") {
        const b = blocks[o.index];
        if (b?.type === "tool_use") {
          let args = {};
          try {
            args = JSON.parse(b.buf || "{}");
          } catch {
            args = { _raw: b.buf };
          }
          yield { type: "tool_call", toolCall: { id: b.id, name: b.name, args } };
        }
      } else if (o.type === "message_stop")
        break;
    }
    yield { type: "done" };
  }
  toAnthropic(m) {
    if (m.role === "assistant" && m.toolCalls?.length) {
      const content = [];
      if (m.content)
        content.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls)
        content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args });
      return { role: "assistant", content };
    }
    if (m.role === "tool") {
      return { role: "user", content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }] };
    }
    return { role: m.role, content: m.content };
  }
};

// src/providers/ollama.ts
var OllamaProvider = class {
  constructor(cfg, streamFn) {
    this.cfg = cfg;
    this.streamFn = streamFn;
    this.id = "ollama";
  }
  async *chat(req) {
    const url = this.cfg.baseUrl.replace(/\/$/, "") + "/api/chat";
    const body = {
      model: req.model,
      stream: true,
      messages: req.messages.map((m) => this.toOllama(m)),
      tools: req.tools.length ? req.tools.map((t) => ({ type: "function", function: t })) : void 0,
      options: req.temperature !== void 0 ? { temperature: req.temperature } : void 0
    };
    const iter = this.streamFn ? this.streamFn() : this.fetchNDJSON(url, body, req.signal);
    let counter = 0;
    for await (const line of iter) {
      const trimmed = line.trim();
      if (!trimmed)
        continue;
      let o;
      try {
        o = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (o.message?.content)
        yield { type: "text", text: o.message.content };
      for (const tc of o.message?.tool_calls ?? []) {
        yield { type: "tool_call", toolCall: { id: `tc_${counter++}`, name: tc.function.name, args: tc.function.arguments ?? {} } };
      }
      if (o.done)
        break;
    }
    yield { type: "done" };
  }
  async *fetchNDJSON(url, body, signal) {
    const resp = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (resp.status >= 400)
      throw new ProviderError(resp.status >= 500 ? "unavailable" : "unknown", await resp.text());
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        yield buf.slice(0, idx);
        buf = buf.slice(idx + 1);
      }
    }
    if (buf.trim())
      yield buf;
  }
  toOllama(m) {
    if (m.role === "tool")
      return { role: "tool", content: m.content };
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || "",
        tool_calls: m.toolCalls.map((tc) => ({ function: { name: tc.name, arguments: tc.args } }))
      };
    }
    return { role: m.role, content: m.content };
  }
};

// src/providers/openai-compat.ts
function createOpenAICompatible(o) {
  const p = new OpenAIProvider({ apiKey: o.apiKey, baseUrl: o.baseUrl || o.defaultBaseUrl });
  p.id = o.id;
  return p;
}

// src/providers/deepseek.ts
var createDeepSeek = (apiKey, baseUrl) => createOpenAICompatible({ id: "deepseek", apiKey, defaultBaseUrl: "https://api.deepseek.com/v1", baseUrl });

// src/providers/qwen.ts
var createQwen = (apiKey, baseUrl) => createOpenAICompatible({
  id: "qwen",
  apiKey,
  defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  baseUrl
});

// src/providers/kimi.ts
var createKimi = (apiKey, baseUrl) => createOpenAICompatible({
  id: "kimi",
  apiKey,
  defaultBaseUrl: "https://api.moonshot.cn/v1",
  baseUrl
});

// src/providers/zhipu.ts
var createZhipu = (apiKey, baseUrl) => createOpenAICompatible({
  id: "zhipu",
  apiKey,
  defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
  baseUrl
});

// src/providers/minimax.ts
var createMiniMax = (apiKey, baseUrl) => createOpenAICompatible({
  id: "minimax",
  apiKey,
  defaultBaseUrl: "https://api.minimax.chat/v1",
  baseUrl
});

// src/providers/openrouter.ts
var createOpenRouter = (apiKey, baseUrl) => createOpenAICompatible({
  id: "openrouter",
  apiKey,
  defaultBaseUrl: "https://openrouter.ai/api/v1",
  baseUrl
});

// src/providers/registry.ts
function createProvider(id, cfg) {
  switch (id) {
    case "openai":
      return new OpenAIProvider({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    case "anthropic":
      return new AnthropicProvider({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    case "ollama":
      return new OllamaProvider({ baseUrl: cfg.baseUrl || "http://localhost:11434" });
    case "openrouter":
      return createOpenRouter(cfg.apiKey, cfg.baseUrl);
    case "deepseek":
      return createDeepSeek(cfg.apiKey, cfg.baseUrl);
    case "qwen":
      return createQwen(cfg.apiKey, cfg.baseUrl);
    case "kimi":
      return createKimi(cfg.apiKey, cfg.baseUrl);
    case "zhipu":
      return createZhipu(cfg.apiKey, cfg.baseUrl);
    case "minimax":
      return createMiniMax(cfg.apiKey, cfg.baseUrl);
    default:
      throw new Error(`unknown provider: ${id}`);
  }
}
function listProviderIds() {
  return ["openai", "anthropic", "ollama", "openrouter", "deepseek", "qwen", "kimi", "zhipu", "minimax"];
}

// src/tools/read.ts
var safe = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    return JSON.stringify({ error: String(e?.message ?? e) });
  }
};
function buildReadTools(ctx) {
  return [
    {
      name: "search_vault",
      kind: "read",
      schema: {
        name: "search_vault",
        description: "Full-text search across notes.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
      },
      handler: (a) => safe(async () => JSON.stringify(await ctx.vault.searchVault(String(a.query))))
    },
    {
      name: "read_note",
      kind: "read",
      schema: {
        name: "read_note",
        description: "Read full markdown content of a note.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
      },
      handler: (a) => safe(async () => ctx.vault.readNote(String(a.path)))
    },
    {
      name: "list_folder",
      kind: "read",
      schema: {
        name: "list_folder",
        description: "List note paths under a folder.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
      },
      handler: (a) => safe(async () => JSON.stringify(await ctx.vault.listFolder(String(a.path ?? ""))))
    },
    {
      name: "get_backlinks",
      kind: "read",
      schema: {
        name: "get_backlinks",
        description: "Notes that link to the given path.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
      },
      handler: (a) => safe(async () => JSON.stringify(ctx.vault.getBacklinks(String(a.path))))
    },
    {
      name: "get_outgoing_links",
      kind: "read",
      schema: {
        name: "get_outgoing_links",
        description: "Notes linked from the given path.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
      },
      handler: (a) => safe(async () => JSON.stringify(ctx.vault.getOutgoingLinks(String(a.path))))
    },
    {
      name: "get_active_note",
      kind: "read",
      schema: { name: "get_active_note", description: "Current note in the editor.", parameters: { type: "object", properties: {} } },
      handler: () => safe(async () => JSON.stringify(ctx.activeFile()))
    },
    {
      name: "get_selection",
      kind: "read",
      schema: { name: "get_selection", description: "Currently selected text.", parameters: { type: "object", properties: {} } },
      handler: () => safe(async () => ctx.selection())
    }
  ];
}

// src/tools/write.ts
var PENDING_PREFIX = "__PENDING_WRITE__:";
function pending(name, args) {
  return PENDING_PREFIX + JSON.stringify({ tool: name, args });
}
function buildWriteTools() {
  const str = { type: "string" };
  return [
    {
      name: "create_note",
      kind: "write",
      schema: {
        name: "create_note",
        description: "Create a new note. Fails if path exists.",
        parameters: { type: "object", properties: { path: str, content: str }, required: ["path", "content"] }
      },
      handler: async (a) => pending("create_note", a)
    },
    {
      name: "edit_note",
      kind: "write",
      schema: {
        name: "edit_note",
        description: "Replace full content of an existing note.",
        parameters: { type: "object", properties: { path: str, content: str }, required: ["path", "content"] }
      },
      handler: async (a) => pending("edit_note", a)
    },
    {
      name: "apply_patch",
      kind: "write",
      schema: {
        name: "apply_patch",
        description: "Apply a unified diff patch to a note.",
        parameters: { type: "object", properties: { path: str, patch: str }, required: ["path", "patch"] }
      },
      handler: async (a) => pending("apply_patch", a)
    },
    {
      name: "delete_note",
      kind: "write",
      schema: {
        name: "delete_note",
        description: "Delete a note.",
        parameters: { type: "object", properties: { path: str }, required: ["path"] }
      },
      handler: async (a) => pending("delete_note", a)
    },
    {
      name: "move_note",
      kind: "write",
      schema: {
        name: "move_note",
        description: "Move or rename a note.",
        parameters: { type: "object", properties: { from: str, to: str }, required: ["from", "to"] }
      },
      handler: async (a) => pending("move_note", a)
    }
  ];
}

// src/tools/registry.ts
function buildToolRegistry(ctx, mode) {
  const read = buildReadTools(ctx);
  if (mode === "ask")
    return read;
  const write = buildWriteTools();
  if (mode === "scheduled")
    return [...read, ...write.filter((t) => t.name === "create_note")];
  return [...read, ...write];
}

// src/agent/approval-queue.ts
var ApprovalQueue = class {
  constructor() {
    this.entries = [];
    this.listeners = /* @__PURE__ */ new Set();
  }
  enqueue(pw) {
    return new Promise((resolve) => {
      this.entries.push({ pw, resolve });
      this.emit();
    });
  }
  list() {
    return this.entries.map((e) => e.pw);
  }
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const l of this.listeners)
      l(this.list());
  }
  approve(id) {
    this.resolveOne(id, "applied");
  }
  reject(id) {
    this.resolveOne(id, "rejected_by_user");
  }
  approveAll() {
    while (this.entries.length)
      this.resolveAt(0, "applied");
  }
  rejectAll() {
    while (this.entries.length)
      this.resolveAt(0, "rejected_by_user");
  }
  resolveOne(id, s) {
    const i = this.entries.findIndex((e) => e.pw.toolCallId === id);
    if (i >= 0)
      this.resolveAt(i, s);
  }
  resolveAt(i, s) {
    const [e] = this.entries.splice(i, 1);
    e.resolve({ status: s });
    this.emit();
  }
};

// src/agent/history-trimmer.ts
function approxTokens(s) {
  return Math.ceil(s.length / 4);
}
function totalTokens(msgs) {
  let n = 0;
  for (const m of msgs)
    n += approxTokens(m.content ?? "") + 4;
  return n;
}
function trimHistory(messages, budget) {
  if (totalTokens(messages) <= budget)
    return messages;
  const system = messages.filter((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system");
  const keep = [];
  let used = totalTokens(system);
  for (let i = rest.length - 1; i >= 0; i--) {
    const t = approxTokens(rest[i].content ?? "") + 4;
    if (used + t > budget)
      break;
    keep.unshift(rest[i]);
    used += t;
  }
  if (keep.length < rest.length) {
    keep.unshift({ role: "system", content: `[Earlier ${rest.length - keep.length} messages summarized for brevity.]` });
  }
  return [...system, ...keep];
}

// src/agent/agent-loop.ts
var AgentLoop = class {
  constructor(opts) {
    this.opts = opts;
    this.abort = new AbortController();
  }
  cancel() {
    this.abort.abort();
  }
  async *send(userText) {
    const { conversation } = this.opts;
    conversation.append({ role: "user", content: userText });
    yield* this.run();
  }
  async *run() {
    const { provider, conversation, tools, approvalQueue, systemPrompt, maxIterations, historyBudget, turnTimeoutMs } = this.opts;
    for (let i = 0; i < maxIterations; i++) {
      if (this.abort.signal.aborted) {
        yield { type: "stopped", reason: "cancelled" };
        return;
      }
      const withSys = [{ role: "system", content: systemPrompt }, ...conversation.messages];
      const trimmed = trimHistory(withSys, historyBudget);
      const assistantMsg = { role: "assistant", content: "", toolCalls: [] };
      let stoppedEarly = false;
      console.debug(`[agent] iteration ${i}, history: ${trimmed.length} msgs`);
      const iterAbort = new AbortController();
      const propagate = () => iterAbort.abort();
      this.abort.signal.addEventListener("abort", propagate, { once: true });
      const timer = setTimeout(() => {
        console.warn("[agent] turn timeout");
        iterAbort.abort();
      }, turnTimeoutMs);
      try {
        for await (const d of provider.chat({
          model: conversation.model,
          messages: trimmed,
          tools: tools.map((t) => t.schema),
          signal: iterAbort.signal
        })) {
          if (d.type === "text" && d.text) {
            assistantMsg.content += d.text;
            yield { type: "text", text: d.text };
          } else if (d.type === "tool_call" && d.toolCall) {
            assistantMsg.toolCalls.push(d.toolCall);
          } else if (d.type === "error") {
            console.error("[agent] provider error:", d.error);
            yield { type: "error", error: d.error };
            stoppedEarly = true;
            break;
          } else if (d.type === "done")
            break;
        }
      } catch (e) {
        if (this.abort.signal.aborted) {
          yield { type: "stopped", reason: "cancelled" };
          return;
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          yield { type: "error", error: { kind: "timeout", message: `Request timed out after ${Math.round(turnTimeoutMs / 1e3)}s \u2014 the provider is too slow. Try again or increase the timeout in plugin settings.` } };
          return;
        }
        console.error("[agent] chat exception:", e);
        yield { type: "error", error: { kind: e.kind ?? "unknown", message: String(e.message ?? e) } };
        return;
      } finally {
        clearTimeout(timer);
        this.abort.signal.removeEventListener("abort", propagate);
      }
      if (stoppedEarly)
        return;
      conversation.append(assistantMsg);
      const calls = assistantMsg.toolCalls ?? [];
      if (calls.length === 0) {
        yield { type: "done" };
        return;
      }
      console.debug(`[agent] tool calls: ${calls.map((c) => c.name).join(", ")}`);
      for (const tc of calls) {
        const tool = tools.find((t) => t.name === tc.name);
        if (!tool) {
          conversation.append({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ error: `unknown tool: ${tc.name}` }) });
          continue;
        }
        console.debug(`[agent] running tool: ${tc.name}`, tc.args);
        const result = await tool.handler(tc.args);
        console.debug(`[agent] tool result (${tc.name}):`, result.slice(0, 300));
        if (result.startsWith(PENDING_PREFIX)) {
          const payload = JSON.parse(result.slice(PENDING_PREFIX.length));
          const diff = this.opts.computeDiff ? await this.opts.computeDiff(payload) : "";
          yield { type: "pending", toolCallId: tc.id, pending: payload, diff };
          const decision = await approvalQueue.enqueue({ toolCallId: tc.id, tool: payload.tool, args: payload.args, diff });
          if (decision.status === "applied") {
            if (this.opts.commitWrite)
              await this.opts.commitWrite(payload);
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
};

// src/agent/mode-gate.ts
function systemPromptKey(mode) {
  if (mode === "ask")
    return "prompt.system.ask";
  if (mode === "edit")
    return "prompt.system.edit";
  return "prompt.scheduled.daily";
}

// src/ui/SettingsTab.ts
var import_obsidian3 = require("obsidian");
var AgentSettingsTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    containerEl.createEl("h2", { text: "Obsidian Agent" });
    new import_obsidian3.Setting(containerEl).setName("Provider").addDropdown((d) => {
      for (const id of listProviderIds())
        d.addOption(id, id);
      d.setValue(s.providerId).onChange(async (v) => {
        s.providerId = v;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("API key").addText((x) => {
      x.inputEl.type = "password";
      x.setValue(s.apiKey).onChange(async (v) => {
        s.apiKey = v;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Base URL (optional)").addText((x) => x.setValue(s.baseUrl).onChange(async (v) => {
      s.baseUrl = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian3.Setting(containerEl).setName("Model").addText((x) => x.setValue(s.model).onChange(async (v) => {
      s.model = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian3.Setting(containerEl).setName("Request timeout (seconds)").setDesc("Max time to wait for a single LLM response. Increase for slow providers.").addText((x) => x.setValue(String(Math.round(s.turnTimeoutMs / 1e3))).onChange(async (v) => {
      const n = parseInt(v, 10);
      if (n > 0) {
        s.turnTimeoutMs = n * 1e3;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian3.Setting(containerEl).setName("Default mode").addDropdown((d) => d.addOption("ask", t("chat.mode.ask")).addOption("edit", t("chat.mode.edit")).setValue(s.mode).onChange(async (v) => {
      s.mode = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian3.Setting(containerEl).setName("Chats folder").addText((x) => x.setValue(s.chatsFolder).onChange(async (v) => {
      s.chatsFolder = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian3.Setting(containerEl).setName("Language").addDropdown((d) => d.addOption("auto", "Auto").addOption("en", "English").addOption("zh-CN", "\u4E2D\u6587").setValue(s.locale).onChange(async (v) => {
      s.locale = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Scheduled tasks" });
    this.scheduledRow(containerEl, "Daily summary", s.scheduled.dailySummary, false);
    this.scheduledRow(containerEl, "Weekly review", s.scheduled.weeklyReview, true);
  }
  scheduledRow(container, label2, cfg, weekly) {
    new import_obsidian3.Setting(container).setName(label2).addToggle((t) => t.setValue(cfg.enabled).onChange(async (v) => {
      cfg.enabled = v;
      await this.plugin.saveSettings();
    })).addText((x) => x.setPlaceholder("HH:mm").setValue(cfg.time).onChange(async (v) => {
      cfg.time = v;
      await this.plugin.saveSettings();
    })).addText((x) => x.setPlaceholder("folder").setValue(cfg.targetFolder).onChange(async (v) => {
      cfg.targetFolder = v;
      await this.plugin.saveSettings();
    }));
    if (weekly) {
      new import_obsidian3.Setting(container).setName("Weekday (0=Sun)").addText((x) => x.setValue(String(cfg.weekday ?? 0)).onChange(async (v) => {
        cfg.weekday = Number(v);
        await this.plugin.saveSettings();
      }));
    }
  }
};

// src/ui/chat-view.ts
var import_obsidian5 = require("obsidian");

// node_modules/svelte/src/runtime/internal/utils.js
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

// node_modules/svelte/src/runtime/internal/globals.js
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : (
  // @ts-ignore Node typings have this
  global
);

// node_modules/svelte/src/runtime/internal/ResizeObserverSingleton.js
var ResizeObserverSingleton = class _ResizeObserverSingleton {
  /** @param {ResizeObserverOptions} options */
  constructor(options) {
    /**
     * @private
     * @readonly
     * @type {WeakMap<Element, import('./private.js').Listener>}
     */
    __publicField(this, "_listeners", "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0);
    /**
     * @private
     * @type {ResizeObserver}
     */
    __publicField(this, "_observer");
    /** @type {ResizeObserverOptions} */
    __publicField(this, "options");
    this.options = options;
  }
  /**
   * @param {Element} element
   * @param {import('./private.js').Listener} listener
   * @returns {() => void}
   */
  observe(element2, listener) {
    this._listeners.set(element2, listener);
    this._getObserver().observe(element2, this.options);
    return () => {
      this._listeners.delete(element2);
      this._observer.unobserve(element2);
    };
  }
  /**
   * @private
   */
  _getObserver() {
    return this._observer ?? (this._observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        _ResizeObserverSingleton.entries.set(entry.target, entry);
        this._listeners.get(entry.target)?.(entry);
      }
    }));
  }
};
ResizeObserverSingleton.entries = "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0;

// node_modules/svelte/src/runtime/internal/dom.js
var is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data)
    return;
  text2.data = /** @type {string} */
  data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function toggle_class(element2, name, toggle) {
  element2.classList.toggle(name, !!toggle);
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  return new CustomEvent(type, { detail, bubbles, cancelable });
}
function get_custom_elements_slots(element2) {
  const result = {};
  element2.childNodes.forEach(
    /** @param {Element} node */
    (node) => {
      result[node.slot || "default"] = true;
    }
  );
  return result;
}

// node_modules/svelte/src/runtime/internal/lifecycle.js
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail, { cancelable = false } = {}) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(
        /** @type {string} */
        type,
        detail,
        { cancelable }
      );
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
      return !event.defaultPrevented;
    }
    return true;
  };
}

// node_modules/svelte/src/runtime/internal/scheduler.js
var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = /* @__PURE__ */ Promise.resolve();
var update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
var seen_callbacks = /* @__PURE__ */ new Set();
var flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}

// node_modules/svelte/src/runtime/internal/transitions.js
var outroing = /* @__PURE__ */ new Set();
var outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
    // parent group
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}

// node_modules/svelte/src/runtime/internal/each.js
function ensure_array_like(array_like_or_iterator) {
  return array_like_or_iterator?.length !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
}
function destroy_block(block, lookup) {
  block.d(1);
  lookup.delete(block.key);
}
function outro_and_destroy_block(block, lookup) {
  transition_out(block, 1, 1, () => {
    lookup.delete(block.key);
  });
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block4, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--)
    old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = /* @__PURE__ */ new Map();
  const deltas = /* @__PURE__ */ new Map();
  const updates = [];
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block = lookup.get(key);
    if (!block) {
      block = create_each_block4(key, child_ctx);
      block.c();
    } else if (dynamic) {
      updates.push(() => block.p(child_ctx, dirty));
    }
    new_lookup.set(key, new_blocks[i] = block);
    if (key in old_indexes)
      deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = /* @__PURE__ */ new Set();
  const did_move = /* @__PURE__ */ new Set();
  function insert2(block) {
    transition_in(block, 1);
    block.m(node, next);
    lookup.set(block.key, block);
    next = block.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key))
      destroy(old_block, lookup);
  }
  while (n)
    insert2(new_blocks[n - 1]);
  run_all(updates);
  return new_blocks;
}

// node_modules/svelte/src/shared/boolean_attributes.js
var _boolean_attributes = (
  /** @type {const} */
  [
    "allowfullscreen",
    "allowpaymentrequest",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "hidden",
    "inert",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected"
  ]
);
var boolean_attributes = /* @__PURE__ */ new Set([..._boolean_attributes]);

// node_modules/svelte/src/runtime/internal/Component.js
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  add_render_callback(() => {
    const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
    if (component.$$.on_destroy) {
      component.$$.on_destroy.push(...new_on_destroy);
    } else {
      run_all(new_on_destroy);
    }
    component.$$.on_mount = [];
  });
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance7, create_fragment7, not_equal, props, append_styles = null, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance7 ? instance7(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment7 ? create_fragment7($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor($$componentCtor, $$slots, use_shadow_dom) {
      super();
      /** The Svelte component constructor */
      __publicField(this, "$$ctor");
      /** Slots */
      __publicField(this, "$$s");
      /** The Svelte component instance */
      __publicField(this, "$$c");
      /** Whether or not the custom element is connected */
      __publicField(this, "$$cn", false);
      /** Component props data */
      __publicField(this, "$$d", {});
      /** `true` if currently in the process of reflecting component props back to attributes */
      __publicField(this, "$$r", false);
      /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
      __publicField(this, "$$p_d", {});
      /** @type {Record<string, Function[]>} Event listeners */
      __publicField(this, "$$l", {});
      /** @type {Map<Function, Function>} Event listener unsubscribe functions */
      __publicField(this, "$$l_u", /* @__PURE__ */ new Map());
      this.$$ctor = $$componentCtor;
      this.$$s = $$slots;
      if (use_shadow_dom) {
        this.attachShadow({ mode: "open" });
      }
    }
    addEventListener(type, listener, options) {
      this.$$l[type] = this.$$l[type] || [];
      this.$$l[type].push(listener);
      if (this.$$c) {
        const unsub = this.$$c.$on(type, listener);
        this.$$l_u.set(listener, unsub);
      }
      super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
      if (this.$$c) {
        const unsub = this.$$l_u.get(listener);
        if (unsub) {
          unsub();
          this.$$l_u.delete(listener);
        }
      }
      if (this.$$l[type]) {
        const idx = this.$$l[type].indexOf(listener);
        if (idx >= 0) {
          this.$$l[type].splice(idx, 1);
        }
      }
    }
    async connectedCallback() {
      this.$$cn = true;
      if (!this.$$c) {
        let create_slot = function(name) {
          return () => {
            let node;
            const obj = {
              c: function create() {
                node = element("slot");
                if (name !== "default") {
                  attr(node, "name", name);
                }
              },
              /**
               * @param {HTMLElement} target
               * @param {HTMLElement} [anchor]
               */
              m: function mount(target, anchor) {
                insert(target, node, anchor);
              },
              d: function destroy(detaching) {
                if (detaching) {
                  detach(node);
                }
              }
            };
            return obj;
          };
        };
        await Promise.resolve();
        if (!this.$$cn || this.$$c) {
          return;
        }
        const $$slots = {};
        const existing_slots = get_custom_elements_slots(this);
        for (const name of this.$$s) {
          if (name in existing_slots) {
            $$slots[name] = [create_slot(name)];
          }
        }
        for (const attribute of this.attributes) {
          const name = this.$$g_p(attribute.name);
          if (!(name in this.$$d)) {
            this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
          }
        }
        for (const key in this.$$p_d) {
          if (!(key in this.$$d) && this[key] !== void 0) {
            this.$$d[key] = this[key];
            delete this[key];
          }
        }
        this.$$c = new this.$$ctor({
          target: this.shadowRoot || this,
          props: {
            ...this.$$d,
            $$slots,
            $$scope: {
              ctx: []
            }
          }
        });
        const reflect_attributes = () => {
          this.$$r = true;
          for (const key in this.$$p_d) {
            this.$$d[key] = this.$$c.$$.ctx[this.$$c.$$.props[key]];
            if (this.$$p_d[key].reflect) {
              const attribute_value = get_custom_element_value(
                key,
                this.$$d[key],
                this.$$p_d,
                "toAttribute"
              );
              if (attribute_value == null) {
                this.removeAttribute(this.$$p_d[key].attribute || key);
              } else {
                this.setAttribute(this.$$p_d[key].attribute || key, attribute_value);
              }
            }
          }
          this.$$r = false;
        };
        this.$$c.$$.after_update.push(reflect_attributes);
        reflect_attributes();
        for (const type in this.$$l) {
          for (const listener of this.$$l[type]) {
            const unsub = this.$$c.$on(type, listener);
            this.$$l_u.set(listener, unsub);
          }
        }
        this.$$l = {};
      }
    }
    // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
    // and setting attributes through setAttribute etc, this is helpful
    attributeChangedCallback(attr2, _oldValue, newValue) {
      if (this.$$r)
        return;
      attr2 = this.$$g_p(attr2);
      this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
      this.$$c?.$set({ [attr2]: this.$$d[attr2] });
    }
    disconnectedCallback() {
      this.$$cn = false;
      Promise.resolve().then(() => {
        if (!this.$$cn && this.$$c) {
          this.$$c.$destroy();
          this.$$c = void 0;
        }
      });
    }
    $$g_p(attribute_name) {
      return Object.keys(this.$$p_d).find(
        (key) => this.$$p_d[key].attribute === attribute_name || !this.$$p_d[key].attribute && key.toLowerCase() === attribute_name
      ) || attribute_name;
    }
  };
}
function get_custom_element_value(prop, value, props_definition, transform) {
  const type = props_definition[prop]?.type;
  value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
  if (!transform || !props_definition[prop]) {
    return value;
  } else if (transform === "toAttribute") {
    switch (type) {
      case "Object":
      case "Array":
        return value == null ? null : JSON.stringify(value);
      case "Boolean":
        return value ? "" : null;
      case "Number":
        return value == null ? null : value;
      default:
        return value;
    }
  } else {
    switch (type) {
      case "Object":
      case "Array":
        return value && JSON.parse(value);
      case "Boolean":
        return value;
      case "Number":
        return value != null ? +value : value;
      default:
        return value;
    }
  }
}
var SvelteComponent = class {
  constructor() {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$");
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$set");
  }
  /** @returns {void} */
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  /**
   * @template {Extract<keyof Events, string>} K
   * @param {K} type
   * @param {((e: Events[K]) => void) | null | undefined} callback
   * @returns {() => void}
   */
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  /**
   * @param {Partial<Props>} props
   * @returns {void}
   */
  $set(props) {
    if (this.$$set && !is_empty(props)) {
      this.$$.skip_bound = true;
      this.$$set(props);
      this.$$.skip_bound = false;
    }
  }
};

// node_modules/svelte/src/shared/version.js
var PUBLIC_VERSION = "4";

// node_modules/svelte/src/runtime/internal/disclose-version/index.js
if (typeof window !== "undefined")
  (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);

// src/ui/DiffReviewBlock.svelte
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i];
  return child_ctx;
}
function create_if_block_1(ctx) {
  let span0;
  let t1;
  let span1;
  let svg;
  let path;
  let t2;
  let t3;
  return {
    c() {
      span0 = element("span");
      span0.textContent = "\xB7";
      t1 = space();
      span1 = element("span");
      svg = svg_element("svg");
      path = svg_element("path");
      t2 = space();
      t3 = text(
        /*fileName*/
        ctx[3]
      );
      attr(span0, "class", "db-sep svelte-1l0qhb1");
      attr(span0, "aria-hidden", "true");
      attr(path, "d", "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z");
      attr(svg, "width", "10");
      attr(svg, "height", "10");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2");
      attr(svg, "stroke-linecap", "round");
      attr(svg, "stroke-linejoin", "round");
      attr(svg, "aria-hidden", "true");
      attr(span1, "class", "db-filepath-chip svelte-1l0qhb1");
      attr(
        span1,
        "title",
        /*filePath*/
        ctx[2]
      );
    },
    m(target, anchor) {
      insert(target, span0, anchor);
      insert(target, t1, anchor);
      insert(target, span1, anchor);
      append(span1, svg);
      append(svg, path);
      append(span1, t2);
      append(span1, t3);
    },
    p(ctx2, dirty) {
      if (dirty & /*fileName*/
      8)
        set_data(
          t3,
          /*fileName*/
          ctx2[3]
        );
      if (dirty & /*filePath*/
      4) {
        attr(
          span1,
          "title",
          /*filePath*/
          ctx2[2]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(span0);
        detach(t1);
        detach(span1);
      }
    }
  };
}
function create_else_block(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = "No preview available";
      attr(div, "class", "db-no-diff svelte-1l0qhb1");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block(ctx) {
  let div1;
  let div0;
  let each_value = ensure_array_like(
    /*diffLines*/
    ctx[4]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div0, "class", "db-diff-inner svelte-1l0qhb1");
      attr(div1, "class", "db-diff svelte-1l0qhb1");
      attr(div1, "role", "region");
      attr(div1, "aria-label", "File diff");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*diffLines*/
      16) {
        each_value = ensure_array_like(
          /*diffLines*/
          ctx2[4]
        );
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div0, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block(ctx) {
  let div;
  let span2;
  let span0;
  let t0_value = (
    /*line*/
    (ctx[10].oldLine ?? "") + ""
  );
  let t0;
  let t1;
  let span1;
  let t2_value = (
    /*line*/
    (ctx[10].newLine ?? "") + ""
  );
  let t2;
  let t3;
  let span3;
  let t4_value = (
    /*line*/
    ctx[10].type === "add" ? "+" : (
      /*line*/
      ctx[10].type === "del" ? "-" : " "
    )
  );
  let t4;
  let t5;
  let span4;
  let t6_value = (
    /*line*/
    ctx[10].text + ""
  );
  let t6;
  let t7;
  let div_class_value;
  return {
    c() {
      div = element("div");
      span2 = element("span");
      span0 = element("span");
      t0 = text(t0_value);
      t1 = space();
      span1 = element("span");
      t2 = text(t2_value);
      t3 = space();
      span3 = element("span");
      t4 = text(t4_value);
      t5 = space();
      span4 = element("span");
      t6 = text(t6_value);
      t7 = space();
      attr(span0, "class", "db-gutter-old svelte-1l0qhb1");
      attr(span1, "class", "db-gutter-new svelte-1l0qhb1");
      attr(span2, "class", "db-gutter svelte-1l0qhb1");
      attr(span2, "aria-hidden", "true");
      attr(span3, "class", "db-sigil svelte-1l0qhb1");
      attr(span3, "aria-hidden", "true");
      attr(span4, "class", "db-text svelte-1l0qhb1");
      attr(div, "class", div_class_value = "db-line db-" + /*line*/
      ctx[10].type + " svelte-1l0qhb1");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span2);
      append(span2, span0);
      append(span0, t0);
      append(span2, t1);
      append(span2, span1);
      append(span1, t2);
      append(div, t3);
      append(div, span3);
      append(span3, t4);
      append(div, t5);
      append(div, span4);
      append(span4, t6);
      append(div, t7);
    },
    p(ctx2, dirty) {
      if (dirty & /*diffLines*/
      16 && t0_value !== (t0_value = /*line*/
      (ctx2[10].oldLine ?? "") + ""))
        set_data(t0, t0_value);
      if (dirty & /*diffLines*/
      16 && t2_value !== (t2_value = /*line*/
      (ctx2[10].newLine ?? "") + ""))
        set_data(t2, t2_value);
      if (dirty & /*diffLines*/
      16 && t4_value !== (t4_value = /*line*/
      ctx2[10].type === "add" ? "+" : (
        /*line*/
        ctx2[10].type === "del" ? "-" : " "
      )))
        set_data(t4, t4_value);
      if (dirty & /*diffLines*/
      16 && t6_value !== (t6_value = /*line*/
      ctx2[10].text + ""))
        set_data(t6, t6_value);
      if (dirty & /*diffLines*/
      16 && div_class_value !== (div_class_value = "db-line db-" + /*line*/
      ctx2[10].type + " svelte-1l0qhb1")) {
        attr(div, "class", div_class_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_fragment(ctx) {
  let div4;
  let div3;
  let div1;
  let div0;
  let svg0;
  let raw_value = (
    /*toolIcon*/
    ctx[6](
      /*p*/
      ctx[0].tool
    ) + ""
  );
  let t0;
  let span;
  let t1_value = (
    /*p*/
    ctx[0].tool.replace(/_/g, " ") + ""
  );
  let t1;
  let t2;
  let t3;
  let div2;
  let button0;
  let svg1;
  let polyline;
  let t4;
  let t5_value = (
    /*t*/
    ctx[5]("diff.approve") + ""
  );
  let t5;
  let t6;
  let button1;
  let svg2;
  let line0;
  let line1;
  let t7;
  let t8_value = (
    /*t*/
    ctx[5]("diff.reject") + ""
  );
  let t8;
  let t9;
  let mounted;
  let dispose;
  let if_block0 = (
    /*filePath*/
    ctx[2] && create_if_block_1(ctx)
  );
  function select_block_type(ctx2, dirty) {
    if (
      /*diffLines*/
      ctx2[4].length
    )
      return create_if_block;
    return create_else_block;
  }
  let current_block_type = select_block_type(ctx, -1);
  let if_block1 = current_block_type(ctx);
  return {
    c() {
      div4 = element("div");
      div3 = element("div");
      div1 = element("div");
      div0 = element("div");
      svg0 = svg_element("svg");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      if (if_block0)
        if_block0.c();
      t3 = space();
      div2 = element("div");
      button0 = element("button");
      svg1 = svg_element("svg");
      polyline = svg_element("polyline");
      t4 = space();
      t5 = text(t5_value);
      t6 = space();
      button1 = element("button");
      svg2 = svg_element("svg");
      line0 = svg_element("line");
      line1 = svg_element("line");
      t7 = space();
      t8 = text(t8_value);
      t9 = space();
      if_block1.c();
      attr(svg0, "width", "12");
      attr(svg0, "height", "12");
      attr(svg0, "viewBox", "0 0 24 24");
      attr(svg0, "fill", "none");
      attr(svg0, "stroke", "currentColor");
      attr(svg0, "stroke-width", "2");
      attr(svg0, "stroke-linecap", "round");
      attr(svg0, "stroke-linejoin", "round");
      attr(div0, "class", "db-tool-icon svelte-1l0qhb1");
      attr(div0, "aria-hidden", "true");
      attr(span, "class", "db-tool-name svelte-1l0qhb1");
      attr(div1, "class", "db-header-left svelte-1l0qhb1");
      attr(polyline, "points", "20 6 9 17 4 12");
      attr(svg1, "width", "11");
      attr(svg1, "height", "11");
      attr(svg1, "viewBox", "0 0 24 24");
      attr(svg1, "fill", "none");
      attr(svg1, "stroke", "currentColor");
      attr(svg1, "stroke-width", "2.5");
      attr(svg1, "stroke-linecap", "round");
      attr(svg1, "stroke-linejoin", "round");
      attr(svg1, "aria-hidden", "true");
      attr(button0, "class", "db-btn db-approve svelte-1l0qhb1");
      attr(line0, "x1", "18");
      attr(line0, "y1", "6");
      attr(line0, "x2", "6");
      attr(line0, "y2", "18");
      attr(line1, "x1", "6");
      attr(line1, "y1", "6");
      attr(line1, "x2", "18");
      attr(line1, "y2", "18");
      attr(svg2, "width", "11");
      attr(svg2, "height", "11");
      attr(svg2, "viewBox", "0 0 24 24");
      attr(svg2, "fill", "none");
      attr(svg2, "stroke", "currentColor");
      attr(svg2, "stroke-width", "2.5");
      attr(svg2, "stroke-linecap", "round");
      attr(svg2, "stroke-linejoin", "round");
      attr(svg2, "aria-hidden", "true");
      attr(button1, "class", "db-btn db-reject svelte-1l0qhb1");
      attr(div2, "class", "db-actions svelte-1l0qhb1");
      attr(div3, "class", "db-header svelte-1l0qhb1");
      attr(div4, "class", "db-root svelte-1l0qhb1");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div3);
      append(div3, div1);
      append(div1, div0);
      append(div0, svg0);
      svg0.innerHTML = raw_value;
      append(div1, t0);
      append(div1, span);
      append(span, t1);
      append(div1, t2);
      if (if_block0)
        if_block0.m(div1, null);
      append(div3, t3);
      append(div3, div2);
      append(div2, button0);
      append(button0, svg1);
      append(svg1, polyline);
      append(button0, t4);
      append(button0, t5);
      append(div2, t6);
      append(div2, button1);
      append(button1, svg2);
      append(svg2, line0);
      append(svg2, line1);
      append(button1, t7);
      append(button1, t8);
      append(div4, t9);
      if_block1.m(div4, null);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[7]
          ),
          listen(
            button1,
            "click",
            /*click_handler_1*/
            ctx[8]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*p*/
      1 && raw_value !== (raw_value = /*toolIcon*/
      ctx2[6](
        /*p*/
        ctx2[0].tool
      ) + ""))
        svg0.innerHTML = raw_value;
      ;
      if (dirty & /*p*/
      1 && t1_value !== (t1_value = /*p*/
      ctx2[0].tool.replace(/_/g, " ") + ""))
        set_data(t1, t1_value);
      if (
        /*filePath*/
        ctx2[2]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_1(ctx2);
          if_block0.c();
          if_block0.m(div1, null);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (current_block_type === (current_block_type = select_block_type(ctx2, dirty)) && if_block1) {
        if_block1.p(ctx2, dirty);
      } else {
        if_block1.d(1);
        if_block1 = current_block_type(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(div4, null);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div4);
      }
      if (if_block0)
        if_block0.d();
      if_block1.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function parseDiff(diff) {
  const result = [];
  let oldLine = 0, newLine = 0;
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("---") || raw.startsWith("+++"))
      continue;
    if (raw.startsWith("@@")) {
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldLine = parseInt(m[1]);
        newLine = parseInt(m[2]);
      }
      continue;
    }
    if (raw.startsWith("+")) {
      result.push({
        type: "add",
        text: raw.slice(1),
        newLine: newLine++
      });
    } else if (raw.startsWith("-")) {
      result.push({
        type: "del",
        text: raw.slice(1),
        oldLine: oldLine++
      });
    } else {
      result.push({
        type: "ctx",
        text: raw.slice(1),
        oldLine: oldLine++,
        newLine: newLine++
      });
    }
  }
  return result;
}
function instance($$self, $$props, $$invalidate) {
  let diffLines;
  let filePath;
  let fileName;
  let { p } = $$props;
  let { plugin } = $$props;
  const t = (k) => plugin.i18n.t(k);
  const TOOL_ICONS = {
    create_note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    edit_note: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    delete_note: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    move_note: '<polyline points="5 9 2 12 5 15"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/>',
    apply_patch: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>'
  };
  function toolIcon(name) {
    return TOOL_ICONS[name] ?? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  }
  const click_handler = () => plugin.approvalQueue.approve(p.toolCallId);
  const click_handler_1 = () => plugin.approvalQueue.reject(p.toolCallId);
  $$self.$$set = ($$props2) => {
    if ("p" in $$props2)
      $$invalidate(0, p = $$props2.p);
    if ("plugin" in $$props2)
      $$invalidate(1, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*p*/
    1) {
      $:
        $$invalidate(4, diffLines = p.diff ? parseDiff(p.diff) : []);
    }
    if ($$self.$$.dirty & /*p*/
    1) {
      $:
        $$invalidate(2, filePath = p.args?.path ?? p.args?.from ?? p.args?.to ?? "");
    }
    if ($$self.$$.dirty & /*filePath*/
    4) {
      $:
        $$invalidate(3, fileName = filePath ? filePath.split("/").pop() ?? filePath : "");
    }
  };
  return [
    p,
    plugin,
    filePath,
    fileName,
    diffLines,
    t,
    toolIcon,
    click_handler,
    click_handler_1
  ];
}
var DiffReviewBlock = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, { p: 0, plugin: 1 });
  }
};
var DiffReviewBlock_default = DiffReviewBlock;

// src/ui/ChangeSummary.svelte
function create_if_block2(ctx) {
  let div;
  let svg;
  let polyline;
  let t0;
  let span;
  let t2;
  let t3;
  let t4;
  let if_block0 = (
    /*summary*/
    ctx[0].created.length && create_if_block_3(ctx)
  );
  let if_block1 = (
    /*summary*/
    ctx[0].edited.length && create_if_block_2(ctx)
  );
  let if_block2 = (
    /*summary*/
    ctx[0].deleted.length && create_if_block_12(ctx)
  );
  return {
    c() {
      div = element("div");
      svg = svg_element("svg");
      polyline = svg_element("polyline");
      t0 = space();
      span = element("span");
      span.textContent = "Changes applied:";
      t2 = space();
      if (if_block0)
        if_block0.c();
      t3 = space();
      if (if_block1)
        if_block1.c();
      t4 = space();
      if (if_block2)
        if_block2.c();
      attr(polyline, "points", "20 6 9 17 4 12");
      attr(svg, "width", "11");
      attr(svg, "height", "11");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2.5");
      attr(svg, "stroke-linecap", "round");
      attr(svg, "stroke-linejoin", "round");
      attr(svg, "aria-hidden", "true");
      attr(span, "class", "cs-label svelte-1k9acmb");
      attr(div, "class", "cs-root svelte-1k9acmb");
      attr(div, "role", "status");
      attr(div, "aria-live", "polite");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, svg);
      append(svg, polyline);
      append(div, t0);
      append(div, span);
      append(div, t2);
      if (if_block0)
        if_block0.m(div, null);
      append(div, t3);
      if (if_block1)
        if_block1.m(div, null);
      append(div, t4);
      if (if_block2)
        if_block2.m(div, null);
    },
    p(ctx2, dirty) {
      if (
        /*summary*/
        ctx2[0].created.length
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_3(ctx2);
          if_block0.c();
          if_block0.m(div, t3);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*summary*/
        ctx2[0].edited.length
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_2(ctx2);
          if_block1.c();
          if_block1.m(div, t4);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*summary*/
        ctx2[0].deleted.length
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_12(ctx2);
          if_block2.c();
          if_block2.m(div, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
    }
  };
}
function create_if_block_3(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*summary*/
    ctx[0].created.length + ""
  );
  let t1;
  let t2;
  let t3_value = (
    /*t*/
    ctx[2]("summary.created", { count: (
      /*summary*/
      ctx[0].created.length
    ) }) + ""
  );
  let t3;
  return {
    c() {
      span = element("span");
      t0 = text("+");
      t1 = text(t1_value);
      t2 = space();
      t3 = text(t3_value);
      attr(span, "class", "cs-badge cs-create svelte-1k9acmb");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, t3);
    },
    p(ctx2, dirty) {
      if (dirty & /*summary*/
      1 && t1_value !== (t1_value = /*summary*/
      ctx2[0].created.length + ""))
        set_data(t1, t1_value);
      if (dirty & /*summary*/
      1 && t3_value !== (t3_value = /*t*/
      ctx2[2]("summary.created", { count: (
        /*summary*/
        ctx2[0].created.length
      ) }) + ""))
        set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_2(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*summary*/
    ctx[0].edited.length + ""
  );
  let t1;
  let t2;
  let t3_value = (
    /*t*/
    ctx[2]("summary.edited", { count: (
      /*summary*/
      ctx[0].edited.length
    ) }) + ""
  );
  let t3;
  return {
    c() {
      span = element("span");
      t0 = text("~");
      t1 = text(t1_value);
      t2 = space();
      t3 = text(t3_value);
      attr(span, "class", "cs-badge cs-edit svelte-1k9acmb");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, t3);
    },
    p(ctx2, dirty) {
      if (dirty & /*summary*/
      1 && t1_value !== (t1_value = /*summary*/
      ctx2[0].edited.length + ""))
        set_data(t1, t1_value);
      if (dirty & /*summary*/
      1 && t3_value !== (t3_value = /*t*/
      ctx2[2]("summary.edited", { count: (
        /*summary*/
        ctx2[0].edited.length
      ) }) + ""))
        set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_12(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*summary*/
    ctx[0].deleted.length + ""
  );
  let t1;
  let t2;
  let t3_value = (
    /*t*/
    ctx[2]("summary.deleted", { count: (
      /*summary*/
      ctx[0].deleted.length
    ) }) + ""
  );
  let t3;
  return {
    c() {
      span = element("span");
      t0 = text("-");
      t1 = text(t1_value);
      t2 = space();
      t3 = text(t3_value);
      attr(span, "class", "cs-badge cs-delete svelte-1k9acmb");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, t3);
    },
    p(ctx2, dirty) {
      if (dirty & /*summary*/
      1 && t1_value !== (t1_value = /*summary*/
      ctx2[0].deleted.length + ""))
        set_data(t1, t1_value);
      if (dirty & /*summary*/
      1 && t3_value !== (t3_value = /*t*/
      ctx2[2]("summary.deleted", { count: (
        /*summary*/
        ctx2[0].deleted.length
      ) }) + ""))
        set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_fragment2(ctx) {
  let if_block_anchor;
  let if_block = (
    /*summary*/
    ctx[0] && /*total*/
    ctx[1] > 0 && create_if_block2(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (
        /*summary*/
        ctx2[0] && /*total*/
        ctx2[1] > 0
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block2(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(if_block_anchor);
      }
      if (if_block)
        if_block.d(detaching);
    }
  };
}
function instance2($$self, $$props, $$invalidate) {
  let total;
  let { plugin } = $$props;
  let summary = plugin.lastTurnSummary;
  plugin.onSummaryChange((s) => $$invalidate(0, summary = s));
  const t = (k, v) => plugin.i18n.t(k, v);
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2)
      $$invalidate(3, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*summary*/
    1) {
      $:
        $$invalidate(1, total = (summary?.created.length ?? 0) + (summary?.edited.length ?? 0) + (summary?.deleted.length ?? 0));
    }
  };
  return [summary, total, t, plugin];
}
var ChangeSummary = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance2, create_fragment2, safe_not_equal, { plugin: 3 });
  }
};
var ChangeSummary_default = ChangeSummary;

// src/ui/markdown-action.ts
var import_obsidian4 = require("obsidian");
function markdown(node, params) {
  const owner = new import_obsidian4.Component();
  owner.load();
  let version = 0;
  async function render(p) {
    const v = ++version;
    node.empty();
    await import_obsidian4.MarkdownRenderer.render(p.plugin.app, p.text, node, "", owner);
    if (v !== version)
      return;
    node.querySelectorAll("pre").forEach(injectCodeHeader);
  }
  function injectCodeHeader(pre) {
    if (pre.querySelector(".ob-code-header"))
      return;
    const code = pre.querySelector("code");
    const lang = code?.className.match(/language-(\S+)/)?.[1] ?? "";
    const header = document.createElement("div");
    header.className = "ob-code-header";
    const langLabel = document.createElement("span");
    langLabel.className = "ob-code-lang";
    langLabel.textContent = lang;
    const btn = document.createElement("button");
    btn.className = "ob-copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", () => {
      const text2 = (code ?? pre).textContent ?? "";
      navigator.clipboard.writeText(text2).then(() => {
        btn.textContent = "\u2713 Copied";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 2e3);
      }).catch(() => {
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 2e3);
      });
    });
    header.appendChild(langLabel);
    header.appendChild(btn);
    pre.insertBefore(header, pre.firstChild);
  }
  render(params);
  return {
    update(newParams) {
      render(newParams);
    },
    destroy() {
      owner.unload();
    }
  };
}

// src/ui/MessageList.svelte
var { Map: Map_1 } = globals;
function get_each_context2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[11] = list[i];
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[14] = list[i];
  return child_ctx;
}
function get_if_ctx(ctx) {
  const child_ctx = ctx.slice();
  const constants_0 = (
    /*toolCallMap*/
    child_ctx[5].get(
      /*m*/
      child_ctx[14].toolCallId ?? ""
    )
  );
  child_ctx[17] = constants_0;
  return child_ctx;
}
function create_if_block_7(ctx) {
  let div1;
  return {
    c() {
      div1 = element("div");
      div1.innerHTML = `<div class="ml-empty-icon svelte-1d1wfbn" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div> <p class="ml-empty-title svelte-1d1wfbn">Start a conversation</p> <p class="ml-empty-hint svelte-1d1wfbn">Ask questions about your vault or switch to Edit mode to create and modify notes.</p>`;
      attr(div1, "class", "ml-empty svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
    }
  };
}
function create_if_block_5(ctx) {
  let div;
  let svg;
  let circle;
  let line;
  let t0;
  let span0;
  let t1_value = (
    /*tc*/
    (ctx[17]?.name ?? "tool") + ""
  );
  let t1;
  let t2;
  let show_if = (
    /*tc*/
    ctx[17]?.args && firstArgHint(
      /*tc*/
      ctx[17].args
    )
  );
  let t3;
  let span1;
  let t5;
  let span2;
  let t6_value = previewResult(
    /*m*/
    ctx[14].content
  ) + "";
  let t6;
  let div_title_value;
  let if_block = show_if && create_if_block_6(ctx);
  return {
    c() {
      div = element("div");
      svg = svg_element("svg");
      circle = svg_element("circle");
      line = svg_element("line");
      t0 = space();
      span0 = element("span");
      t1 = text(t1_value);
      t2 = space();
      if (if_block)
        if_block.c();
      t3 = space();
      span1 = element("span");
      span1.textContent = "\u2192";
      t5 = space();
      span2 = element("span");
      t6 = text(t6_value);
      attr(circle, "cx", "11");
      attr(circle, "cy", "11");
      attr(circle, "r", "8");
      attr(line, "x1", "21");
      attr(line, "y1", "21");
      attr(line, "x2", "16.65");
      attr(line, "y2", "16.65");
      attr(svg, "width", "10");
      attr(svg, "height", "10");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2");
      attr(svg, "stroke-linecap", "round");
      attr(svg, "stroke-linejoin", "round");
      attr(svg, "aria-hidden", "true");
      attr(span0, "class", "ml-tool-name svelte-1d1wfbn");
      attr(span1, "class", "ml-tool-sep svelte-1d1wfbn");
      attr(span2, "class", "ml-tool-preview svelte-1d1wfbn");
      attr(div, "class", "ml-tool-result svelte-1d1wfbn");
      attr(div, "title", div_title_value = /*m*/
      ctx[14].content);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, svg);
      append(svg, circle);
      append(svg, line);
      append(div, t0);
      append(div, span0);
      append(span0, t1);
      append(div, t2);
      if (if_block)
        if_block.m(div, null);
      append(div, t3);
      append(div, span1);
      append(div, t5);
      append(div, span2);
      append(span2, t6);
    },
    p(ctx2, dirty) {
      if (dirty & /*toolCallMap, messages*/
      33 && t1_value !== (t1_value = /*tc*/
      (ctx2[17]?.name ?? "tool") + ""))
        set_data(t1, t1_value);
      if (dirty & /*toolCallMap, messages*/
      33)
        show_if = /*tc*/
        ctx2[17]?.args && firstArgHint(
          /*tc*/
          ctx2[17].args
        );
      if (show_if) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_6(ctx2);
          if_block.c();
          if_block.m(div, t3);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & /*messages*/
      1 && t6_value !== (t6_value = previewResult(
        /*m*/
        ctx2[14].content
      ) + ""))
        set_data(t6, t6_value);
      if (dirty & /*messages*/
      1 && div_title_value !== (div_title_value = /*m*/
      ctx2[14].content)) {
        attr(div, "title", div_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block)
        if_block.d();
    }
  };
}
function create_if_block_32(ctx) {
  let div1;
  let div0;
  let t1;
  let show_if;
  function select_block_type_1(ctx2, dirty) {
    if (dirty & /*messages*/
    1)
      show_if = null;
    if (show_if == null)
      show_if = !!isError(
        /*m*/
        ctx2[14].content
      );
    if (show_if)
      return create_if_block_4;
    return create_else_block2;
  }
  let current_block_type = select_block_type_1(ctx, -1);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      div0.textContent = "Agent";
      t1 = space();
      if_block.c();
      attr(div0, "class", "ml-name ml-name-agent svelte-1d1wfbn");
      attr(div1, "class", "ml-turn ml-turn-agent svelte-1d1wfbn");
      toggle_class(div1, "ml-error", isError(
        /*m*/
        ctx[14].content
      ));
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div1, t1);
      if_block.m(div1, null);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div1, null);
        }
      }
      if (dirty & /*isError, messages*/
      1) {
        toggle_class(div1, "ml-error", isError(
          /*m*/
          ctx2[14].content
        ));
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      if_block.d();
    }
  };
}
function create_if_block_22(ctx) {
  let div2;
  let div0;
  let t1;
  let div1;
  let t2_value = (
    /*m*/
    ctx[14].content + ""
  );
  let t2;
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      div0.textContent = "You";
      t1 = space();
      div1 = element("div");
      t2 = text(t2_value);
      attr(div0, "class", "ml-name ml-name-user svelte-1d1wfbn");
      attr(div1, "class", "ml-content svelte-1d1wfbn");
      attr(div2, "class", "ml-turn ml-turn-user svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div2, t1);
      append(div2, div1);
      append(div1, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*messages*/
      1 && t2_value !== (t2_value = /*m*/
      ctx2[14].content + ""))
        set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
    }
  };
}
function create_if_block_6(ctx) {
  let span;
  let t0;
  let t1_value = firstArgHint(
    /*tc*/
    ctx[17].args
  ) + "";
  let t1;
  let t2;
  return {
    c() {
      span = element("span");
      t0 = text('"');
      t1 = text(t1_value);
      t2 = text('"');
      attr(span, "class", "ml-tool-arg svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*toolCallMap, messages*/
      33 && t1_value !== (t1_value = firstArgHint(
        /*tc*/
        ctx2[17].args
      ) + ""))
        set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_else_block2(ctx) {
  let div;
  let markdown_action;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      attr(div, "class", "ml-content svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (!mounted) {
        dispose = action_destroyer(markdown_action = markdown.call(null, div, {
          text: (
            /*m*/
            ctx[14].content
          ),
          plugin: (
            /*plugin*/
            ctx[3]
          )
        }));
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (markdown_action && is_function(markdown_action.update) && dirty & /*messages, plugin*/
      9)
        markdown_action.update.call(null, {
          text: (
            /*m*/
            ctx[14].content
          ),
          plugin: (
            /*plugin*/
            ctx[3]
          )
        });
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_4(ctx) {
  let div;
  let t_value = (
    /*m*/
    ctx[14].content + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "ml-content ml-content-error svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*messages*/
      1 && t_value !== (t_value = /*m*/
      ctx2[14].content + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_each_block_1(key_1, ctx) {
  let first;
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (
      /*m*/
      ctx2[14].role === "user"
    )
      return create_if_block_22;
    if (
      /*m*/
      ctx2[14].role === "assistant"
    )
      return create_if_block_32;
    if (
      /*m*/
      ctx2[14].role === "tool"
    )
      return create_if_block_5;
  }
  function select_block_ctx(ctx2, type) {
    if (type === create_if_block_5)
      return get_if_ctx(ctx2);
    return ctx2;
  }
  let current_block_type = select_block_type(ctx, -1);
  let if_block = current_block_type && current_block_type(select_block_ctx(ctx, current_block_type));
  return {
    key: key_1,
    first: null,
    c() {
      first = empty();
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
      this.first = first;
    },
    m(target, anchor) {
      insert(target, first, anchor);
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
        if_block.p(select_block_ctx(ctx, current_block_type), dirty);
      } else {
        if (if_block)
          if_block.d(1);
        if_block = current_block_type && current_block_type(select_block_ctx(ctx, current_block_type));
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(first);
        detach(if_block_anchor);
      }
      if (if_block) {
        if_block.d(detaching);
      }
    }
  };
}
function create_if_block_13(ctx) {
  let div2;
  let div0;
  let t1;
  let div1;
  let markdown_action;
  let t2;
  let span;
  let mounted;
  let dispose;
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      div0.textContent = "Agent";
      t1 = space();
      div1 = element("div");
      t2 = space();
      span = element("span");
      attr(div0, "class", "ml-name ml-name-agent svelte-1d1wfbn");
      attr(div1, "class", "ml-content svelte-1d1wfbn");
      attr(span, "class", "ml-cursor svelte-1d1wfbn");
      attr(span, "aria-hidden", "true");
      attr(div2, "class", "ml-turn ml-turn-agent svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div2, t1);
      append(div2, div1);
      append(div2, t2);
      append(div2, span);
      if (!mounted) {
        dispose = action_destroyer(markdown_action = markdown.call(null, div1, {
          text: (
            /*streamBuf*/
            ctx[1]
          ),
          plugin: (
            /*plugin*/
            ctx[3]
          )
        }));
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (markdown_action && is_function(markdown_action.update) && dirty & /*streamBuf, plugin*/
      10)
        markdown_action.update.call(null, {
          text: (
            /*streamBuf*/
            ctx2[1]
          ),
          plugin: (
            /*plugin*/
            ctx2[3]
          )
        });
    },
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block3(ctx) {
  let div1;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t0;
  let div0;
  let button0;
  let t1_value = (
    /*plugin*/
    ctx[3].i18n.t("diff.applyAll") + ""
  );
  let t1;
  let t2;
  let button1;
  let t3_value = (
    /*plugin*/
    ctx[3].i18n.t("diff.rejectAll") + ""
  );
  let t3;
  let current;
  let mounted;
  let dispose;
  let each_value = ensure_array_like(
    /*pending*/
    ctx[2]
  );
  const get_key = (ctx2) => (
    /*p*/
    ctx2[11].toolCallId
  );
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context2(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block2(key, child_ctx));
  }
  return {
    c() {
      div1 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t0 = space();
      div0 = element("div");
      button0 = element("button");
      t1 = text(t1_value);
      t2 = space();
      button1 = element("button");
      t3 = text(t3_value);
      attr(button0, "class", "ml-bulk-btn ml-bulk-approve svelte-1d1wfbn");
      attr(button1, "class", "ml-bulk-btn ml-bulk-reject svelte-1d1wfbn");
      attr(div0, "class", "ml-bulk-actions svelte-1d1wfbn");
      attr(div1, "class", "ml-pending-group svelte-1d1wfbn");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div1, null);
        }
      }
      append(div1, t0);
      append(div1, div0);
      append(div0, button0);
      append(button0, t1);
      append(div0, t2);
      append(div0, button1);
      append(button1, t3);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[7]
          ),
          listen(
            button1,
            "click",
            /*click_handler_1*/
            ctx[8]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*pending, plugin*/
      12) {
        each_value = ensure_array_like(
          /*pending*/
          ctx2[2]
        );
        group_outros();
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div1, outro_and_destroy_block, create_each_block2, t0, get_each_context2);
        check_outros();
      }
      if ((!current || dirty & /*plugin*/
      8) && t1_value !== (t1_value = /*plugin*/
      ctx2[3].i18n.t("diff.applyAll") + ""))
        set_data(t1, t1_value);
      if ((!current || dirty & /*plugin*/
      8) && t3_value !== (t3_value = /*plugin*/
      ctx2[3].i18n.t("diff.rejectAll") + ""))
        set_data(t3, t3_value);
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block2(key_1, ctx) {
  let first;
  let diffreviewblock;
  let current;
  diffreviewblock = new DiffReviewBlock_default({
    props: {
      p: (
        /*p*/
        ctx[11]
      ),
      plugin: (
        /*plugin*/
        ctx[3]
      )
    }
  });
  return {
    key: key_1,
    first: null,
    c() {
      first = empty();
      create_component(diffreviewblock.$$.fragment);
      this.first = first;
    },
    m(target, anchor) {
      insert(target, first, anchor);
      mount_component(diffreviewblock, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const diffreviewblock_changes = {};
      if (dirty & /*pending*/
      4)
        diffreviewblock_changes.p = /*p*/
        ctx[11];
      if (dirty & /*plugin*/
      8)
        diffreviewblock_changes.plugin = /*plugin*/
        ctx[3];
      diffreviewblock.$set(diffreviewblock_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(diffreviewblock.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(diffreviewblock.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(first);
      }
      destroy_component(diffreviewblock, detaching);
    }
  };
}
function create_fragment3(ctx) {
  let div;
  let show_if = (
    /*messages*/
    ctx[0].filter(func).length === 0 && !/*streamBuf*/
    ctx[1]
  );
  let t0;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t1;
  let t2;
  let t3;
  let changesummary;
  let current;
  let mounted;
  let dispose;
  let if_block0 = show_if && create_if_block_7(ctx);
  let each_value_1 = ensure_array_like(
    /*messages*/
    ctx[0]
  );
  const get_key = (ctx2) => (
    /*m*/
    ctx2[14]
  );
  for (let i = 0; i < each_value_1.length; i += 1) {
    let child_ctx = get_each_context_1(ctx, each_value_1, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
  }
  let if_block1 = (
    /*streamBuf*/
    ctx[1] && create_if_block_13(ctx)
  );
  let if_block2 = (
    /*pending*/
    ctx[2].length && create_if_block3(ctx)
  );
  changesummary = new ChangeSummary_default({ props: { plugin: (
    /*plugin*/
    ctx[3]
  ) } });
  return {
    c() {
      div = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t1 = space();
      if (if_block1)
        if_block1.c();
      t2 = space();
      if (if_block2)
        if_block2.c();
      t3 = space();
      create_component(changesummary.$$.fragment);
      attr(div, "class", "ml-root svelte-1d1wfbn");
      attr(div, "role", "log");
      attr(div, "aria-live", "polite");
      attr(div, "aria-label", "Chat messages");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block0)
        if_block0.m(div, null);
      append(div, t0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
      append(div, t1);
      if (if_block1)
        if_block1.m(div, null);
      append(div, t2);
      if (if_block2)
        if_block2.m(div, null);
      append(div, t3);
      mount_component(changesummary, div, null);
      ctx[9](div);
      current = true;
      if (!mounted) {
        dispose = listen(
          div,
          "scroll",
          /*onScroll*/
          ctx[6]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*messages, streamBuf*/
      3)
        show_if = /*messages*/
        ctx2[0].filter(func).length === 0 && !/*streamBuf*/
        ctx2[1];
      if (show_if) {
        if (if_block0) {
        } else {
          if_block0 = create_if_block_7(ctx2);
          if_block0.c();
          if_block0.m(div, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & /*messages, isError, plugin, previewResult, firstArgHint, toolCallMap*/
      41) {
        each_value_1 = ensure_array_like(
          /*messages*/
          ctx2[0]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1, t1, get_each_context_1);
      }
      if (
        /*streamBuf*/
        ctx2[1]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_13(ctx2);
          if_block1.c();
          if_block1.m(div, t2);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*pending*/
        ctx2[2].length
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
          if (dirty & /*pending*/
          4) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block3(ctx2);
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(div, t3);
        }
      } else if (if_block2) {
        group_outros();
        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });
        check_outros();
      }
      const changesummary_changes = {};
      if (dirty & /*plugin*/
      8)
        changesummary_changes.plugin = /*plugin*/
        ctx2[3];
      changesummary.$set(changesummary_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block2);
      transition_in(changesummary.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block2);
      transition_out(changesummary.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block0)
        if_block0.d();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
      destroy_component(changesummary);
      ctx[9](null);
      mounted = false;
      dispose();
    }
  };
}
function isError(content) {
  return content.startsWith("\u26A0");
}
function firstArgHint(args) {
  const val = Object.values(args ?? {})[0];
  if (!val)
    return "";
  const s = String(val);
  return s.length > 40 ? s.slice(0, 40) + "\u2026" : s;
}
function previewResult(content) {
  try {
    const json = JSON.parse(content);
    if (Array.isArray(json)) {
      if (json.length === 0)
        return "no results";
      const label2 = json[0]?.path !== void 0 ? "note" : "item";
      return `${json.length} ${label2}${json.length === 1 ? "" : "s"}`;
    }
    if (json && typeof json === "object") {
      if ("error" in json)
        return `error: ${String(json.error).slice(0, 60)}`;
      if ("status" in json)
        return String(json.status);
    }
    if (typeof json === "string")
      return json.slice(0, 80);
  } catch {
  }
  return content.length > 80 ? content.slice(0, 80) + "\u2026" : content;
}
var func = (m) => m.role === "user" || m.role === "assistant";
function instance3($$self, $$props, $$invalidate) {
  let toolCallMap;
  let { messages } = $$props;
  let { streamBuf } = $$props;
  let { pending: pending2 } = $$props;
  let { plugin } = $$props;
  let scrollEl;
  let userScrolledUp = false;
  afterUpdate(() => {
    if (!userScrolledUp && scrollEl)
      $$invalidate(4, scrollEl.scrollTop = scrollEl.scrollHeight, scrollEl);
  });
  function onScroll() {
    if (!scrollEl)
      return;
    userScrolledUp = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight > 60;
  }
  const click_handler = () => plugin.approvalQueue.approveAll();
  const click_handler_1 = () => plugin.approvalQueue.rejectAll();
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      scrollEl = $$value;
      $$invalidate(4, scrollEl);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("messages" in $$props2)
      $$invalidate(0, messages = $$props2.messages);
    if ("streamBuf" in $$props2)
      $$invalidate(1, streamBuf = $$props2.streamBuf);
    if ("pending" in $$props2)
      $$invalidate(2, pending2 = $$props2.pending);
    if ("plugin" in $$props2)
      $$invalidate(3, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*messages*/
    1) {
      $:
        $$invalidate(5, toolCallMap = new Map(messages.filter((m) => m.role === "assistant" && m.toolCalls?.length).flatMap((m) => m.toolCalls.map((tc) => [tc.id, tc]))));
    }
  };
  return [
    messages,
    streamBuf,
    pending2,
    plugin,
    scrollEl,
    toolCallMap,
    onScroll,
    click_handler,
    click_handler_1,
    div_binding
  ];
}
var MessageList = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance3, create_fragment3, safe_not_equal, {
      messages: 0,
      streamBuf: 1,
      pending: 2,
      plugin: 3
    });
  }
};
var MessageList_default = MessageList;

// src/ui/ModeToggle.svelte
function create_fragment4(ctx) {
  let div;
  let button0;
  let svg0;
  let circle;
  let line;
  let t0;
  let t1_value = (
    /*plugin*/
    ctx[0].i18n.t("chat.mode.ask") + ""
  );
  let t1;
  let button0_aria_pressed_value;
  let t2;
  let button1;
  let svg1;
  let path0;
  let path1;
  let t3;
  let t4_value = (
    /*plugin*/
    ctx[0].i18n.t("chat.mode.edit") + ""
  );
  let t4;
  let button1_aria_pressed_value;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button0 = element("button");
      svg0 = svg_element("svg");
      circle = svg_element("circle");
      line = svg_element("line");
      t0 = space();
      t1 = text(t1_value);
      t2 = space();
      button1 = element("button");
      svg1 = svg_element("svg");
      path0 = svg_element("path");
      path1 = svg_element("path");
      t3 = space();
      t4 = text(t4_value);
      attr(circle, "cx", "11");
      attr(circle, "cy", "11");
      attr(circle, "r", "8");
      attr(line, "x1", "21");
      attr(line, "y1", "21");
      attr(line, "x2", "16.65");
      attr(line, "y2", "16.65");
      attr(svg0, "width", "11");
      attr(svg0, "height", "11");
      attr(svg0, "viewBox", "0 0 24 24");
      attr(svg0, "fill", "none");
      attr(svg0, "stroke", "currentColor");
      attr(svg0, "stroke-width", "2");
      attr(svg0, "stroke-linecap", "round");
      attr(svg0, "stroke-linejoin", "round");
      attr(svg0, "aria-hidden", "true");
      attr(button0, "class", "mt-option svelte-14w3f6r");
      attr(button0, "aria-pressed", button0_aria_pressed_value = /*mode*/
      ctx[1] === "ask");
      toggle_class(
        button0,
        "mt-active",
        /*mode*/
        ctx[1] === "ask"
      );
      attr(path0, "d", "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7");
      attr(path1, "d", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z");
      attr(svg1, "width", "11");
      attr(svg1, "height", "11");
      attr(svg1, "viewBox", "0 0 24 24");
      attr(svg1, "fill", "none");
      attr(svg1, "stroke", "currentColor");
      attr(svg1, "stroke-width", "2");
      attr(svg1, "stroke-linecap", "round");
      attr(svg1, "stroke-linejoin", "round");
      attr(svg1, "aria-hidden", "true");
      attr(button1, "class", "mt-option svelte-14w3f6r");
      attr(button1, "aria-pressed", button1_aria_pressed_value = /*mode*/
      ctx[1] === "edit");
      toggle_class(
        button1,
        "mt-active",
        /*mode*/
        ctx[1] === "edit"
      );
      attr(div, "class", "mt-root svelte-14w3f6r");
      attr(div, "role", "group");
      attr(div, "aria-label", "Chat mode");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button0);
      append(button0, svg0);
      append(svg0, circle);
      append(svg0, line);
      append(button0, t0);
      append(button0, t1);
      append(div, t2);
      append(div, button1);
      append(button1, svg1);
      append(svg1, path0);
      append(svg1, path1);
      append(button1, t3);
      append(button1, t4);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[3]
          ),
          listen(
            button1,
            "click",
            /*click_handler_1*/
            ctx[4]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*plugin*/
      1 && t1_value !== (t1_value = /*plugin*/
      ctx2[0].i18n.t("chat.mode.ask") + ""))
        set_data(t1, t1_value);
      if (dirty & /*mode*/
      2 && button0_aria_pressed_value !== (button0_aria_pressed_value = /*mode*/
      ctx2[1] === "ask")) {
        attr(button0, "aria-pressed", button0_aria_pressed_value);
      }
      if (dirty & /*mode*/
      2) {
        toggle_class(
          button0,
          "mt-active",
          /*mode*/
          ctx2[1] === "ask"
        );
      }
      if (dirty & /*plugin*/
      1 && t4_value !== (t4_value = /*plugin*/
      ctx2[0].i18n.t("chat.mode.edit") + ""))
        set_data(t4, t4_value);
      if (dirty & /*mode*/
      2 && button1_aria_pressed_value !== (button1_aria_pressed_value = /*mode*/
      ctx2[1] === "edit")) {
        attr(button1, "aria-pressed", button1_aria_pressed_value);
      }
      if (dirty & /*mode*/
      2) {
        toggle_class(
          button1,
          "mt-active",
          /*mode*/
          ctx2[1] === "edit"
        );
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance4($$self, $$props, $$invalidate) {
  let { plugin } = $$props;
  let mode = plugin.settings.mode;
  async function set(m) {
    $$invalidate(1, mode = m);
    $$invalidate(0, plugin.settings.mode = m, plugin);
    $$invalidate(0, plugin.currentConversation.mode = m, plugin);
    await plugin.saveSettings();
  }
  const click_handler = () => set("ask");
  const click_handler_1 = () => set("edit");
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2)
      $$invalidate(0, plugin = $$props2.plugin);
  };
  return [plugin, mode, set, click_handler, click_handler_1];
}
var ModeToggle = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance4, create_fragment4, safe_not_equal, { plugin: 0 });
  }
};
var ModeToggle_default = ModeToggle;

// src/ui/ConversationList.svelte
var { Map: Map_12 } = globals;
function get_each_context3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[8] = list[i];
  return child_ctx;
}
function get_each_context_12(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[11] = list[i];
  const constants_0 = rowDate(
    /*p*/
    child_ctx[11],
    /*group*/
    child_ctx[8].label
  );
  child_ctx[12] = constants_0;
  return child_ctx;
}
function create_else_block3(ctx) {
  let each_blocks = [];
  let each_1_lookup = new Map_12();
  let each_1_anchor;
  let each_value = ensure_array_like(
    /*groups*/
    ctx[1]
  );
  const get_key = (ctx2) => (
    /*group*/
    ctx2[8].label
  );
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context3(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block3(key, child_ctx));
  }
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*groups, active, undefined, open, rowDate, label*/
      7) {
        each_value = ensure_array_like(
          /*groups*/
          ctx2[1]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block3, each_1_anchor, get_each_context3);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(each_1_anchor);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d(detaching);
      }
    }
  };
}
function create_if_block4(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = "No saved conversations";
      attr(div, "class", "cl-empty svelte-19fxzhc");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_14(ctx) {
  let span;
  let t_value = (
    /*d*/
    ctx[12] + ""
  );
  let t;
  return {
    c() {
      span = element("span");
      t = text(t_value);
      attr(span, "class", "cl-date svelte-19fxzhc");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*groups*/
      2 && t_value !== (t_value = /*d*/
      ctx2[12] + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_each_block_12(key_1, ctx) {
  let button;
  let svg;
  let path;
  let t0;
  let span;
  let t1_value = label(
    /*p*/
    ctx[11]
  ) + "";
  let t1;
  let t2;
  let t3;
  let button_title_value;
  let button_aria_current_value;
  let mounted;
  let dispose;
  let if_block = (
    /*d*/
    ctx[12] && create_if_block_14(ctx)
  );
  function click_handler() {
    return (
      /*click_handler*/
      ctx[6](
        /*p*/
        ctx[11]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      button = element("button");
      svg = svg_element("svg");
      path = svg_element("path");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      if (if_block)
        if_block.c();
      t3 = space();
      attr(path, "d", "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
      attr(svg, "class", "cl-icon svelte-19fxzhc");
      attr(svg, "width", "11");
      attr(svg, "height", "11");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2");
      attr(svg, "stroke-linecap", "round");
      attr(svg, "stroke-linejoin", "round");
      attr(svg, "aria-hidden", "true");
      attr(span, "class", "cl-label svelte-19fxzhc");
      attr(button, "class", "cl-item svelte-19fxzhc");
      attr(button, "title", button_title_value = /*p*/
      ctx[11]);
      attr(button, "aria-current", button_aria_current_value = /*p*/
      ctx[11] === /*active*/
      ctx[0] ? "page" : void 0);
      toggle_class(
        button,
        "cl-active",
        /*p*/
        ctx[11] === /*active*/
        ctx[0]
      );
      this.first = button;
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, svg);
      append(svg, path);
      append(button, t0);
      append(button, span);
      append(span, t1);
      append(button, t2);
      if (if_block)
        if_block.m(button, null);
      append(button, t3);
      if (!mounted) {
        dispose = listen(button, "click", click_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*groups*/
      2 && t1_value !== (t1_value = label(
        /*p*/
        ctx[11]
      ) + ""))
        set_data(t1, t1_value);
      if (
        /*d*/
        ctx[12]
      ) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_14(ctx);
          if_block.c();
          if_block.m(button, t3);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & /*groups*/
      2 && button_title_value !== (button_title_value = /*p*/
      ctx[11])) {
        attr(button, "title", button_title_value);
      }
      if (dirty & /*groups, active*/
      3 && button_aria_current_value !== (button_aria_current_value = /*p*/
      ctx[11] === /*active*/
      ctx[0] ? "page" : void 0)) {
        attr(button, "aria-current", button_aria_current_value);
      }
      if (dirty & /*groups, active*/
      3) {
        toggle_class(
          button,
          "cl-active",
          /*p*/
          ctx[11] === /*active*/
          ctx[0]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      if (if_block)
        if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_each_block3(key_1, ctx) {
  let div;
  let t0_value = (
    /*group*/
    ctx[8].label + ""
  );
  let t0;
  let t1;
  let each_blocks = [];
  let each_1_lookup = new Map_12();
  let each_1_anchor;
  let each_value_1 = ensure_array_like(
    /*group*/
    ctx[8].paths
  );
  const get_key = (ctx2) => (
    /*p*/
    ctx2[11]
  );
  for (let i = 0; i < each_value_1.length; i += 1) {
    let child_ctx = get_each_context_12(ctx, each_value_1, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_12(key, child_ctx));
  }
  return {
    key: key_1,
    first: null,
    c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
      attr(div, "class", "cl-section-label svelte-19fxzhc");
      this.first = div;
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      insert(target, t1, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, each_1_anchor, anchor);
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*groups*/
      2 && t0_value !== (t0_value = /*group*/
      ctx[8].label + ""))
        set_data(t0, t0_value);
      if (dirty & /*groups, active, undefined, open, rowDate, label*/
      7) {
        each_value_1 = ensure_array_like(
          /*group*/
          ctx[8].paths
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block_12, each_1_anchor, get_each_context_12);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t1);
        detach(each_1_anchor);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d(detaching);
      }
    }
  };
}
function create_fragment5(ctx) {
  let div;
  let t0;
  let button;
  let mounted;
  let dispose;
  function select_block_type(ctx2, dirty) {
    if (
      /*groups*/
      ctx2[1].length === 0
    )
      return create_if_block4;
    return create_else_block3;
  }
  let current_block_type = select_block_type(ctx, -1);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div = element("div");
      if_block.c();
      t0 = space();
      button = element("button");
      button.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    New conversation`;
      attr(button, "class", "cl-new-btn svelte-19fxzhc");
      attr(div, "class", "cl-root svelte-19fxzhc");
      attr(div, "role", "navigation");
      attr(div, "aria-label", "Conversation history");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if_block.m(div, null);
      append(div, t0);
      append(div, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*startNew*/
          ctx[3]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div, t0);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function label(p) {
  return (p.split("/").pop() ?? p).replace(/\.md$/i, "");
}
function formatDate(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dy}`;
}
function dateLabel(p) {
  const today = /* @__PURE__ */ new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const m = p.match(/(\d{4}-\d{2}-\d{2})/);
  if (!m)
    return "Older";
  if (m[1] === formatDate(today))
    return "Today";
  if (m[1] === formatDate(yesterday))
    return "Yesterday";
  return m[1];
}
function rowDate(p, groupLbl) {
  if (groupLbl === "Today" || groupLbl === "Yesterday")
    return "";
  const m = p.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m)
    return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  return `${months[parseInt(m[2]) - 1]} ${parseInt(m[3])}`;
}
function groupPaths(ps) {
  const map = /* @__PURE__ */ new Map();
  for (const p of ps) {
    const key = dateLabel(p);
    if (!map.has(key))
      map.set(key, []);
    map.get(key).push(p);
  }
  const pinned = ["Today", "Yesterday"];
  const entries = [...map.entries()];
  entries.sort(([a], [b]) => {
    const ia = pinned.indexOf(a);
    const ib = pinned.indexOf(b);
    if (ia !== -1 && ib !== -1)
      return ia - ib;
    if (ia !== -1)
      return -1;
    if (ib !== -1)
      return 1;
    if (a === "Older")
      return 1;
    if (b === "Older")
      return -1;
    return b.localeCompare(a);
  });
  return entries.map(([lbl, items]) => ({ label: lbl, paths: items }));
}
function instance5($$self, $$props, $$invalidate) {
  let groups;
  let { plugin } = $$props;
  const dispatch = createEventDispatcher();
  let paths = [];
  let active = plugin.currentConversation?.path ?? "";
  onMount(async () => {
    $$invalidate(5, paths = await plugin.conversations.list());
  });
  async function open(p) {
    await plugin.openConversation(p);
    $$invalidate(0, active = p);
    dispatch("select");
  }
  function startNew() {
    dispatch("newChat");
  }
  const click_handler = (p) => open(p);
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2)
      $$invalidate(4, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*paths*/
    32) {
      $:
        $$invalidate(1, groups = groupPaths(paths));
    }
  };
  return [active, groups, open, startNew, plugin, paths, click_handler];
}
var ConversationList = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance5, create_fragment5, safe_not_equal, { plugin: 4 });
  }
};
var ConversationList_default = ConversationList;

// src/ui/ChatView.svelte
function create_if_block_23(ctx) {
  let div;
  let conversationlist;
  let current;
  conversationlist = new ConversationList_default({ props: { plugin: (
    /*plugin*/
    ctx[0]
  ) } });
  conversationlist.$on(
    "select",
    /*onConversationSelect*/
    ctx[15]
  );
  conversationlist.$on(
    "newChat",
    /*newChat*/
    ctx[14]
  );
  return {
    c() {
      div = element("div");
      create_component(conversationlist.$$.fragment);
      attr(div, "class", "ac-history-drawer svelte-9ylsa4");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(conversationlist, div, null);
      current = true;
    },
    p(ctx2, dirty) {
      const conversationlist_changes = {};
      if (dirty & /*plugin*/
      1)
        conversationlist_changes.plugin = /*plugin*/
        ctx2[0];
      conversationlist.$set(conversationlist_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(conversationlist.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(conversationlist.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_component(conversationlist);
    }
  };
}
function create_else_block_1(ctx) {
  let span;
  return {
    c() {
      span = element("span");
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_15(ctx) {
  let span;
  let t_1;
  return {
    c() {
      span = element("span");
      t_1 = text(
        /*charCount*/
        ctx[2]
      );
      attr(span, "class", "ac-char-count svelte-9ylsa4");
      toggle_class(
        span,
        "ac-char-warn",
        /*charCount*/
        ctx[2] > 2e3
      );
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t_1);
    },
    p(ctx2, dirty) {
      if (dirty & /*charCount*/
      4)
        set_data(
          t_1,
          /*charCount*/
          ctx2[2]
        );
      if (dirty & /*charCount*/
      4) {
        toggle_class(
          span,
          "ac-char-warn",
          /*charCount*/
          ctx2[2] > 2e3
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_else_block4(ctx) {
  let button;
  let svg;
  let line;
  let polygon;
  let button_disabled_value;
  let button_title_value;
  let button_aria_label_value;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      svg = svg_element("svg");
      line = svg_element("line");
      polygon = svg_element("polygon");
      attr(line, "x1", "22");
      attr(line, "y1", "2");
      attr(line, "x2", "11");
      attr(line, "y2", "13");
      attr(polygon, "points", "22 2 15 22 11 13 2 9 22 2");
      attr(svg, "width", "14");
      attr(svg, "height", "14");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2.5");
      attr(svg, "stroke-linecap", "round");
      attr(svg, "stroke-linejoin", "round");
      attr(svg, "aria-hidden", "true");
      attr(button, "class", "ac-btn ac-btn-send svelte-9ylsa4");
      button.disabled = button_disabled_value = !/*input*/
      ctx[1].trim();
      attr(button, "title", button_title_value = /*t*/
      ctx[17]("chat.send"));
      attr(button, "aria-label", button_aria_label_value = /*t*/
      ctx[17]("chat.send"));
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, svg);
      append(svg, line);
      append(svg, polygon);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*send*/
          ctx[12]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*input*/
      2 && button_disabled_value !== (button_disabled_value = !/*input*/
      ctx2[1].trim())) {
        button.disabled = button_disabled_value;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block5(ctx) {
  let button;
  let svg;
  let rect;
  let button_title_value;
  let button_aria_label_value;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      svg = svg_element("svg");
      rect = svg_element("rect");
      attr(rect, "x", "4");
      attr(rect, "y", "4");
      attr(rect, "width", "16");
      attr(rect, "height", "16");
      attr(rect, "rx", "2");
      attr(svg, "width", "12");
      attr(svg, "height", "12");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "currentColor");
      attr(svg, "aria-hidden", "true");
      attr(button, "class", "ac-btn ac-btn-stop svelte-9ylsa4");
      attr(button, "title", button_title_value = /*t*/
      ctx[17]("chat.cancel"));
      attr(button, "aria-label", button_aria_label_value = /*t*/
      ctx[17]("chat.cancel"));
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, svg);
      append(svg, rect);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*cancel*/
          ctx[13]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_fragment6(ctx) {
  let div6;
  let div1;
  let button0;
  let svg0;
  let circle;
  let polyline;
  let t0;
  let span1;
  let span0;
  let t1;
  let t2;
  let t3;
  let div0;
  let modetoggle;
  let t4;
  let button1;
  let svg1;
  let line0;
  let line1;
  let button1_title_value;
  let button1_aria_label_value;
  let t5;
  let t6;
  let messagelist;
  let t7;
  let div5;
  let div4;
  let textarea_1;
  let textarea_1_placeholder_value;
  let t8;
  let div3;
  let t9;
  let div2;
  let current;
  let mounted;
  let dispose;
  modetoggle = new ModeToggle_default({ props: { plugin: (
    /*plugin*/
    ctx[0]
  ) } });
  let if_block0 = (
    /*showHistory*/
    ctx[8] && create_if_block_23(ctx)
  );
  messagelist = new MessageList_default({
    props: {
      messages: (
        /*messages*/
        ctx[5]
      ),
      streamBuf: (
        /*streamBuf*/
        ctx[6]
      ),
      pending: (
        /*pending*/
        ctx[4]
      ),
      plugin: (
        /*plugin*/
        ctx[0]
      )
    }
  });
  function select_block_type(ctx2, dirty) {
    if (
      /*showCharCount*/
      ctx2[9]
    )
      return create_if_block_15;
    return create_else_block_1;
  }
  let current_block_type = select_block_type(ctx, -1);
  let if_block1 = current_block_type(ctx);
  function select_block_type_1(ctx2, dirty) {
    if (
      /*busy*/
      ctx2[3]
    )
      return create_if_block5;
    return create_else_block4;
  }
  let current_block_type_1 = select_block_type_1(ctx, -1);
  let if_block2 = current_block_type_1(ctx);
  return {
    c() {
      div6 = element("div");
      div1 = element("div");
      button0 = element("button");
      svg0 = svg_element("svg");
      circle = svg_element("circle");
      polyline = svg_element("polyline");
      t0 = space();
      span1 = element("span");
      span0 = element("span");
      t1 = space();
      t2 = text(
        /*providerLabel*/
        ctx[10]
      );
      t3 = space();
      div0 = element("div");
      create_component(modetoggle.$$.fragment);
      t4 = space();
      button1 = element("button");
      svg1 = svg_element("svg");
      line0 = svg_element("line");
      line1 = svg_element("line");
      t5 = space();
      if (if_block0)
        if_block0.c();
      t6 = space();
      create_component(messagelist.$$.fragment);
      t7 = space();
      div5 = element("div");
      div4 = element("div");
      textarea_1 = element("textarea");
      t8 = space();
      div3 = element("div");
      if_block1.c();
      t9 = space();
      div2 = element("div");
      if_block2.c();
      attr(circle, "cx", "12");
      attr(circle, "cy", "12");
      attr(circle, "r", "10");
      attr(polyline, "points", "12 6 12 12 16 14");
      attr(svg0, "width", "14");
      attr(svg0, "height", "14");
      attr(svg0, "viewBox", "0 0 24 24");
      attr(svg0, "fill", "none");
      attr(svg0, "stroke", "currentColor");
      attr(svg0, "stroke-width", "2");
      attr(svg0, "stroke-linecap", "round");
      attr(svg0, "stroke-linejoin", "round");
      attr(svg0, "aria-hidden", "true");
      attr(button0, "class", "ac-btn ac-btn-ghost ac-history-toggle svelte-9ylsa4");
      attr(button0, "title", "Conversation history");
      attr(
        button0,
        "aria-expanded",
        /*showHistory*/
        ctx[8]
      );
      toggle_class(
        button0,
        "ac-history-active",
        /*showHistory*/
        ctx[8]
      );
      attr(span0, "class", "ac-provider-dot svelte-9ylsa4");
      attr(span0, "aria-hidden", "true");
      attr(span1, "class", "ac-provider-chip svelte-9ylsa4");
      attr(span1, "title", "Active provider / model");
      attr(line0, "x1", "12");
      attr(line0, "y1", "5");
      attr(line0, "x2", "12");
      attr(line0, "y2", "19");
      attr(line1, "x1", "5");
      attr(line1, "y1", "12");
      attr(line1, "x2", "19");
      attr(line1, "y2", "12");
      attr(svg1, "width", "14");
      attr(svg1, "height", "14");
      attr(svg1, "viewBox", "0 0 24 24");
      attr(svg1, "fill", "none");
      attr(svg1, "stroke", "currentColor");
      attr(svg1, "stroke-width", "2");
      attr(svg1, "stroke-linecap", "round");
      attr(svg1, "stroke-linejoin", "round");
      attr(svg1, "aria-hidden", "true");
      attr(button1, "class", "ac-btn ac-btn-ghost svelte-9ylsa4");
      attr(button1, "title", button1_title_value = /*t*/
      ctx[17]("chat.new"));
      attr(button1, "aria-label", button1_aria_label_value = /*t*/
      ctx[17]("chat.new"));
      attr(div0, "class", "ac-header-right svelte-9ylsa4");
      attr(div1, "class", "ac-header svelte-9ylsa4");
      attr(textarea_1, "placeholder", textarea_1_placeholder_value = /*busy*/
      ctx[3] ? "" : (
        /*t*/
        ctx[17]("chat.placeholder") || "Ask anything\u2026 (Shift+Enter for newline)"
      ));
      textarea_1.disabled = /*busy*/
      ctx[3];
      attr(textarea_1, "rows", "1");
      attr(textarea_1, "aria-label", "Chat input");
      attr(textarea_1, "class", "svelte-9ylsa4");
      attr(div2, "class", "ac-input-actions svelte-9ylsa4");
      attr(div3, "class", "ac-input-footer svelte-9ylsa4");
      attr(div4, "class", "ac-input-box svelte-9ylsa4");
      toggle_class(
        div4,
        "busy",
        /*busy*/
        ctx[3]
      );
      attr(div5, "class", "ac-input-wrap svelte-9ylsa4");
      attr(div6, "class", "ac-shell svelte-9ylsa4");
    },
    m(target, anchor) {
      insert(target, div6, anchor);
      append(div6, div1);
      append(div1, button0);
      append(button0, svg0);
      append(svg0, circle);
      append(svg0, polyline);
      append(div1, t0);
      append(div1, span1);
      append(span1, span0);
      append(span1, t1);
      append(span1, t2);
      append(div1, t3);
      append(div1, div0);
      mount_component(modetoggle, div0, null);
      append(div0, t4);
      append(div0, button1);
      append(button1, svg1);
      append(svg1, line0);
      append(svg1, line1);
      append(div6, t5);
      if (if_block0)
        if_block0.m(div6, null);
      append(div6, t6);
      mount_component(messagelist, div6, null);
      append(div6, t7);
      append(div6, div5);
      append(div5, div4);
      append(div4, textarea_1);
      ctx[19](textarea_1);
      set_input_value(
        textarea_1,
        /*input*/
        ctx[1]
      );
      append(div4, t8);
      append(div4, div3);
      if_block1.m(div3, null);
      append(div3, t9);
      append(div3, div2);
      if_block2.m(div2, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[18]
          ),
          listen(
            button1,
            "click",
            /*newChat*/
            ctx[14]
          ),
          listen(
            textarea_1,
            "input",
            /*textarea_1_input_handler*/
            ctx[20]
          ),
          listen(
            textarea_1,
            "input",
            /*autoResize*/
            ctx[11]
          ),
          listen(
            textarea_1,
            "keydown",
            /*onKeydown*/
            ctx[16]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!current || dirty & /*showHistory*/
      256) {
        attr(
          button0,
          "aria-expanded",
          /*showHistory*/
          ctx2[8]
        );
      }
      if (!current || dirty & /*showHistory*/
      256) {
        toggle_class(
          button0,
          "ac-history-active",
          /*showHistory*/
          ctx2[8]
        );
      }
      if (!current || dirty & /*providerLabel*/
      1024)
        set_data(
          t2,
          /*providerLabel*/
          ctx2[10]
        );
      const modetoggle_changes = {};
      if (dirty & /*plugin*/
      1)
        modetoggle_changes.plugin = /*plugin*/
        ctx2[0];
      modetoggle.$set(modetoggle_changes);
      if (
        /*showHistory*/
        ctx2[8]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*showHistory*/
          256) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_23(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(div6, t6);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      const messagelist_changes = {};
      if (dirty & /*messages*/
      32)
        messagelist_changes.messages = /*messages*/
        ctx2[5];
      if (dirty & /*streamBuf*/
      64)
        messagelist_changes.streamBuf = /*streamBuf*/
        ctx2[6];
      if (dirty & /*pending*/
      16)
        messagelist_changes.pending = /*pending*/
        ctx2[4];
      if (dirty & /*plugin*/
      1)
        messagelist_changes.plugin = /*plugin*/
        ctx2[0];
      messagelist.$set(messagelist_changes);
      if (!current || dirty & /*busy*/
      8 && textarea_1_placeholder_value !== (textarea_1_placeholder_value = /*busy*/
      ctx2[3] ? "" : (
        /*t*/
        ctx2[17]("chat.placeholder") || "Ask anything\u2026 (Shift+Enter for newline)"
      ))) {
        attr(textarea_1, "placeholder", textarea_1_placeholder_value);
      }
      if (!current || dirty & /*busy*/
      8) {
        textarea_1.disabled = /*busy*/
        ctx2[3];
      }
      if (dirty & /*input*/
      2) {
        set_input_value(
          textarea_1,
          /*input*/
          ctx2[1]
        );
      }
      if (current_block_type === (current_block_type = select_block_type(ctx2, dirty)) && if_block1) {
        if_block1.p(ctx2, dirty);
      } else {
        if_block1.d(1);
        if_block1 = current_block_type(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(div3, t9);
        }
      }
      if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx2, dirty)) && if_block2) {
        if_block2.p(ctx2, dirty);
      } else {
        if_block2.d(1);
        if_block2 = current_block_type_1(ctx2);
        if (if_block2) {
          if_block2.c();
          if_block2.m(div2, null);
        }
      }
      if (!current || dirty & /*busy*/
      8) {
        toggle_class(
          div4,
          "busy",
          /*busy*/
          ctx2[3]
        );
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(modetoggle.$$.fragment, local);
      transition_in(if_block0);
      transition_in(messagelist.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(modetoggle.$$.fragment, local);
      transition_out(if_block0);
      transition_out(messagelist.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div6);
      }
      destroy_component(modetoggle);
      if (if_block0)
        if_block0.d();
      destroy_component(messagelist);
      ctx[19](null);
      if_block1.d();
      if_block2.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance6($$self, $$props, $$invalidate) {
  let providerLabel;
  let charCount;
  let showCharCount;
  let { plugin } = $$props;
  let input = "";
  let busy = false;
  let pending2 = plugin.approvalQueue.list();
  let messages = plugin.currentConversation.messages.slice();
  let streamBuf = "";
  let textarea;
  let showHistory = false;
  const unsub = plugin.approvalQueue.onChange((list) => $$invalidate(4, pending2 = list));
  onDestroy(unsub);
  function autoResize() {
    if (!textarea)
      return;
    $$invalidate(7, textarea.style.height = "auto", textarea);
    $$invalidate(7, textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px", textarea);
  }
  async function send() {
    if (!input.trim() || busy)
      return;
    $$invalidate(3, busy = true);
    const text2 = input;
    $$invalidate(1, input = "");
    $$invalidate(6, streamBuf = "");
    let errorMsg = null;
    await tick();
    autoResize();
    $$invalidate(5, messages = [...messages, { role: "user", content: text2 }]);
    await tick();
    try {
      for await (const evt of plugin.sendMessage(text2)) {
        if (evt.type === "text") {
          $$invalidate(6, streamBuf += evt.text);
        } else if (["applied", "rejected", "tool", "pending", "done", "stopped"].includes(
          evt.type
        )) {
          $$invalidate(5, messages = [...plugin.currentConversation.messages]);
          $$invalidate(6, streamBuf = "");
        } else if (evt.type === "error") {
          errorMsg = `\u26A0 ${evt.error?.message ?? "Unknown error"}`;
        }
        await tick();
      }
    } finally {
      $$invalidate(3, busy = false);
      $$invalidate(6, streamBuf = "");
      $$invalidate(5, messages = [...plugin.currentConversation.messages]);
      if (errorMsg)
        $$invalidate(5, messages = [...messages, { role: "assistant", content: errorMsg }]);
    }
  }
  function cancel() {
    plugin.cancelCurrentTurn();
  }
  async function newChat() {
    await plugin.startNewConversation();
    $$invalidate(5, messages = plugin.currentConversation.messages.slice());
    $$invalidate(8, showHistory = false);
  }
  async function onConversationSelect() {
    $$invalidate(5, messages = plugin.currentConversation.messages.slice());
    $$invalidate(8, showHistory = false);
  }
  function onKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
  const t = (k, v) => plugin.i18n.t(k, v);
  const click_handler = () => $$invalidate(8, showHistory = !showHistory);
  function textarea_1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      textarea = $$value;
      $$invalidate(7, textarea);
    });
  }
  function textarea_1_input_handler() {
    input = this.value;
    $$invalidate(1, input);
  }
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2)
      $$invalidate(0, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*plugin*/
    1) {
      $:
        $$invalidate(10, providerLabel = `${plugin.settings.providerId}/${plugin.settings.model || "\u2013"}`);
    }
    if ($$self.$$.dirty & /*input*/
    2) {
      $:
        $$invalidate(2, charCount = input.length);
    }
    if ($$self.$$.dirty & /*charCount*/
    4) {
      $:
        $$invalidate(9, showCharCount = charCount > 500);
    }
  };
  return [
    plugin,
    input,
    charCount,
    busy,
    pending2,
    messages,
    streamBuf,
    textarea,
    showHistory,
    showCharCount,
    providerLabel,
    autoResize,
    send,
    cancel,
    newChat,
    onConversationSelect,
    onKeydown,
    t,
    click_handler,
    textarea_1_binding,
    textarea_1_input_handler
  ];
}
var ChatView = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance6, create_fragment6, safe_not_equal, { plugin: 0 });
  }
};
var ChatView_default = ChatView;

// src/ui/chat-view.ts
var VIEW_TYPE_AGENT_CHAT = "obsidian-agent-chat";
var AgentChatView = class extends import_obsidian5.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.component = null;
  }
  getViewType() {
    return VIEW_TYPE_AGENT_CHAT;
  }
  getDisplayText() {
    return "Agent";
  }
  getIcon() {
    return "bot";
  }
  async onOpen() {
    this.contentEl.empty();
    this.component = new ChatView_default({ target: this.contentEl, props: { plugin: this.plugin } });
  }
  async onClose() {
    this.component?.$destroy();
    this.component = null;
  }
};

// src/ui/status-bar.ts
var StatusBar = class {
  constructor(plugin, el) {
    this.plugin = plugin;
    this.el = el;
    this.render("idle");
  }
  render(state) {
    const s = this.plugin.settings;
    const label2 = state === "idle" ? "\u25CF" : state === "thinking" ? "\u2026" : "?";
    this.el.setText(`${label2} ${s.providerId}:${s.model || "-"}`);
  }
};

// src/utils/patch.ts
function applyUnifiedPatch(original, patch) {
  if (!patch.trim())
    return original;
  const origLines = original.split("\n");
  const patchLines = patch.split("\n");
  const result = [];
  let origIdx = 0;
  let pi = 0;
  while (pi < patchLines.length && !patchLines[pi].startsWith("@@"))
    pi++;
  while (pi < patchLines.length) {
    const hunkMatch = patchLines[pi].match(/^@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/);
    if (!hunkMatch) {
      pi++;
      continue;
    }
    const oldStart = parseInt(hunkMatch[1]) - 1;
    pi++;
    while (origIdx < oldStart && origIdx < origLines.length)
      result.push(origLines[origIdx++]);
    while (pi < patchLines.length && !patchLines[pi].startsWith("@@")) {
      const l = patchLines[pi];
      if (l.startsWith("+"))
        result.push(l.slice(1));
      else if (l.startsWith("-"))
        origIdx++;
      else
        result.push(origLines[origIdx++]);
      pi++;
    }
  }
  while (origIdx < origLines.length)
    result.push(origLines[origIdx++]);
  return result.join("\n");
}

// src/main.ts
var ObsidianAgentPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.approvalQueue = new ApprovalQueue();
    this.lastTurnSummary = { created: [], edited: [], deleted: [] };
    this.summaryListeners = /* @__PURE__ */ new Set();
    this.currentLoop = null;
  }
  async onload() {
    this.settings = migrateSettings(await this.loadData());
    this.i18n = new I18n(detectLocale(this.settings.locale, import_obsidian6.moment.locale()));
    this.vault = new VaultService(this.app);
    this.conversations = new ConversationStore(this.vault, this.settings.chatsFolder);
    this.currentConversation = this.newConversation();
    this.addSettingTab(new AgentSettingsTab(this.app, this));
    this.registerView(VIEW_TYPE_AGENT_CHAT, (leaf) => new AgentChatView(leaf, this));
    this.addRibbonIcon("bot", "Open Agent", () => this.activateView());
    this.addCommand({ id: "open-agent", name: "Open Agent", callback: () => this.activateView() });
    this.addCommand({ id: "new-agent-chat", name: "New chat", callback: () => this.startNewConversation() });
    this.statusBar = new StatusBar(this, this.addStatusBarItem());
    this.scheduler = new SchedulerService(() => this.settings, (kind, cfg) => this.runScheduled(kind, cfg));
    this.scheduler.start();
  }
  onunload() {
    this.scheduler?.stop();
    this.currentLoop?.cancel();
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.i18n.setLocale(detectLocale(this.settings.locale, import_obsidian6.moment.locale()));
  }
  newConversation() {
    return new Conversation({
      id: `c_${Date.now()}`,
      mode: this.settings.mode,
      provider: this.settings.providerId,
      model: this.settings.model
    });
  }
  async startNewConversation() {
    this.currentConversation = this.newConversation();
  }
  async openConversation(path) {
    this.currentConversation = await this.conversations.load(path);
  }
  cancelCurrentTurn() {
    this.currentLoop?.cancel();
  }
  onSummaryChange(fn) {
    this.summaryListeners.add(fn);
  }
  emitSummary() {
    for (const l of this.summaryListeners)
      l(this.lastTurnSummary);
  }
  async *sendMessage(text2) {
    const provider = createProvider(this.settings.providerId, { apiKey: this.settings.apiKey, baseUrl: this.settings.baseUrl });
    this.currentConversation.model = this.settings.model;
    this.currentConversation.provider = this.settings.providerId;
    const ctx = {
      vault: this.vault,
      activeFile: () => {
        const f = this.app.workspace.getActiveFile();
        if (!f)
          return null;
        return { path: f.path, content: "" };
      },
      selection: () => {
        const ed = this.app.workspace.activeEditor?.editor;
        return ed?.getSelection?.() ?? "";
      }
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
      computeDiff: (p) => this.computeDiff(p)
    });
    this.statusBar.render("thinking");
    try {
      yield* this.currentLoop.send(text2);
    } finally {
      this.statusBar.render("idle");
      this.currentLoop = null;
      await this.conversations.save(this.currentConversation);
      this.emitSummary();
    }
  }
  async computeDiff(p) {
    try {
      if (p.tool === "edit_note") {
        const before = await this.vault.readNote(p.args.path);
        return simpleDiff(before, p.args.content);
      }
      if (p.tool === "create_note")
        return `+ ${p.args.path}
${p.args.content}`;
      if (p.tool === "delete_note")
        return `- ${p.args.path}`;
      if (p.tool === "move_note")
        return `${p.args.from} \u2192 ${p.args.to}`;
      if (p.tool === "apply_patch")
        return p.args.patch;
    } catch {
    }
    return "";
  }
  async commitWrite(p) {
    switch (p.tool) {
      case "create_note":
        await this.vault.createNote(p.args.path, p.args.content);
        this.lastTurnSummary.created.push(p.args.path);
        break;
      case "edit_note":
        await this.vault.editNote(p.args.path, p.args.content);
        this.lastTurnSummary.edited.push(p.args.path);
        break;
      case "apply_patch": {
        const before = await this.vault.readNote(p.args.path);
        await this.vault.editNote(p.args.path, applyUnifiedPatch(before, p.args.patch));
        this.lastTurnSummary.edited.push(p.args.path);
        break;
      }
      case "delete_note":
        await this.vault.deleteNote(p.args.path);
        this.lastTurnSummary.deleted.push(p.args.path);
        break;
      case "move_note":
        await this.vault.moveNote(p.args.from, p.args.to);
        this.lastTurnSummary.edited.push(p.args.to);
        break;
    }
    this.emitSummary();
  }
  async runScheduled(kind, cfg) {
    const provider = createProvider(this.settings.providerId, { apiKey: this.settings.apiKey, baseUrl: this.settings.baseUrl });
    const conv = new Conversation({ id: `sched_${kind}_${Date.now()}`, mode: "scheduled", provider: this.settings.providerId, model: this.settings.model });
    const ctx = { vault: this.vault, activeFile: () => null, selection: () => "" };
    const tools = buildToolRegistry(ctx, "scheduled");
    const promptKey = kind === "daily" ? "prompt.scheduled.daily" : "prompt.scheduled.weekly";
    conv.append({ role: "user", content: `Target folder: ${cfg.targetFolder}` });
    const loop2 = new AgentLoop({
      provider,
      conversation: conv,
      tools,
      approvalQueue: this.approvalQueue,
      systemPrompt: this.i18n.t(promptKey),
      maxIterations: this.settings.maxIterations,
      turnTimeoutMs: this.settings.turnTimeoutMs,
      historyBudget: this.settings.historyTokenBudget,
      commitWrite: (p) => this.commitWrite(p)
    });
    for await (const _ of loop2.run()) {
    }
    await this.logActivity(`[${(/* @__PURE__ */ new Date()).toISOString()}] scheduled/${kind} ok`);
  }
  async logActivity(line) {
    const path = `${this.settings.chatsFolder}/../activity.log.md`;
    try {
      const cur = await this.vault.readNote(path);
      await this.vault.editNote(path, cur + line + "\n");
    } catch {
      try {
        await this.vault.createNote(path, line + "\n");
      } catch {
        new import_obsidian6.Notice("Agent: failed to write activity log");
      }
    }
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT_CHAT)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_AGENT_CHAT, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }
};
function simpleDiff(a, b) {
  const al = a.split("\n"), bl = b.split("\n");
  const out = [];
  const n = Math.max(al.length, bl.length);
  for (let i = 0; i < n; i++) {
    if (al[i] === bl[i])
      out.push("  " + (al[i] ?? ""));
    else {
      if (al[i] !== void 0)
        out.push("- " + al[i]);
      if (bl[i] !== void 0)
        out.push("+ " + bl[i]);
    }
  }
  return out.join("\n");
}
