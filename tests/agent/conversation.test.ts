import { describe, it, expect } from "vitest";
import { Conversation, serializeConversation, parseConversation } from "../../src/agent/conversation";

describe("Conversation", () => {
  it("append + metadata", () => {
    const c = new Conversation({ id: "c1", mode: "ask", provider: "openai", model: "gpt-4o" });
    c.append({ role: "user", content: "hi" });
    expect(c.messages.length).toBe(1);
    expect(c.id).toBe("c1");
  });
  it("serialize + parse roundtrip", () => {
    const c = new Conversation({ id: "c1", mode: "edit", provider: "deepseek", model: "deepseek-chat", title: "test" });
    c.append({ role: "user", content: "hello" });
    c.append({ role: "assistant", content: "world" });
    const md = serializeConversation(c);
    const back = parseConversation(md);
    expect(back.id).toBe("c1");
    expect(back.mode).toBe("edit");
    expect(back.messages).toHaveLength(2);
    expect(back.messages[1].content).toBe("world");
  });
});
