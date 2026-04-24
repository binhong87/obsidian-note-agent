import { describe, it, expect } from "vitest";
import { approxTokens, msgTokens, totalTokens, trimHistory } from "../../src/agent/history-trimmer";

describe("history trimmer", () => {
  it("approxTokens uses ~4 chars/token heuristic", () => {
    expect(approxTokens("a".repeat(400))).toBe(100);
  });
  it("msgTokens is exported and counts content + overhead", () => {
    const m = { role: "user" as const, content: "a".repeat(400) };
    // approxTokens("a".repeat(400)) = 100 + 4 overhead = 104
    expect(msgTokens(m)).toBe(104);
  });
  it("totalTokens sums all messages", () => {
    const msgs = [
      { role: "user" as const, content: "a".repeat(400) },
      { role: "assistant" as const, content: "b".repeat(400) },
    ];
    expect(totalTokens(msgs)).toBe(104 + 104);
  });
  it("passes through when under budget", () => {
    const msgs = [{ role: "user" as const, content: "hi" }];
    expect(trimHistory(msgs, 1000)).toEqual(msgs);
  });
  it("drops oldest non-system when over budget", () => {
    const big = "x".repeat(4000);
    const msgs = [
      { role: "system" as const, content: "S" },
      { role: "user" as const, content: big },
      { role: "assistant" as const, content: big },
      { role: "user" as const, content: "latest" },
    ];
    const out = trimHistory(msgs, 500);
    expect(out[0].role).toBe("system");
    expect(out[out.length - 1].content).toBe("latest");
    expect(out.length).toBeLessThan(msgs.length);
  });
  it("keeps assistant-with-tool_calls and all its tool responses as one atomic group", () => {
    const big = "x".repeat(4000);
    const msgs = [
      { role: "user" as const, content: "go" },
      { role: "assistant" as const, content: "", toolCalls: [
        { id: "a", name: "read", args: {} },
        { id: "b", name: "read", args: {} },
      ] },
      { role: "tool" as const, toolCallId: "a", content: big },
      { role: "tool" as const, toolCallId: "b", content: big },
      { role: "user" as const, content: "next" },
    ];
    const out = trimHistory(msgs, 300);
    // The assistant-tool group must be entirely present or entirely absent;
    // no orphan tool messages and no assistant missing its responses.
    const toolIds = out.filter(m => m.role === "tool").map(m => (m as any).toolCallId);
    const asst = out.find(m => m.role === "assistant" && m.toolCalls?.length);
    if (toolIds.length > 0) {
      expect(asst).toBeTruthy();
      const callIds = (asst as any).toolCalls.map((tc: any) => tc.id);
      for (const id of callIds) expect(toolIds).toContain(id);
    } else {
      expect(asst).toBeUndefined();
    }
  });
});
