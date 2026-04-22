import { describe, it, expect } from "vitest";
import { applyUnifiedPatch } from "../../src/utils/patch";

const original = ["line1", "line2", "line3", "line4", "line5"].join("\n");

describe("applyUnifiedPatch", () => {
  it("returns original unchanged when patch is empty", () => {
    expect(applyUnifiedPatch(original, "")).toBe(original);
    expect(applyUnifiedPatch(original, "   \n  ")).toBe(original);
  });

  it("applies a simple hunk that replaces one line", () => {
    const patch = [
      "@@ -1,3 +1,3 @@",
      " line1",
      "-line2",
      "+LINE2",
      " line3",
    ].join("\n");
    expect(applyUnifiedPatch(original, patch)).toBe(
      ["line1", "LINE2", "line3", "line4", "line5"].join("\n")
    );
  });

  it("applies a hunk that inserts a line", () => {
    const patch = ["@@ -1,2 +1,3 @@", " line1", "+inserted", " line2"].join("\n");
    expect(applyUnifiedPatch(original, patch)).toBe(
      ["line1", "inserted", "line2", "line3", "line4", "line5"].join("\n")
    );
  });

  it("applies a hunk that deletes a line", () => {
    const patch = ["@@ -2,2 +2,1 @@", "-line2", " line3"].join("\n");
    expect(applyUnifiedPatch(original, patch)).toBe(
      ["line1", "line3", "line4", "line5"].join("\n")
    );
  });

  it("skips file header lines (--- +++)", () => {
    const patch = [
      "--- a/file.md",
      "+++ b/file.md",
      "@@ -3,1 +3,1 @@",
      "-line3",
      "+LINE3",
    ].join("\n");
    expect(applyUnifiedPatch(original, patch)).toBe(
      ["line1", "line2", "LINE3", "line4", "line5"].join("\n")
    );
  });

  it("applies two hunks in sequence", () => {
    const patch = [
      "@@ -1,1 +1,1 @@",
      "-line1",
      "+LINE1",
      "@@ -5,1 +5,1 @@",
      "-line5",
      "+LINE5",
    ].join("\n");
    expect(applyUnifiedPatch(original, patch)).toBe(
      ["LINE1", "line2", "line3", "line4", "LINE5"].join("\n")
    );
  });
});
