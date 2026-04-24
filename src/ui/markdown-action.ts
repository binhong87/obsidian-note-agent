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
  let currentPlugin = params.plugin;

  const onClick = (evt: MouseEvent) => {
    const target = evt.target as HTMLElement | null;
    const a = target?.closest("a") as HTMLAnchorElement | null;
    if (!a || !node.contains(a)) return;

    if (a.classList.contains("internal-link")) {
      evt.preventDefault();
      const href = a.getAttribute("href") ?? a.getAttribute("data-href") ?? "";
      if (!href) return;
      const newLeaf = evt.ctrlKey || evt.metaKey || evt.button === 1;
      currentPlugin.app.workspace.openLinkText(href, "", newLeaf);
    } else if (a.classList.contains("external-link") || /^https?:/i.test(a.getAttribute("href") ?? "")) {
      evt.preventDefault();
      const href = a.getAttribute("href") ?? "";
      if (href) window.open(href, "_blank");
    }
  };
  node.addEventListener("click", onClick);

  async function render(p: MarkdownParams) {
    currentPlugin = p.plugin;
    const v = ++version;
    node.empty();
    await MarkdownRenderer.render(p.plugin.app, p.text, node, "", owner);
    if (v !== version) return;
    node.querySelectorAll<HTMLElement>("pre").forEach(injectCodeHeader);
  }

  function injectCodeHeader(pre: HTMLElement) {
    if (pre.querySelector(".ob-code-header")) return;
    const code = pre.querySelector<HTMLElement>("code");
    const lang = code?.className.match(/language-(\S+)/)?.[1] ?? "";

    const header = document.createElement("div");
    header.className = "ob-code-header";

    const langLabel = document.createElement("span");
    langLabel.className = "ob-code-lang";
    langLabel.textContent = lang;

    const btn = document.createElement("button");
    btn.className = "ob-copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", () => {
      const text = (code ?? pre).textContent ?? "";
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "✓ Copied";
        setTimeout(() => { btn.textContent = "Copy"; }, 2000);
      }).catch(() => {
        btn.textContent = "Failed";
        setTimeout(() => { btn.textContent = "Copy"; }, 2000);
      });
    });

    header.appendChild(langLabel);
    header.appendChild(btn);
    pre.insertBefore(header, pre.firstChild);
  }

  render(params);

  return {
    update(newParams: MarkdownParams) { render(newParams); },
    destroy() { node.removeEventListener("click", onClick); owner.unload(); },
  };
}
