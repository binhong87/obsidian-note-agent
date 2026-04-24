import { describe, it, expect, vi } from "vitest";
import { AgentLoop } from "../../src/agent/agent-loop";
import { ApprovalQueue } from "../../src/agent/approval-queue";
import { Conversation } from "../../src/agent/conversation";
import { PENDING_PREFIX } from "../../src/tools/write";

function mockProvider(scripts: any[][]) {
  let turn = -1;
  return { id: "mock", async *chat() { turn++; for (const d of scripts[turn]) yield d; } };
}

/** A minimal prepareContext that just passes conversation messages through with a system msg. */
function makePrepareContext(conv: Conversation, systemPrompt = "S") {
  return async () => ({
    messages: [{ role: "system" as const, content: systemPrompt }, ...conv.messages],
    cacheableBoundary: 0,
  });
}

describe("AgentLoop", () => {
  it("terminates on assistant text with no tool calls", async () => {
    const provider: any = mockProvider([[{ type: "text", text: "hello" }, { type: "done" }]]);
    const conv = new Conversation({ id: "c", mode: "ask", provider: "openai", model: "m" });
    const loop = new AgentLoop({
      provider, conversation: conv, tools: [], approvalQueue: new ApprovalQueue({ commit: async () => {} }),
      prepareContext: makePrepareContext(conv), maxIterations: 5, turnTimeoutMs: 1000,
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
      provider, conversation: conv, tools, approvalQueue: new ApprovalQueue({ commit: async () => {} }),
      prepareContext: makePrepareContext(conv), maxIterations: 5, turnTimeoutMs: 1000,
    });
    for await (const _ of loop.send("go")) { /* drain */ }
    expect(tools[0].handler).toHaveBeenCalled();
    expect(conv.messages.some(m => m.role === "tool" && m.content.includes("echoed"))).toBe(true);
  });

  it("routes write tool through ApprovalQueue non-blocking", async () => {
    const scripts = [
      [{ type: "tool_call", toolCall: { id: "t1", name: "create_note", args: { path: "x.md", content: "y" } } }, { type: "done" }],
      [{ type: "text", text: "ok" }, { type: "done" }],
    ];
    const provider: any = mockProvider(scripts);
    const conv = new Conversation({ id: "c", mode: "edit", provider: "openai", model: "m" });
    const aq = new ApprovalQueue({ commit: async () => {} });
    const writeHandler = vi.fn(async (a: any) => PENDING_PREFIX + JSON.stringify({ tool: "create_note", args: a }));
    const tools = [{ name: "create_note", kind: "write" as const,
      schema: { name: "create_note", description: "", parameters: { type: "object" as const, properties: {} } },
      handler: writeHandler }];
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: aq,
      prepareContext: makePrepareContext(conv), maxIterations: 5, turnTimeoutMs: 1000,
    });
    const events: any[] = [];
    for await (const e of loop.send("go")) events.push(e);
    expect(events.some(e => e.type === "pending")).toBe(true);
    const toolMsg = conv.messages.find(m => m.role === "tool");
    expect(JSON.parse(toolMsg!.content)).toEqual({ status: "queued" });
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
      provider, conversation: conv, tools, approvalQueue: new ApprovalQueue({ commit: async () => {} }),
      prepareContext: makePrepareContext(conv), maxIterations: 3, turnTimeoutMs: 1000,
    });
    for await (const _ of loop.send("go")) { /* drain */ }
    const toolMsgs = conv.messages.filter(m => m.role === "tool").length;
    expect(toolMsgs).toBeLessThanOrEqual(3);
  });

  it("calls prepareContext before every iteration", async () => {
    const scripts = [
      [{ type: "tool_call", toolCall: { id: "t1", name: "echo", args: {} } }, { type: "done" }],
      [{ type: "text", text: "done" }, { type: "done" }],
    ];
    const provider: any = mockProvider(scripts);
    const conv = new Conversation({ id: "c", mode: "ask", provider: "openai", model: "m" });
    const tools = [{ name: "echo", kind: "read" as const,
      schema: { name: "echo", description: "", parameters: { type: "object" as const, properties: {} } },
      handler: async () => "r" }];
    const prepareContext = vi.fn(makePrepareContext(conv));
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: new ApprovalQueue({ commit: async () => {} }),
      prepareContext, maxIterations: 5, turnTimeoutMs: 1000,
    });
    for await (const _ of loop.send("go")) { /* drain */ }
    // prepareContext should be called once per iteration (2 iterations here)
    expect(prepareContext).toHaveBeenCalledTimes(2);
  });
});
