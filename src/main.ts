import { Plugin, WorkspaceLeaf, Notice, moment } from "obsidian";
import { migrateSettings, Settings } from "./settings";
import { I18n, detectLocale } from "./services/i18n";
import { VaultService } from "./services/vault-service";
import { ConversationStore } from "./services/conversation-store";
import { SchedulerService } from "./services/scheduler-service";
import { createProvider } from "./providers/registry";
import { buildToolRegistry } from "./tools/registry";
import { Conversation } from "./agent/conversation";
import { ApprovalQueue } from "./agent/approval-queue";
import { AgentLoop } from "./agent/agent-loop";
import { systemPromptKey } from "./agent/mode-gate";
import { AgentSettingsTab } from "./ui/SettingsTab";
import { AgentChatView, VIEW_TYPE_AGENT_CHAT } from "./ui/chat-view";
import { StatusBar } from "./ui/status-bar";
import { applyUnifiedPatch } from "./utils/patch";

export default class ObsidianAgentPlugin extends Plugin {
  settings!: Settings;
  i18n!: I18n;
  vault!: VaultService;
  conversations!: ConversationStore;
  approvalQueue!: ApprovalQueue;
  currentConversation!: Conversation;
  scheduler!: SchedulerService;
  statusBar!: StatusBar;
  lastTurnSummary: { created: string[]; edited: string[]; deleted: string[] } = { created: [], edited: [], deleted: [] };
  private summaryListeners = new Set<(s: typeof this.lastTurnSummary) => void>();
  private currentLoop: AgentLoop | null = null;

  async onload() {
    this.settings = migrateSettings(await this.loadData());
    this.i18n = new I18n(detectLocale(this.settings.locale, moment.locale()));
    this.vault = new VaultService(this.app);
    this.conversations = new ConversationStore(this.vault, this.settings.chatsFolder);
    this.approvalQueue = new ApprovalQueue({ commit: (pw) => this.commitWrite(pw) });
    this.currentConversation = this.newConversation();

    this.addSettingTab(new AgentSettingsTab(this.app, this));
    this.registerView(VIEW_TYPE_AGENT_CHAT, (leaf: WorkspaceLeaf) => new AgentChatView(leaf, this));

    this.addRibbonIcon("bot", "Open Agent", () => this.activateView());
    this.addCommand({ id: "open-agent", name: "Open Agent", callback: () => this.activateView() });
    this.addCommand({ id: "new-agent-chat", name: "New chat", callback: () => this.startNewConversation() });

    this.statusBar = new StatusBar(this, this.addStatusBarItem());

    this.scheduler = new SchedulerService(() => this.settings, (kind, cfg) => this.runScheduled(kind, cfg));
    this.scheduler.start();
  }

  onunload() { this.scheduler?.stop(); this.currentLoop?.cancel(); this.approvalQueue?.clear(); }

  async saveSettings() { await this.saveData(this.settings); this.i18n.setLocale(detectLocale(this.settings.locale, moment.locale())); }

  newConversation(): Conversation {
    return new Conversation({
      id: `c_${Date.now()}`, mode: this.settings.mode,
      provider: this.settings.providerId, model: this.settings.model,
    });
  }

  async startNewConversation() { this.approvalQueue.clear(); this.currentConversation = this.newConversation(); }
  async openConversation(path: string) { this.currentConversation = await this.conversations.load(path); }

  cancelCurrentTurn() { this.currentLoop?.cancel(); }

  onSummaryChange(fn: (s: typeof this.lastTurnSummary) => void) { this.summaryListeners.add(fn); }
  private emitSummary() { for (const l of this.summaryListeners) l(this.lastTurnSummary); }

  async *sendMessage(text: string) {
    const provider = createProvider(this.settings.providerId, { apiKey: this.settings.apiKey, baseUrl: this.settings.baseUrl });
    // Sync model/provider from current settings so changes take effect immediately
    this.currentConversation.model = this.settings.model;
    this.currentConversation.provider = this.settings.providerId;
    const ctx = {
      vault: this.vault,
      activeFile: () => {
        const f = this.app.workspace.getActiveFile();
        if (!f) return null;
        return { path: f.path, content: "" };
      },
      selection: () => {
        const ed = (this.app.workspace as any).activeEditor?.editor;
        return ed?.getSelection?.() ?? "";
      },
    };
    const tools = buildToolRegistry(ctx, this.currentConversation.mode);
    this.lastTurnSummary = { created: [], edited: [], deleted: [] };
    this.currentLoop = new AgentLoop({
      provider,
      conversation: this.currentConversation,
      tools,
      approvalQueue: this.approvalQueue,
      systemPrompt: this.i18n.t(systemPromptKey(this.currentConversation.mode)),
      maxIterations: this.settings.maxIterations,
      turnTimeoutMs: this.settings.turnTimeoutMs,
      historyBudget: this.settings.historyTokenBudget,
      computeDiff: (p) => this.computeDiff(p),
    });
    this.statusBar.render("thinking");
    try { yield* this.currentLoop.send(text); }
    finally {
      this.statusBar.render("idle");
      this.currentLoop = null;
      await this.conversations.save(this.currentConversation);
      this.emitSummary();
    }
  }

