import { describe, it, expect } from "vitest";
import { approxTokens, trimHistory } from "../../src/agent/history-trimmer";

describe("history trimmer", () => {
  it("approxTokens uses ~4 chars/token heuristic", () => {
    expect(approxTokens("a".repeat(400))).toBe(100);
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
});
