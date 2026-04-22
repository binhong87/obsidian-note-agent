<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let p: any;
  export let plugin: ObsidianAgentPlugin;

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

  // Parse diff lines for syntax highlighting
  function parseDiff(diff: string): { type: 'add'|'del'|'ctx'; text: string }[] {
    return diff.split("\n").map(line => {
      if (line.startsWith("+")) return { type: "add", text: line };
      if (line.startsWith("-")) return { type: "del", text: line };
      return { type: "ctx", text: line };
    });
  }

  $: diffLines = p.diff ? parseDiff(p.diff) : [];
  $: filePath = p.args?.path ?? p.args?.from ?? p.args?.to ?? "";
</script>

<div class="db-root">
  <!-- Header -->
  <div class="db-header">
    <div class="db-header-left">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {@html toolIcon(p.tool)}
      </svg>
      <span class="db-tool-name">{p.tool.replace(/_/g, " ")}</span>
      {#if filePath}
        <span class="db-sep">·</span>
        <span class="db-filepath" title={filePath}>{filePath}</span>
      {/if}
    </div>
    <div class="db-actions">
      <button class="db-btn db-approve" on:click={() => plugin.approvalQueue.approve(p.toolCallId)}>
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
    <div class="db-diff" role="region" aria-label="File diff">
      {#each diffLines as line}
        <div class="db-line db-{line.type}">
          <span class="db-gutter" aria-hidden="true">
            {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
          </span>
          <span class="db-text">{line.text.slice(1)}</span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="db-no-diff">No preview available</div>
  {/if}
</div>

<style>
  .db-root {
    background: var(--background-primary-alt);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  /* Header */
  .db-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .db-header-left {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    color: var(--text-muted);
    font-size: 12px;
  }
  .db-tool-name {
    font-weight: 600;
    color: var(--text-normal);
    text-transform: capitalize;
  }
  .db-sep { color: var(--text-faint); }
  .db-filepath {
    font-family: var(--font-monospace);
    font-size: 11px;
    color: var(--text-accent);
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
    padding: 3px 9px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid;
    background: transparent;
    transition: background 150ms, color 150ms;
    white-space: nowrap;
  }
  .db-btn:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .db-approve {
    border-color: var(--color-green, #48bb78);
    color: var(--color-green, #48bb78);
  }
  .db-approve:hover { background: color-mix(in srgb, var(--color-green, #48bb78) 15%, transparent); }
  .db-reject {
    border-color: var(--color-red, #e53e3e);
    color: var(--color-red, #e53e3e);
  }
  .db-reject:hover { background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent); }

  /* Diff display */
  .db-diff {
    font-family: var(--font-monospace);
    font-size: 11.5px;
    line-height: 1.5;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 280px;
    border-top: 1px solid var(--background-modifier-border);
  }
  .db-line {
    display: flex;
    min-width: 0;
    padding: 0 10px;
    white-space: pre;
  }
  .db-add {
    background: color-mix(in srgb, var(--color-green, #48bb78) 12%, transparent);
    color: var(--color-green, #48bb78);
  }
  .db-del {
    background: color-mix(in srgb, var(--color-red, #e53e3e) 12%, transparent);
    color: var(--color-red, #e53e3e);
  }
  .db-ctx { color: var(--text-muted); }
  .db-gutter {
    width: 14px;
    flex-shrink: 0;
    user-select: none;
    opacity: 0.7;
  }
  .db-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  .db-no-diff {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-faint);
    border-top: 1px solid var(--background-modifier-border);
  }
</style>
