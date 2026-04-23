import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianAgentPlugin from "../main";
import { listProviderIds } from "../providers/registry";

export class AgentSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: ObsidianAgentPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; containerEl.empty();
    const s = this.plugin.settings;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);

    containerEl.createEl("h2", { text: "Obsidian Agent" });

    new Setting(containerEl).setName("Provider").addDropdown(d => {
      for (const id of listProviderIds()) d.addOption(id, id);
      d.setValue(s.providerId).onChange(async v => { s.providerId = v as any; await this.plugin.saveSettings(); this.display(); });
    });

    new Setting(containerEl).setName("API key").addText(x => {
      x.inputEl.type = "password";
      x.setValue(s.apiKey).onChange(async v => { s.apiKey = v; await this.plugin.saveSettings(); });
    });

    new Setting(containerEl).setName("Base URL (optional)").addText(x =>
      x.setValue(s.baseUrl).onChange(async v => { s.baseUrl = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Model").addText(x =>
      x.setValue(s.model).onChange(async v => { s.model = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Request timeout (seconds)")
      .setDesc("Max time to wait for a single LLM response. Increase for slow providers.")
      .addText(x => x
        .setValue(String(Math.round(s.turnTimeoutMs / 1000)))
        .onChange(async v => {
          const n = parseInt(v, 10);
          if (n > 0) { s.turnTimeoutMs = n * 1000; await this.plugin.saveSettings(); }
        }));

    new Setting(containerEl).setName("Default mode").addDropdown(d =>
      d.addOption("ask", t("chat.mode.ask")).addOption("edit", t("chat.mode.edit"))
        .setValue(s.mode).onChange(async v => { s.mode = v as any; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Chats folder").addText(x =>
      x.setValue(s.chatsFolder).onChange(async v => { s.chatsFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Language").addDropdown(d =>
      d.addOption("auto", "Auto").addOption("en", "English").addOption("zh-CN", "中文")
        .setValue(s.locale).onChange(async v => { s.locale = v as any; await this.plugin.saveSettings(); }));

    containerEl.createEl("h3", { text: "Scheduled tasks" });

    this.scheduledRow(containerEl, "Daily summary", s.scheduled.dailySummary, false);
    this.scheduledRow(containerEl, "Weekly review", s.scheduled.weeklyReview, true);
  }

  private scheduledRow(container: HTMLElement, label: string, cfg: any, weekly: boolean) {
    new Setting(container).setName(label)
      .addToggle(t => t.setValue(cfg.enabled).onChange(async v => { cfg.enabled = v; await this.plugin.saveSettings(); }))
      .addText(x => x.setPlaceholder("HH:mm").setValue(cfg.time).onChange(async v => { cfg.time = v; await this.plugin.saveSettings(); }))
      .addText(x => x.setPlaceholder("folder").setValue(cfg.targetFolder).onChange(async v => { cfg.targetFolder = v; await this.plugin.saveSettings(); }));
    if (weekly) {
      new Setting(container).setName("Weekday (0=Sun)").addText(x =>
        x.setValue(String(cfg.weekday ?? 0)).onChange(async v => { cfg.weekday = Number(v); await this.plugin.saveSettings(); }));
    }
  }
}
