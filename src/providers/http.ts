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
