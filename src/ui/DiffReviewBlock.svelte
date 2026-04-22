<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let p: any;
  export let plugin: ObsidianAgentPlugin;
  const t = (k: string) => plugin.i18n.t(k);
</script>
<div class="diff-block">
  <div class="head"><code>{p.tool}</code> → <code>{p.args.path ?? p.args.from}</code></div>
  {#if p.diff}<pre class="diff">{p.diff}</pre>{/if}
  <div class="row">
    <button on:click={() => plugin.approvalQueue.approve(p.toolCallId)}>{t("diff.approve")}</button>
    <button on:click={() => plugin.approvalQueue.reject(p.toolCallId)}>{t("diff.reject")}</button>
  </div>
</div>
<style>
  .diff-block { border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 0.5rem; }
  pre.diff { max-height: 300px; overflow: auto; font-size: 0.8rem; }
  .row { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
</style>
