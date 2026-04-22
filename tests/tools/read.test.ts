import { describe, it, expect, vi } from "vitest";
import { buildReadTools } from "../../src/tools/read";

const fakeVault = {
  readNote: vi.fn(async (p: string) => p === "a.md" ? "hello" : (() => { throw new Error("nf"); })()),
  searchVault: vi.fn(async (q: string) => [{ path: "a.md", snippet: q }]),
  listFolder: vi.fn(async () => ["a.md", "b.md"]),
  getBacklinks: vi.fn(() => ["x.md"]),
  getOutgoingLinks: vi.fn(() => ["y.md"]),
};

describe("read tools", () => {
  const ctx = { vault: fakeVault as any, activeFile: () => ({ path: "cur.md", content: "active" }), selection: () => "sel" };
  const tools = buildReadTools(ctx);
  it("search_vault", async () => {
    const t = tools.find(x => x.name === "search_vault")!;
    expect(await t.handler({ query: "foo" })).toContain("a.md");
  });
  it("read_note ok", async () => {
    const t = tools.find(x => x.name === "read_note")!;
    expect(await t.handler({ path: "a.md" })).toBe("hello");
  });
  it("read_note missing returns error", async () => {
    const t = tools.find(x => x.name === "read_note")!;
    await expect(t.handler({ path: "m.md" })).resolves.toMatch(/error/i);
  });
});
