import type ObsidianNoteAgentPlugin from "../main";
import { activeProfile } from "../settings";

export class StatusBar {
  constructor(private plugin: ObsidianNoteAgentPlugin, private el: HTMLElement) {
    this.render("idle");
  }
  render(state: "idle" | "thinking" | "waiting" | "compacting") {
    const s = this.plugin.settings;
    const label = state === "idle" ? "●"
      : state === "thinking" ? "…"
      : state === "compacting" ? "⟳"
      : "?";
    this.el.setText(`${label} ${s.providerId}:${activeProfile(s).model}`);
  }
}
