import { describe, it, expect } from "vitest";
import { ApprovalQueue } from "../../src/agent/approval-queue";

describe("ApprovalQueue", () => {
  it("resolves on approve", async () => {
    const q = new ApprovalQueue();
    const p = q.enqueue({ toolCallId: "1", tool: "edit_note", args: { path: "a.md" }, diff: "" });
    q.approve("1"); const r = await p;
    expect(r.status).toBe("applied");
  });
  it("resolves on reject", async () => {
    const q = new ApprovalQueue();
    const p = q.enqueue({ toolCallId: "2", tool: "edit_note", args: {}, diff: "" });
    q.reject("2"); const r = await p;
    expect(r.status).toBe("rejected_by_user");
  });
  it("approveAll resolves all pending", async () => {
    const q = new ApprovalQueue();
    const p1 = q.enqueue({ toolCallId: "a", tool: "edit_note", args: {}, diff: "" });
    const p2 = q.enqueue({ toolCallId: "b", tool: "create_note", args: {}, diff: "" });
    q.approveAll();
    expect((await p1).status).toBe("applied");
    expect((await p2).status).toBe("applied");
  });
});
