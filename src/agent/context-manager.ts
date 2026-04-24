import type { Message, ProviderId } from "../types";
import type { LLMProvider } from "../providers/types";
import type { I18n } from "../services/i18n";
import { Conversation } from "./conversation";
import { totalTokens, trimHistory } from "./history-trimmer";
import { lookupModelCaps } from "../providers/model-caps";

export interface ContextManagerOpts {
  conversation: Conversation;
  systemPrompt: string;
  provider: LLMProvider;
  model: string;
  providerId: ProviderId;
  settings: {
    historyTokenBudget: number;     // legacy cap in approx-tokens; 0 = auto
    responseReserveTokens: number;  // tokens to reserve for the response
    autoCompactThreshold: number;   // fraction of budget at which to trigger compaction
    keepLastTurns: number;          // turn-groups to keep verbatim
  };
  /** Called when compaction state changes. */
  onStatus?: (s: "compacting" | "idle") => void;
  /** Called after a successful compaction; use to persist the conversation. */
  onCompacted?: () => Promise<void>;
  i18n: I18n;
  signal?: AbortSignal;
}

export interface PrepareResult {
  messages: Message[];
  /** Index up to (and including) which messages in the result array are stable/cacheable. */
  cacheableBoundary: number;
  effectiveBudget: number;
}

export class ContextManager {
  private readonly caps;

  constructor(private opts: ContextManagerOpts) {
    this.caps = lookupModelCaps(opts.providerId, opts.model);
  }

  /** Effective history budget in approx-tokens (same unit as totalTokens()). */
  private effectiveBudget(): number {
    const modelBudget = this.caps.contextWindow - this.opts.settings.responseReserveTokens;
    const cap = this.opts.settings.historyTokenBudget;
    return cap > 0 ? Math.min(cap, modelBudget) : modelBudget;
  }

  /**
   * Called at the start of each AgentLoop iteration.
   * May run compaction (blocking ~2–5s) if usage is above threshold.
   */
  async prepare(): Promise<PrepareResult> {
    const budget = this.effectiveBudget();
    const { conversation, systemPrompt, settings } = this.opts;

    const candidate = this.buildCandidate(systemPrompt, conversation);
    const used = totalTokens(candidate);

    if (used <= settings.autoCompactThreshold * budget) {
      return {
        messages: candidate,
        cacheableBoundary: conversation.summary !== undefined ? 1 : 0,
        effectiveBudget: budget,
      };
    }

    // Needs compaction
    this.opts.onStatus?.("compacting");
    try {
      await this.compactNow();
      await this.opts.onCompacted?.();
    } finally {
      this.opts.onStatus?.("idle");
    }

    // Rebuild after compaction
    const newCandidate = this.buildCandidate(systemPrompt, conversation);
    const newUsed = totalTokens(newCandidate);

    // Safety-net: if still over budget, drop oldest groups
    if (newUsed > budget) {
      const trimmed = trimHistory(newCandidate, budget);
      return {
        messages: trimmed,
        cacheableBoundary: conversation.summary !== undefined ? 1 : 0,
        effectiveBudget: budget,
      };
    }

    return {
      messages: newCandidate,
      cacheableBoundary: conversation.summary !== undefined ? 1 : 0,
      effectiveBudget: budget,
    };
  }

  /**
   * Runs a summarization pass over older turns.
   * Mutates conversation.summary and conversation.summarizedThroughIndex.
   */
  async compactNow(): Promise<void> {
    const { conversation, provider, model, settings, i18n, signal } = this.opts;

    const tailStart = (conversation.summarizedThroughIndex ?? -1) + 1;
    const unsummarized = conversation.messages.slice(tailStart);

    // Group by turns: each turn starts with a user message
    const turnGroups = groupByTurns(unsummarized);
    const keepCount = Math.min(settings.keepLastTurns, turnGroups.length);
    const toSummarizeGroups = turnGroups.slice(0, turnGroups.length - keepCount);

    if (toSummarizeGroups.length === 0) return; // nothing to summarize beyond the kept tail

    const toSummarize = toSummarizeGroups.flatMap(g => g);
    const newSummarizedThroughIndex = tailStart + toSummarize.length - 1;

    const systemPromptText = i18n.t("prompt.compact");
    const userContent = serializeMessagesForSummary(toSummarize, conversation.summary);

    let summary = "";
    for await (const delta of provider.chat({
      model,
      messages: [
        { role: "system", content: systemPromptText },
        { role: "user",   content: userContent },
      ],
      tools: [],
      temperature: 0.2,
      signal,
    })) {
      if (delta.type === "text" && delta.text) summary += delta.text;
      if (delta.type === "done") break;
    }

    if (!summary.trim()) return; // provider returned nothing; skip mutation

    conversation.summary = summary;
    conversation.summarizedThroughIndex = newSummarizedThroughIndex;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildCandidate(systemPrompt: string, conversation: Conversation): Message[] {
    const sysMsg: Message = { role: "system", content: systemPrompt };
    const summaryMsg: Message | null = conversation.summary
      ? { role: "system", content: conversation.summary }
      : null;
    const tailStart = (conversation.summarizedThroughIndex ?? -1) + 1;
    const tailMsgs = conversation.messages.slice(tailStart);
    return [sysMsg, ...(summaryMsg ? [summaryMsg] : []), ...tailMsgs];
  }
}

/** Split messages into turn-level groups. Each group starts with a user message. */
function groupByTurns(messages: Message[]): Message[][] {
  const groups: Message[][] = [];
  let current: Message[] = [];
  for (const m of messages) {
    if (m.role === "user" && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(m);
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

/** Serialize messages into a single string for the summarization request. */
function serializeMessagesForSummary(msgs: Message[], priorSummary?: string): string {
  const parts: string[] = [];
  if (priorSummary) {
    parts.push(`Prior summary:\n${priorSummary}\n\n---\nNew conversation to integrate:`);
  }
  for (const m of msgs) {
    if (m.role === "assistant" && m.toolCalls?.length) {
      const tcStr = m.toolCalls
        .map(tc => `[tool ${tc.name}(${JSON.stringify(tc.args).slice(0, 100)})]`)
        .join(" ");
      parts.push(`Assistant: ${m.content ? m.content + " " : ""}${tcStr}`);
    } else if (m.role === "tool") {
      const preview = (m.content ?? "").length > 500
        ? m.content.slice(0, 500) + "…"
        : m.content;
      parts.push(`Tool result (${m.toolCallId ?? "?"}): ${preview}`);
    } else {
      const roleLabel = m.role === "user" ? "User"
        : m.role === "assistant" ? "Assistant"
        : m.role === "system" ? "System"
        : m.role;
      parts.push(`${roleLabel}: ${m.content}`);
    }
  }
  return parts.join("\n\n");
}

// Re-export for tests
export { groupByTurns, serializeMessagesForSummary };
