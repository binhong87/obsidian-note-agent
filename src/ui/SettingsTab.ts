import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianNoteAgentPlugin from "../main";
import { listProviderIds } from "../providers/registry";
import { PROVIDER_DEFAULTS, defaultProfile } from "../providers/defaults";
import type { ProviderId } from "../types";

export class AgentSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: ObsidianNoteAgentPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; containerEl.empty();
    const s = this.plugin.settings;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const wide = (el: HTMLInputElement) => {
      // eslint-disable-next-line obsidianmd/no-static-styles-assignment -- no CSS infrastructure for TS files; input needs 100% width dynamically
      el.style.width = "100%";
      const control = el.closest(".setting-item-control");
      // eslint-disable-next-line obsidianmd/no-static-styles-assignment -- layout fix for wide inputs in settings panel
      if (control) { (control as HTMLElement).style.flex = "0 0 50%"; (control as HTMLElement).style.minWidth = "0"; }
    };

    // Ensure the active provider has a profile entry
    if (!s.providers[s.providerId]) s.providers[s.providerId] = defaultProfile(s.providerId);
    const profile = s.providers[s.providerId];
    const defaults = PROVIDER_DEFAULTS[s.providerId];

    new Setting(containerEl).setName("").setHeading();

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

    new Setting(containerEl).setName(t("settings.language")).addDropdown(d =>
      d.addOption("auto", t("settings.language.auto")).addOption("en", "English").addOption("zh-CN", "中文")
        .setValue(s.locale).onChange(async v => {
          s.locale = v as any;
          await this.plugin.saveSettings();
          // Re-render this tab and the chat view so the new locale takes effect immediately
          this.display();
          await this.plugin.reopenChatView();
        }));

    new Setting(containerEl).setName("").setHeading();
    new Setting(containerEl)
      .setDesc(t("settings.userProfile.desc"))
      .addTextArea(x => {
        // eslint-disable-next-line obsidianmd/no-static-styles-assignment -- no CSS infrastructure for TS files; textarea dimensions required
        x.inputEl.style.width = "100%";
        // eslint-disable-next-line obsidianmd/no-static-styles-assignment
        x.inputEl.style.minHeight = "96px";
        // eslint-disable-next-line obsidianmd/no-static-styles-assignment
        x.inputEl.style.resize = "vertical";
        x.setPlaceholder(t("settings.userProfile.placeholder"))
          .setValue(s.userProfile)
          .onChange(async v => { s.userProfile = v; await this.plugin.saveSettings(); });
      });
  }
}
