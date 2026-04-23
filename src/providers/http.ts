import { requestUrl } from "obsidian";
import { ProviderError } from "./types";

export interface HttpOptions {
  url: string;
  method?: "POST" | "GET";
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

const MAX_RETRIES = 4;

function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const secs = parseInt(retryAfterHeader, 10);
    if (!isNaN(secs)) return Math.min(secs * 1000, 60_000);
  }
  return Math.min(5_000 * Math.pow(2, attempt - 1), 60_000); // 5s → 10s → 20s → 40s → cap 60s
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

function parseRateMsg(raw: string): string {
  try { return JSON.parse(raw)?.error?.message ?? raw; } catch { return raw; }
}

export async function httpJson<T = any>(o: HttpOptions): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await requestUrl({ url: o.url, method: o.method ?? "POST", headers: o.headers, body: o.body, throw: false } as any);
      if (r.status === 429) {
        if (attempt < MAX_RETRIES) {
          const delay = retryDelayMs(attempt + 1, null);
          console.warn(`[agent] rate limited (httpJson), retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay, o.signal);
          continue;
        }
        throw new ProviderError("rate", `Rate limited: ${parseRateMsg(r.text)}`);
      }
      if (r.status === 401 || r.status === 403) throw new ProviderError("auth", `${r.status}: ${r.text}`);
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
  throw new ProviderError("rate", "Rate limited: max retries exceeded");
}

export async function* httpSSE(o: HttpOptions): AsyncIterable<{ data: string }> {
  for (let attempt = 0; ; attempt++) {
    const resp = await fetch(o.url, {
      method: o.method ?? "POST",
      headers: o.headers,
      body: o.body,
      signal: o.signal,
    });

    if (resp.status === 429 && attempt < MAX_RETRIES) {
      const delay = retryDelayMs(attempt + 1, resp.headers.get("Retry-After"));
      console.warn(`[agent] rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay, o.signal);
      continue;
    }

    if (resp.status === 401 || resp.status === 403) throw new ProviderError("auth", `${resp.status}`);
    if (resp.status === 429) throw new ProviderError("rate", `Rate limited (gave up after ${MAX_RETRIES} retries): ${parseRateMsg(await resp.text())}`);
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
      buf += done ? dec.decode() : dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const evt = buf.slice(0, idx); buf = buf.slice(idx + 2);
        for (const ev of parseSSE(evt + "\n\n")) yield ev;
      }
      if (done) {
        if (buf.trim()) for (const ev of parseSSE(buf)) yield ev;
        break;
      }
    }
    return;
  }
}

export function* parseSSE(text: string): Iterable<{ data: string }> {
  for (const block of text.split("\n\n")) {
    if (!block.trim()) continue;
    const dataLines = block.split("\n").filter(l => l.startsWith("data:")).map(l => l.slice(5).trim());
    if (dataLines.length) yield { data: dataLines.join("\n") };
  }
}
