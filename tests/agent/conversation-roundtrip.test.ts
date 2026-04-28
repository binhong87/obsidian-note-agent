import { describe, it, expect } from "vitest";
import { Conversation, serializeConversation, parseConversation } from "../../src/agent/conversation";

describe("Conversation summary roundtrip", () => {
  it("serializes and parses summary + summarizedThroughIndex", () => {
    const c = new Conversation({ id: "c1", mode: "ask", provider: "anthropic", model: "claude-opus-4" });
    c.append({ role: "user", content: "Hello" });
    c.append({ role: "assistant", content: "Hi" });
    c.summary = "The user greeted the assistant.";
    c.summarizedThroughIndex = 0;

    const md = serializeConversation(c);
    expect(md).toContain("<!-- summary -->");
    expect(md).toContain("The user greeted the assistant.");
    expect(md).toContain("<!-- /summary -->");
    expect(md).toContain("summarizedThroughIndex: 0");

    const back = parseConversation(md);
    expect(back.summary).toBe("The user greeted the assistant.");
    expect(back.summarizedThroughIndex).toBe(0);
    expect(back.messages).toHaveLength(2);
    expect(back.messages[0].content).toBe("Hello");
    expect(back.messages[1].content).toBe("Hi");
  });

  it("handles old-format files without summary block (backward compat)", () => {
    const c = new Conversation({ id: "c2", mode: "edit", provider: "openai", model: "gpt-4o", title: "old" });
    c.append({ role: "user", content: "world" });
    // Serialize without setting summary (old format)
    const md = serializeConversation(c);
    expect(md).not.toContain("<!-- summary -->");

    const back = parseConversation(md);
    expect(back.summary).toBeUndefined();
    expect(back.summarizedThroughIndex).toBeUndefined();
    expect(back.messages[0].content).toBe("world");
  });

  it("handles multi-line summary content", () => {
    const c = new Conversation({ id: "c3", mode: "ask", provider: "openai", model: "gpt-4o" });
    c.summary = "Line one.\nLine two.\nLine three.";
    c.summarizedThroughIndex = 5;

    const md = serializeConversation(c);
    const back = parseConversation(md);
    expect(back.summary).toBe("Line one.\nLine two.\nLine three.");
    expect(back.summarizedThroughIndex).toBe(5);
  });

  it("preserves messages after summary block", () => {
    const c = new Conversation({ id: "c4", mode: "ask", provider: "openai", model: "gpt-4o" });
    c.append({ role: "user", content: "first" });
    c.append({ role: "assistant", content: "second" });
    c.append({ role: "user", content: "third" });
    c.summary = "A brief summary.";
    c.summarizedThroughIndex = 1;

    const md = serializeConversation(c);
    const back = parseConversation(md);
    expect(back.messages).toHaveLength(3);
    expect(back.messages[2].content).toBe("third");
  });

  it("preserves reasoningContent through serialize/parse roundtrip", () => {
    const c = new Conversation({ id: "rc1", mode: "ask", provider: "deepseek", model: "deepseek-reasoner" });
    c.append({ role: "assistant", content: "Final answer.", reasoningContent: "Let me think step by step..." });
    c.append({ role: "user", content: "Thanks" });

    const md = serializeConversation(c);
    const back = parseConversation(md);

    expect(back.messages[0].reasoningContent).toBe("Let me think step by step...");
    expect(back.messages[1].reasoningContent).toBeUndefined();
  });

  it("handles old-format messages without reasoningContent (backward compat)", () => {
    const c = new Conversation({ id: "rc2", mode: "ask", provider: "openai", model: "gpt-4o" });
    c.append({ role: "assistant", content: "No reasoning here." });

    const md = serializeConversation(c);
    const back = parseConversation(md);

    expect(back.messages[0].reasoningContent).toBeUndefined();
  });
});
