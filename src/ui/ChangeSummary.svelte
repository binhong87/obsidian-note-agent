<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;

  let summary = plugin.lastTurnSummary;
  plugin.onSummaryChange(s => (summary = s));

  const t = (k: string, v?: any) => plugin.i18n.t(k, v);

  $: total = (summary?.created.length ?? 0) + (summary?.edited.length ?? 0) + (summary?.deleted.length ?? 0);
</script>

{#if summary && total > 0}
  <div class="cs-root" role="status" aria-live="polite">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
    <span class="cs-label">Changes applied:</span>
    {#if summary.created.length}
      <span class="cs-badge cs-create">+{summary.created.length} {t("summary.created", { count: summary.created.length })}</span>
    {/if}
    {#if summary.edited.length}
      <span class="cs-badge cs-edit">~{summary.edited.length} {t("summary.edited", { count: summary.edited.length })}</span>
    {/if}
    {#if summary.deleted.length}
      <span class="cs-badge cs-delete">-{summary.deleted.length} {t("summary.deleted", { count: summary.deleted.length })}</span>
    {/if}
  </div>
{/if}

<style>
  .cs-root {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 5px 12px;
    font-size: 11px;
    color: var(--text-muted);
    border-top: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    margin-top: auto;
  }
  .cs-label { font-weight: 500; color: var(--text-normal); }
  .cs-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-monospace);
  }
  .cs-create { background: color-mix(in srgb, var(--color-green, #48bb78) 15%, transparent); color: var(--color-green, #48bb78); }
  .cs-edit   { background: color-mix(in srgb, var(--text-accent) 15%, transparent); color: var(--text-accent); }
  .cs-delete { background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent); color: var(--color-red, #e53e3e); }
</style>
