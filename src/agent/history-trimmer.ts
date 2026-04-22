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
