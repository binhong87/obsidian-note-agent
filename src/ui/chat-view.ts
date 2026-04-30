import { ItemView, WorkspaceLeaf } from "obsidian";
import ChatView from "./ChatView.svelte";
import type ObsidianNoteAgentPlugin from "../main";

export const VIEW_TYPE_AGENT_CHAT = "smart-note-agent-chat";

export class AgentChatView extends ItemView {
  private component: ChatView | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: ObsidianNoteAgentPlugin) { super(leaf); }
  getViewType() { return VIEW_TYPE_AGENT_CHAT; }
  getDisplayText() { return "Agent"; }
  getIcon() { return "bot"; }
  onOpen(): Promise<void> {
    this.contentEl.empty();
    this.component = new ChatView({ target: this.contentEl, props: { plugin: this.plugin } });
    return Promise.resolve();
  }
  onClose(): Promise<void> { this.component?.$destroy(); this.component = null; return Promise.resolve(); }
}
