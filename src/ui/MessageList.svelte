<script lang="ts">
  import DiffReviewBlock from "./DiffReviewBlock.svelte";
  import ChangeSummary from "./ChangeSummary.svelte";
  import type ObsidianAgentPlugin from "../main";
  export let messages: any[];
  export let streamBuf: string;
  export let pending: any[];
  export let plugin: ObsidianAgentPlugin;
</script>

<div class="agent-messages">
  {#each messages as m}
    {#if m.role === "user"}
      <div class="msg user">{m.content}</div>
    {:else if m.role === "assistant"}
      <div class="msg assistant">{m.content}</div>
    {/if}
  {/each}
  {#if streamBuf}<div class="msg assistant streaming">{streamBuf}</div>{/if}
  {#if pending.length}
    <div class="pending-block">
      {#each pending as p}<DiffReviewBlock {p} {plugin} />{/each}
      <div class="apply-row">
        <button on:click={() => plugin.approvalQueue.approveAll()}>{plugin.i18n.t("diff.applyAll")}</button>
        <button on:click={() => plugin.approvalQueue.rejectAll()}>{plugin.i18n.t("diff.rejectAll")}</button>
      </div>
    </div>
  {/if}
  <ChangeSummary {plugin} />
</div>

<style>
  .agent-messages { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
  .msg { padding: 0.5rem; border-radius: 4px; white-space: pre-wrap; }
  .msg.user { background: var(--background-secondary); }
  .msg.assistant { background: var(--background-primary-alt); }
  .apply-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
</style>
