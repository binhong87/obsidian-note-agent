<script lang="ts">
  import { Notice } from "obsidian";
  import type ObsidianNoteAgentPlugin from "../main";
  export let p: any;
  export let plugin: ObsidianNoteAgentPlugin;

  const t = (k: string) => plugin.i18n.t(k);

  const TOOL_ICONS: Record<string, string> = {
    create_note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    edit_note:   '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    delete_note: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    move_note:   '<polyline points="5 9 2 12 5 15"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/>',
    apply_patch: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>',
  };

  function toolIcon(name: string): string {
    return TOOL_ICONS[name] ?? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  }

  type DiffLine = { type: 'add' | 'del' | 'ctx'; text: string; oldLine?: number; newLine?: number };

  function parseDiff(diff: string): DiffLine[] {
    const result: DiffLine[] = [];
    let oldLine = 0, newLine = 0;
    for (const raw of diff.split("\n")) {
      if (raw.startsWith("---") || raw.startsWith("+++")) continue;
      if (raw.startsWith("@@")) {
        const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (m) { oldLine = parseInt(m[1]); newLine = parseInt(m[2]); }
        continue;
      }
      if (raw.startsWith("+")) {
        result.push({ type: "add", text: raw.slice(1), newLine: newLine++ });
      } else if (raw.startsWith("-")) {
        result.push({ type: "del", text: raw.slice(1), oldLine: oldLine++ });
      } else {
        result.push({ type: "ctx", text: raw.slice(1), oldLine: oldLine++, newLine: newLine++ });
      }
    }
    return result;
  }

  $: diffLines = p.diff ? parseDiff(p.diff) : [];
  $: filePath = p.args?.path ?? p.args?.from ?? p.args?.to ?? "";
  $: fileName = filePath ? filePath.split("/").pop() ?? filePath : "";

  async function approveItem() {
    try { await plugin.approvalQueue.approve(p.toolCallId); }
    catch (e) { new Notice(`Could not apply: ${e instanceof Error ? e.message : String(e)}`, 6000); }
  }
</script>

<div class="db-root">
  <!-- Header -->
  <div class="db-header">
    <div class="db-header-left">
      <div class="db-tool-icon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html toolIcon(p.tool)}
        </svg>
      </div>
      <span class="db-tool-name">{p.tool.replace(/_/g, " ")}</span>
      {#if filePath}
        <span class="db-sep" aria-hidden="true">·</span>
        <span class="db-filepath-chip" title={filePath}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          {fileName}
        </span>
      {/if}
    </div>
    <div class="db-actions">
      <button class="db-btn db-approve" on:click={approveItem}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        {t("diff.approve")}
      </button>
      <button class="db-btn db-reject" on:click={() => plugin.approvalQueue.reject(p.toolCallId)}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        {t("diff.reject")}
      </button>
    </div>
  </div>

  <!-- Diff body -->
  {#if diffLines.length}
    <div class="db-diff" role="region" aria-label={plugin.i18n.t("diff.aria")}>
      <div class="db-diff-inner">
        {#each diffLines as line}
          <div class="db-line db-{line.type}">
            <span class="db-gutter" aria-hidden="true">
              <span class="db-gutter-old">{line.oldLine ?? ""}</span>
              <span class="db-gutter-new">{line.newLine ?? ""}</span>
            </span>
            <span class="db-sigil" aria-hidden="true">
              {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
            </span>
            <span class="db-text">{line.text}</span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="db-no-diff">{plugin.i18n.t("diff.noPreview")}</div>
  {/if}
</div>

<style>
  .db-root {
    background: var(--background-primary);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  /* Header */
  .db-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    gap: 8px;
    flex-wrap: wrap;
    background: var(--background-secondary);
  }
  .db-header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 12px;
  }
  .db-tool-icon {
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted);
  }
  .db-tool-name {
    font-weight: 600;
    color: var(--text-normal);
    text-transform: capitalize;
  }
  .db-sep { color: var(--text-faint); }
  .db-filepath-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-monospace);
    font-size: 11px;
    color: var(--text-accent);
    background: color-mix(in srgb, var(--interactive-accent) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--interactive-accent) 25%, transparent);
    padding: 1px 7px;
    border-radius: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  /* Action buttons */
  .db-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .db-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background 150ms, transform 100ms;
    white-space: nowrap;
  }
  .db-btn:active { transform: scale(0.96); }
  .db-btn:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .db-approve {
    background: color-mix(in srgb, var(--color-green, #48bb78) 18%, transparent);
    border: 1px solid var(--color-green, #48bb78);
    color: var(--color-green, #48bb78);
  }
  .db-approve:hover { background: color-mix(in srgb, var(--color-green, #48bb78) 28%, transparent); }
  .db-reject {
    background: transparent;
    border: 1px solid var(--color-red, #e53e3e);
    color: var(--color-red, #e53e3e);
  }
  .db-reject:hover { background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent); }

  /* Diff display */
  .db-diff {
    border-top: 1px solid var(--background-modifier-border);
    overflow-y: auto;
    max-height: 300px;
  }
  .db-diff-inner {
    font-family: var(--font-monospace);
    font-size: 11.5px;
    line-height: 1.55;
    overflow-x: auto;
  }
  .db-line {
    display: flex;
    align-items: stretch;
    min-width: 0;
    white-space: pre;
    border-left: 3px solid transparent;
  }
  .db-add {
    background: color-mix(in srgb, var(--color-green, #48bb78) 10%, transparent);
    border-left-color: var(--color-green, #48bb78);
  }
  .db-del {
    background: color-mix(in srgb, var(--color-red, #e53e3e) 10%, transparent);
    border-left-color: var(--color-red, #e53e3e);
  }
  .db-ctx { color: var(--text-muted); }
  .db-add .db-text { color: var(--color-green, #48bb78); }
  .db-del .db-text { color: var(--color-red, #e53e3e); }

  /* Gutter (old + new line numbers) */
  .db-gutter {
    display: flex;
    gap: 0;
    user-select: none;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--background-secondary) 60%, transparent);
    border-right: 1px solid var(--background-modifier-border);
  }
  .db-gutter-old, .db-gutter-new {
    width: 32px;
    text-align: right;
    padding: 0 6px;
    font-size: 10px;
    color: var(--text-faint);
    line-height: inherit;
  }
  .db-gutter-old { border-right: 1px solid var(--background-modifier-border); }
  .db-sigil {
    width: 16px;
    text-align: center;
    flex-shrink: 0;
    padding: 0 2px;
    opacity: 0.8;
  }
  .db-add .db-sigil { color: var(--color-green, #48bb78); }
  .db-del .db-sigil { color: var(--color-red, #e53e3e); }
  .db-text {
    flex: 1;
    min-width: 0;
    padding: 0 10px 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .db-no-diff {
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-faint);
    border-top: 1px solid var(--background-modifier-border);
    font-style: italic;
  }
</style>
