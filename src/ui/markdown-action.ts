import { MarkdownRenderer, Component } from "obsidian";
import type ObsidianAgentPlugin from "../main";

export interface MarkdownParams {
  text: string;
  plugin: ObsidianAgentPlugin;
}

export function markdown(node: HTMLElement, params: MarkdownParams) {
  const owner = new Component();
  owner.load();
  let version = 0;

  async function render(p: MarkdownParams) {
    const v = ++version;
    node.empty();
    await MarkdownRenderer.render(p.plugin.app, p.text, node, "", owner);
    if (v !== version) return;
    node.querySelectorAll<HTMLElement>("pre").forEach(injectCopyButton);
  }

  function injectCopyButton(pre: HTMLElement) {
    if (pre.querySelector(".ob-copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "ob-copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", () => {
      const code = (pre.querySelector("code") ?? pre).textContent ?? "";
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "✓ Copied";
        setTimeout(() => { btn.textContent = "Copy"; }, 2000);
      });
    });
    pre.appendChild(btn);
  }

  render(params);

  return {
    update(newParams: MarkdownParams) { render(newParams); },
    destroy() { owner.unload(); },
  };
}
