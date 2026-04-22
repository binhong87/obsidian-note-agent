import { describe, it, expect } from "vitest";
import { parseSSE } from "../../src/providers/http";

describe("parseSSE", () => {
  it("splits events on double newline", () => {
    const chunks = [...parseSSE("data: {\"a\":1}\n\ndata: [DONE]\n\n")];
    expect(chunks).toEqual([{ data: "{\"a\":1}" }, { data: "[DONE]" }]);
  });
  it("handles single event", () => {
    const out = [...parseSSE("data: hi\n\n")];
    expect(out[0].data).toBe("hi");
  });
});
