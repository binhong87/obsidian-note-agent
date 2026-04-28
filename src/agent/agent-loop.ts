import type { Message } from "../types";
import type { LLMProvider } from "../providers/types";
import type { Tool } from "../tools/types";
import { PENDING_PREFIX } from "../tools/write";
import type { ApprovalQueue } from "./approval-queue";
import { Conversation } from "./conversation";

export interface PrepareContextResult {
  messages: Message[];
  cacheableBoundary: number;
}

export interface AgentLoopOpts {
  provider: LLMProvider;
  conversation: Conversation;
  tools: Tool[];
  approvalQueue: ApprovalQueue;
  maxIterations: number;
  turnTimeoutMs: number;
  /** Called before each iteration to produce the message list sent to the provider.
   *  Replaces the old historyBudget + trimHistory path; may trigger compaction. */
  prepareContext: () => Promise<PrepareContextResult>;
  computeDiff?: (pending: { tool: string; args: Record<string, unknown> }) => Promise<string>;
  /** When set, called instead of queuing for user approval. Auto-approve mode. */
  autoApprove?: (payload: { tool: string; args: Record<string, unknown> }) => Promise<void>;
}

export interface LoopEvent {
  type: "text" | "tool" | "pending" | "done" | "error" | "stopped";
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
    const { provider, conversation, tools, approvalQueue, maxIterations, turnTimeoutMs } = this.opts;
    for (let i = 0; i < maxIterations; i++) {
      if (this.abort.signal.aborted) { yield { type: "stopped", reason: "cancelled" }; return; }

      // Prepare context (may block for compaction)
      const { messages: preparedMsgs, cacheableBoundary } = await this.opts.prepareContext();
      console.debug(`[agent] iteration ${i}, history: ${preparedMsgs.length} msgs, cacheableBoundary: ${cacheableBoundary}`);

      const assistantMsg: Message = { role: "assistant", content: "", toolCalls: [] };
      let stoppedEarly = false;

      // Per-iteration abort that fires on either outer cancel or turn timeout.
      const iterAbort = new AbortController();
      const propagate = () => iterAbort.abort();
      this.abort.signal.addEventListener("abort", propagate, { once: true });
      const timer = setTimeout(() => { console.warn("[agent] turn timeout"); iterAbort.abort(); }, turnTimeoutMs);
      try {
        for await (const d of provider.chat({
          model: conversation.model, messages: preparedMsgs,
          tools: tools.map(t => t.schema),
          cacheableBoundary,
          signal: iterAbort.signal,
        })) {
          if (d.type === "text" && d.text) { assistantMsg.content += d.text; yield { type: "text", text: d.text }; }
          else if (d.type === "reasoning" && d.text) { assistantMsg.reasoningContent = (assistantMsg.reasoningContent ?? "") + d.text; }
          else if (d.type === "tool_call" && d.toolCall) { assistantMsg.toolCalls!.push(d.toolCall); }
          else if (d.type === "error") { console.error("[agent] provider error:", d.error); yield { type: "error", error: d.error }; stoppedEarly = true; break; }
          else if (d.type === "done") break;
        }
      } catch (e: any) {
        if (this.abort.signal.aborted) {
          yield { type: "stopped", reason: "cancelled" };
          return;
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          yield { type: "error", error: { kind: "timeout", message: `Request timed out after ${Math.round(turnTimeoutMs / 1000)}s — the provider is too slow. Try again or increase the timeout in plugin settings.` } };
          return;
        }
        console.error("[agent] chat exception:", e);
        yield { type: "error", error: { kind: e.kind ?? "unknown", message: String(e.message ?? e) } };
        return;
      } finally {
        clearTimeout(timer);
        this.abort.signal.removeEventListener("abort", propagate);
      }
      if (stoppedEarly) return;
      if (this.abort.signal.aborted) { yield { type: "stopped", reason: "cancelled" }; return; }
      if (!assistantMsg.reasoningContent) delete assistantMsg.reasoningContent;
      conversation.append(assistantMsg);
      const calls = assistantMsg.toolCalls ?? [];
      if (calls.length === 0) { yield { type: "done" }; return; }
      console.debug(`[agent] tool calls: ${calls.map(c => c.name).join(", ")}`);

      for (const tc of calls) {
        const tool = tools.find(t => t.name === tc.name);
        if (!tool) {
          conversation.append({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ error: `unknown tool: ${tc.name}` }) });
          continue;
        }
        console.debug(`[agent] running tool: ${tc.name}`, tc.args);
        const result = await tool.handler(tc.args);
        console.debug(`[agent] tool result (${tc.name}):`, result.slice(0, 300));
        if (result.startsWith(PENDING_PREFIX)) {
          const payload = JSON.parse(result.slice(PENDING_PREFIX.length));
          if (this.opts.autoApprove) {
            await this.opts.autoApprove(payload);
            const applied = JSON.stringify({ status: "applied" });
            conversation.append({ role: "tool", toolCallId: tc.id, content: applied });
            yield { type: "tool", toolCallId: tc.id, result: applied };
          } else {
            const diff = this.opts.computeDiff ? await this.opts.computeDiff(payload) : "";
            approvalQueue.enqueue({ toolCallId: tc.id, tool: payload.tool, args: payload.args, diff });
            conversation.append({ role: "tool", toolCallId: tc.id, content: JSON.stringify({ status: "queued" }) });
            yield { type: "pending", toolCallId: tc.id, pending: payload, diff };
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
