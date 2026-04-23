import { describe, it, expect, vi } from "vitest";
import { ApprovalQueue } from "../../src/agent/approval-queue";

describe("ApprovalQueue", () => {
  it("enqueue is synchronous, stores entry, fires onChange", () => {
    const commit = vi.fn(async () => {});
    const q = new ApprovalQueue({ commit });
    const changes: number[] = [];
    q.onChange(list => changes.push(list.length));
    q.enqueue({ toolCallId: "1", tool: "edit_note", args: { path: "a.md" }, diff: "" });
    expect(q.list()).toHaveLength(1);
    expect(changes).toEqual([1]);
    expect(commit).not.toHaveBeenCalled();
  });

  it("approve calls commit, removes entry, fires onChange", async () => {
    const commit = vi.fn(async () => {});
    const q = new ApprovalQueue({ commit });
    q.enqueue({ toolCallId: "1", tool: "edit_note", args: { path: "a.md" }, diff: "" });
    await q.approve("1");
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({ toolCallId: "1" }));
    expect(q.list()).toHaveLength(0);
  });

  it("reject removes entry without calling commit", () => {
    const commit = vi.fn(async () => {});
    const q = new ApprovalQueue({ commit });
    q.enqueue({ toolCallId: "2", tool: "edit_note", args: {}, diff: "" });
    q.reject("2");
    expect(commit).not.toHaveBeenCalled();
    expect(q.list()).toHaveLength(0);
  });

  it("approveAll drains queue and calls commit for each entry", async () => {
    const commit = vi.fn(async () => {});
    const q = new ApprovalQueue({ commit });
    q.enqueue({ toolCallId: "a", tool: "edit_note", args: {}, diff: "" });
    q.enqueue({ toolCallId: "b", tool: "create_note", args: {}, diff: "" });
    await q.approveAll();
    expect(commit).toHaveBeenCalledTimes(2);
    expect(q.list()).toHaveLength(0);
  });

  it("rejectAll drains queue without calling commit", () => {
    const commit = vi.fn(async () => {});
    const q = new ApprovalQueue({ commit });
    q.enqueue({ toolCallId: "a", tool: "edit_note", args: {}, diff: "" });
    q.enqueue({ toolCallId: "b", tool: "create_note", args: {}, diff: "" });
    q.rejectAll();
    expect(commit).not.toHaveBeenCalled();
    expect(q.list()).toHaveLength(0);
  });

  it("clear drops all entries without calling commit", () => {
    const commit = vi.fn(async () => {});
    const q = new ApprovalQueue({ commit });
    q.enqueue({ toolCallId: "x", tool: "edit_note", args: {}, diff: "" });
    q.clear();
    expect(commit).not.toHaveBeenCalled();
    expect(q.list()).toHaveLength(0);
  });
});
