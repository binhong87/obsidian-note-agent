import type ObsidianAgentPlugin from "../main";

export class StatusBar {
  constructor(private plugin: ObsidianAgentPlugin, private el: HTMLElement) {
    this.render("idle");
  }
  render(state: "idle" | "thinking" | "waiting") {
    const s = this.plugin.settings;
    const label = state === "idle" ? "●" : state === "thinking" ? "…" : "?";
    this.el.setText(`${label} ${s.providerId}:${s.model || "-"}`);
  }
}
