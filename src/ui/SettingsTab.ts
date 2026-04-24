import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianAgentPlugin from "../main";
import { listProviderIds } from "../providers/registry";
import { PROVIDER_DEFAULTS, defaultProfile } from "../providers/defaults";
import type { ProviderId } from "../types";

export class AgentSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: ObsidianAgentPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; containerEl.empty();
    const s = this.plugin.settings;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const wide = (el: HTMLInputElement) => {
      el.style.width = "100%";
      const control = el.closest(".setting-item-control") as HTMLElement | null;
      if (control) { control.style.flex = "0 0 50%"; control.style.minWidth = "0"; }
    };

    // Ensure the active provider has a profile entry
    if (!s.providers[s.providerId]) s.providers[s.providerId] = defaultProfile(s.providerId);
    const profile = s.providers[s.providerId];
    const defaults = PROVIDER_DEFAULTS[s.providerId];

    containerEl.createEl("h2", { text: t("settings.title") });

    new Setting(containerEl).setName(t("settings.provider")).addDropdown(d => {
      for (const id of listProviderIds()) d.addOption(id, t(`provider.${id}`));
      d.setValue(s.providerId).onChange(async v => {
        s.providerId = v as ProviderId;
        if (!s.providers[s.providerId]) s.providers[s.providerId] = defaultProfile(s.providerId);
        await this.plugin.saveSettings();
        this.display();
      });
    });

    if (s.providerId === "custom") {
      new Setting(containerEl)
        .setName(t("settings.provider.compat"))
        .setDesc(t("settings.provider.compat.desc"))
        .addDropdown(d => {
          d.addOption("openai", "OpenAI").addOption("anthropic", "Anthropic");
          d.setValue(profile.compat ?? "openai").onChange(async v => {
            profile.compat = v as "openai" | "anthropic";
            await this.plugin.saveSettings();
          });
        });
    }

    new Setting(containerEl).setName(t("settings.apiKey")).addText(x => {
      wide(x.inputEl);
      x.setValue(profile.apiKey).onChange(async v => { profile.apiKey = v; await this.plugin.saveSettings(); });
    });

    new Setting(containerEl)
      .setName(t("settings.baseUrl"))
      .setDesc(t("settings.baseUrl.desc", { url: defaults.baseUrl }))
      .addText(x => {
        wide(x.inputEl);
        x.setPlaceholder(defaults.baseUrl)
          .setValue(profile.baseUrl)
          .onChange(async v => { profile.baseUrl = v.trim(); await this.plugin.saveSettings(); });
      });

    new Setting(containerEl)
      .setName(t("settings.model"))
      .setDesc(t("settings.model.desc", { model: defaults.model }))
      .addText(x => {
        wide(x.inputEl);
        x.setPlaceholder(defaults.model)
          .setValue(profile.model)
          .onChange(async v => { profile.model = v.trim(); await this.plugin.saveSettings(); });
      });

    new Setting(containerEl)
      .setName(t("settings.timeout"))
      .setDesc(t("settings.timeout.desc"))
      .addText(x => x
        .setValue(String(Math.round(s.turnTimeoutMs / 1000)))
        .onChange(async v => {
          const n = parseInt(v, 10);
          if (n > 0) { s.turnTimeoutMs = n * 1000; await this.plugin.saveSettings(); }
        }));

    new Setting(containerEl).setName(t("settings.chatsFolder")).addText(x => {
      wide(x.inputEl);
      x.setValue(s.chatsFolder).onChange(async v => { s.chatsFolder = v; await this.plugin.saveSettings(); });
    });

    new Setting(containerEl).setName(t("settings.language")).addDropdown(d =>
      d.addOption("auto", t("settings.language.auto")).addOption("en", "English").addOption("zh-CN", "中文")
        .setValue(s.locale).onChange(async v => {
          s.locale = v as any;
          await this.plugin.saveSettings();
          // Re-render this tab and the chat view so the new locale takes effect immediately
          this.display();
          await this.plugin.reopenChatView();
        }));

    containerEl.createEl("h3", { text: t("settings.scheduled") });

    this.scheduledRow(containerEl, t("settings.scheduled.daily"), s.scheduled.dailySummary, false);
    this.scheduledRow(containerEl, t("settings.scheduled.weekly"), s.scheduled.weeklyReview, true);
  }

  private scheduledRow(container: HTMLElement, label: string, cfg: any, weekly: boolean) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    new Setting(container).setName(label)
      .addToggle(tg => tg.setValue(cfg.enabled).onChange(async v => { cfg.enabled = v; await this.plugin.saveSettings(); }))
      .addText(x => x.setPlaceholder(t("settings.scheduled.timePH")).setValue(cfg.time).onChange(async v => { cfg.time = v; await this.plugin.saveSettings(); }))
      .addText(x => x.setPlaceholder(t("settings.scheduled.folderPH")).setValue(cfg.targetFolder).onChange(async v => { cfg.targetFolder = v; await this.plugin.saveSettings(); }));
    if (weekly) {
      new Setting(container).setName(t("settings.scheduled.weekday")).addText(x =>
        x.setValue(String(cfg.weekday ?? 0)).onChange(async v => { cfg.weekday = Number(v); await this.plugin.saveSettings(); }));
    }
  }
}
