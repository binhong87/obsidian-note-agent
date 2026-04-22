import { describe, it, expect } from "vitest";
import { systemPromptKey } from "../../src/agent/mode-gate";

describe("mode gate", () => {
  it("maps mode to prompt key", () => {
    expect(systemPromptKey("ask")).toBe("prompt.system.ask");
    expect(systemPromptKey("edit")).toBe("prompt.system.edit");
    expect(systemPromptKey("scheduled")).toBe("prompt.scheduled.daily");
  });
});
