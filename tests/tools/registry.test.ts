import { describe, it, expect } from "vitest";
import { buildToolRegistry } from "../../src/tools/registry";

const ctx: any = { vault: {}, activeFile: () => null, selection: () => "" };

describe("tool registry", () => {
  it("ask mode = read only", () => {
    const r = buildToolRegistry(ctx, "ask");
    expect(r.every(t => t.kind === "read")).toBe(true);
  });
  it("edit mode = read + write", () => {
    const r = buildToolRegistry(ctx, "edit");
    expect(r.some(t => t.kind === "write" && t.name === "edit_note")).toBe(true);
    expect(r.some(t => t.kind === "read" && t.name === "search_vault")).toBe(true);
  });
  it("scheduled mode = read + create_note only", () => {
    const r = buildToolRegistry(ctx, "scheduled");
    const writes = r.filter(t => t.kind === "write").map(t => t.name);
    expect(writes).toEqual(["create_note"]);
  });
});
