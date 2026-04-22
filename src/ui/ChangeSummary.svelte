<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let summary = plugin.lastTurnSummary;
  plugin.onSummaryChange(s => summary = s);
  const t = (k: string, v?: any) => plugin.i18n.t(k, v);
</script>
{#if summary && (summary.created.length || summary.edited.length || summary.deleted.length)}
  <div class="summary">
    <strong>Changes:</strong>
    {#if summary.created.length}{t("summary.created", { count: summary.created.length })} {/if}
    {#if summary.edited.length}{t("summary.edited", { count: summary.edited.length })} {/if}
    {#if summary.deleted.length}{t("summary.deleted", { count: summary.deleted.length })}{/if}
  </div>
{/if}
<style>.summary { font-size: 0.85rem; color: var(--text-muted); padding: 0.25rem; }</style>
