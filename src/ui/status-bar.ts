import type ObsidianAgentPlugin from "../main";

export class StatusBar {
  constructor(private plugin: ObsidianAgentPlugin, private el: HTMLElement) {
    this.render("idle");
  }
  render(state: "idle" | "thinking" | "waiting" | "compacting") {
    const s = this.plugin.settings;
    const label = state === "idle" ? "●"
      : state === "thinking" ? "…"
      : state === "compacting" ? "⟳"
      : "?";
    this.el.setText(`${label} ${s.providerId}:${s.providers[s.providerId]?.model || "-"}`);
  }
}
