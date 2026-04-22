import { describe, it, expect } from "vitest";
import { buildWriteTools, PENDING_PREFIX } from "../../src/tools/write";

describe("write tools", () => {
  const tools = buildWriteTools();
  it("create_note returns pending marker", async () => {
    const t = tools.find(x => x.name === "create_note")!;
    const out = await t.handler({ path: "n.md", content: "hi" });
    expect(out.startsWith(PENDING_PREFIX)).toBe(true);
    const payload = JSON.parse(out.slice(PENDING_PREFIX.length));
    expect(payload.tool).toBe("create_note");
    expect(payload.args.path).toBe("n.md");
  });
  it("has all expected tools", () => {
    expect(tools.map(t => t.name).sort()).toEqual(["apply_patch","create_note","delete_note","edit_note","move_note"]);
  });
});
