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
  /** Rolling LLM-generated summary of older turns. */
  summary?: string;
  /** Index (into messages[]) up to and including which messages are covered by summary. */
  summarizedThroughIndex?: number;

  constructor(meta: ConversationMeta, messages: Message[] = []) {
    this.id = meta.id; this.title = meta.title;
    this.createdAt = meta.createdAt ?? Date.now();
    this.mode = meta.mode; this.provider = meta.provider; this.model = meta.model;
    this.messages = messages;
  }

  append(m: Message) { this.messages.push(m); }
}

const SEP = "\n\n<!-- msg -->\n\n";
const SUMMARY_OPEN  = "<!-- summary -->";
const SUMMARY_CLOSE = "<!-- /summary -->";

export function serializeConversation(c: Conversation): string {
  const fmParts = [
    "---",
    `id: ${c.id}`,
    `title: ${JSON.stringify(c.title ?? "")}`,
    `createdAt: ${c.createdAt}`,
    `mode: ${c.mode}`,
    `provider: ${c.provider}`,
    `model: ${c.model}`,
  ];
  if (c.summarizedThroughIndex !== undefined) {
    fmParts.push(`summarizedThroughIndex: ${c.summarizedThroughIndex}`);
  }
  fmParts.push("---", "");
  const fm = fmParts.join("\n");

  let body = "";
  if (c.summary) {
    body += `${SUMMARY_OPEN}\n${c.summary}\n${SUMMARY_CLOSE}\n\n`;
  }
  body += c.messages.map(m => {
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

  let bodyText = m[2] ?? "";

  // Extract summary block if present (backward-compatible: old files without it are fine)
  let summary: string | undefined;
  const summaryRe = new RegExp(
    `^${SUMMARY_OPEN}\\n([\\s\\S]*?)\\n${SUMMARY_CLOSE}\\n\\n?`,
  );
  const summaryMatch = bodyText.match(summaryRe);
  if (summaryMatch) {
    summary = summaryMatch[1];
    bodyText = bodyText.slice(summaryMatch[0].length);
  }

  const messages: Message[] = [];
  for (const block of bodyText.split(SEP).filter(x => x.trim())) {
    const meta = block.match(/^<!-- meta: (.+?) -->\n([\s\S]*)$/);
    if (!meta) continue;
    const parsed = JSON.parse(meta[1]);
    messages.push({ role: parsed.role, content: meta[2], toolCalls: parsed.toolCalls, toolCallId: parsed.toolCallId });
  }

  const conv = new Conversation({
    id: fm.id, title: fm.title || undefined, createdAt: Number(fm.createdAt),
    mode: fm.mode as any, provider: fm.provider as any, model: fm.model,
  }, messages);

  if (summary !== undefined) conv.summary = summary;
  if (fm.summarizedThroughIndex !== undefined) {
    conv.summarizedThroughIndex = Number(fm.summarizedThroughIndex);
  }

  return conv;
}
