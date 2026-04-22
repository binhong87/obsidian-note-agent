import type { Mode } from "../types";

export function systemPromptKey(mode: Mode): string {
  if (mode === "ask") return "prompt.system.ask";
  if (mode === "edit") return "prompt.system.edit";
  return "prompt.scheduled.daily";
}
