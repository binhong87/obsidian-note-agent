import type { Message } from "../types";

export function approxTokens(s: string): number { return Math.ceil(s.length / 4); }

export function msgTokens(m: Message): number {
  let n = approxTokens(m.content ?? "") + 4;
  if (m.toolCalls?.length) {
    for (const tc of m.toolCalls) n += approxTokens(tc.name) + approxTokens(JSON.stringify(tc.args)) + 8;
  }
  return n;
}

export function totalTokens(msgs: Message[]): number {
  let n = 0; for (const m of msgs) n += msgTokens(m);
  return n;
}

// Group messages into atomic units so tool messages are never orphaned from
// the preceding assistant message whose tool_calls they answer.
interface Group { msgs: Message[]; tokens: number; }

function groupRest(rest: Message[]): Group[] {
  const groups: Group[] = [];
  let i = 0;
  while (i < rest.length) {
    const m = rest[i];
    if (m.role === "assistant" && m.toolCalls?.length) {
      const msgs: Message[] = [m];
      let j = i + 1;
      while (j < rest.length && rest[j].role === "tool") { msgs.push(rest[j]); j++; }
      groups.push({ msgs, tokens: msgs.reduce((a, x) => a + msgTokens(x), 0) });
      i = j;
    } else {
      groups.push({ msgs: [m], tokens: msgTokens(m) });
      i++;
    }
  }
  return groups;
}

export function trimHistory(messages: Message[], budget: number): Message[] {
  if (totalTokens(messages) <= budget) return messages;
  const system = messages.filter(m => m.role === "system");
  const rest = messages.filter(m => m.role !== "system");
  const groups = groupRest(rest);
  const keep: Group[] = [];
  let used = totalTokens(system);
  for (let i = groups.length - 1; i >= 0; i--) {
    if (used + groups[i].tokens > budget) break;
    keep.unshift(groups[i]); used += groups[i].tokens;
  }
  const keptMsgs = keep.flatMap(g => g.msgs);
  const droppedGroups = groups.length - keep.length;
  const out: Message[] = [...system];
  if (droppedGroups > 0) {
    out.push({ role: "system", content: `[Earlier ${droppedGroups} message group(s) summarized for brevity.]` });
  }
  out.push(...keptMsgs);
  return out;
}
