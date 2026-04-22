import { ItemView, WorkspaceLeaf } from "obsidian";
import ChatView from "./ChatView.svelte";
import type ObsidianAgentPlugin from "../main";

export const VIEW_TYPE_AGENT_CHAT = "obsidian-agent-chat";

export class AgentChatView extends ItemView {
  private component: ChatView | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: ObsidianAgentPlugin) { super(leaf); }
  getViewType() { return VIEW_TYPE_AGENT_CHAT; }
  getDisplayText() { return "Agent"; }
  getIcon() { return "bot"; }
  async onOpen() {
    this.contentEl.empty();
    this.component = new ChatView({ target: this.contentEl, props: { plugin: this.plugin } });
  }
  async onClose() { this.component?.$destroy(); this.component = null; }
}
