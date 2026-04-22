import type { Message } from "../types";
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