  private async computeDiff(p: { tool: string; args: any }): Promise<string> {
    try {
      if (p.tool === "edit_note") {
        const before = await this.vault.readNote(p.args.path);
        return simpleDiff(before, p.args.content);
      }
      if (p.tool === "create_note") return `+ ${p.args.path}\n${p.args.content}`;
      if (p.tool === "delete_note") return `- ${p.args.path}`;
      if (p.tool === "move_note") return `${p.args.from} → ${p.args.to}`;
      if (p.tool === "apply_patch") return p.args.patch;
    } catch {}
    return "";
  }

  private async commitWrite(p: { tool: string; args: any }): Promise<void> {
    switch (p.tool) {
      case "create_note": await this.vault.createNote(p.args.path, p.args.content); this.lastTurnSummary.created.push(p.args.path); break;
      case "edit_note": await this.vault.editNote(p.args.path, p.args.content); this.lastTurnSummary.edited.push(p.args.path); break;
      case "apply_patch": {
        const before = await this.vault.readNote(p.args.path);
        await this.vault.editNote(p.args.path, applyUnifiedPatch(before, p.args.patch));
        this.lastTurnSummary.edited.push(p.args.path); break;
      }
      case "delete_note": await this.vault.deleteNote(p.args.path); this.lastTurnSummary.deleted.push(p.args.path); break;
      case "move_note": await this.vault.moveNote(p.args.from, p.args.to); this.lastTurnSummary.edited.push(p.args.to); break;
    }
    this.emitSummary();
  }

  private async runScheduled(kind: "daily" | "weekly", cfg: any): Promise<void> {
    const provider = createProvider(this.settings.providerId, { apiKey: this.settings.apiKey, baseUrl: this.settings.baseUrl });
    const conv = new Conversation({ id: `sched_${kind}_${Date.now()}`, mode: "scheduled", provider: this.settings.providerId, model: this.settings.model });
    const ctx = { vault: this.vault, activeFile: () => null, selection: () => "" };
    const tools = buildToolRegistry(ctx, "scheduled");
    const promptKey = kind === "daily" ? "prompt.scheduled.daily" : "prompt.scheduled.weekly";
    conv.append({ role: "user", content: `Target folder: ${cfg.targetFolder}` });
    const loop = new AgentLoop({
      provider, conversation: conv, tools, approvalQueue: this.approvalQueue,
      systemPrompt: this.i18n.t(promptKey),
      maxIterations: this.settings.maxIterations,
      turnTimeoutMs: this.settings.turnTimeoutMs,
      historyBudget: this.settings.historyTokenBudget,
    });
    for await (const _ of loop.run()) { /* drain */ }
    await this.approvalQueue.approveAll();
    await this.logActivity(`[${new Date().toISOString()}] scheduled/${kind} ok`);
  }

  private async logActivity(line: string) {
    const path = `${this.settings.chatsFolder}/../activity.log.md`;
    try { const cur = await this.vault.readNote(path); await this.vault.editNote(path, cur + line + "\n"); }
    catch { try { await this.vault.createNote(path, line + "\n"); } catch { new Notice("Agent: failed to write activity log"); } }
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_AGENT_CHAT)[0];
    if (!leaf) { leaf = this.app.workspace.getRightLeaf(false)!; await leaf.setViewState({ type: VIEW_TYPE_AGENT_CHAT, active: true }); }
    this.app.workspace.revealLeaf(leaf);
  }
}

function simpleDiff(a: string, b: string): string {
  const al = a.split("\n"), bl = b.split("\n");
  const out: string[] = []; const n = Math.max(al.length, bl.length);
  for (let i = 0; i < n; i++) {
    if (al[i] === bl[i]) out.push("  " + (al[i] ?? ""));
    else { if (al[i] !== undefined) out.push("- " + al[i]); if (bl[i] !== undefined) out.push("+ " + bl[i]); }
  }
  return out.join("\n");
}
