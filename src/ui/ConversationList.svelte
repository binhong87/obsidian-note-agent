<script lang="ts">
  import { onMount } from "svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;

  let paths: string[] = [];
  let active = plugin.currentConversation?.path ?? "";

  onMount(async () => { paths = await plugin.conversations.list(); });

  async function open(p: string) {
    await plugin.openConversation(p);
    active = p;
  }

  function label(p: string): string {
    return (p.split("/").pop() ?? p).replace(/\.md$/i, "");
  }

  function dateHint(p: string): string {
    const m = p.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }
</script>

<div class="cl-root" role="navigation" aria-label="Conversation history">
  {#if paths.length === 0}
    <div class="cl-empty">No saved conversations</div>
  {:else}
    {#each paths as p (p)}
      <button
        class="cl-item"
        class:cl-active={p === active}
        on:click={() => open(p)}
        title={p}
        aria-current={p === active ? "page" : undefined}
      >
        <svg class="cl-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="cl-label">{label(p)}</span>
        {#if dateHint(p)}
          <span class="cl-date">{dateHint(p)}</span>
        {/if}
      </button>
    {/each}
  {/if}
</div>

<style>
  .cl-root {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }
  .cl-empty {
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-faint);
    font-style: italic;
  }
  .cl-item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 6px 14px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
    white-space: nowrap;
    overflow: hidden;
  }
  .cl-item:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .cl-item:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: -2px; }
  .cl-active {
    border-left-color: var(--interactive-accent);
    background: color-mix(in srgb, var(--interactive-accent) 10%, transparent) !important;
    color: var(--text-accent) !important;
  }
  .cl-icon { flex-shrink: 0; opacity: 0.55; }
  .cl-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cl-date {
    font-size: 10px;
    color: var(--text-faint);
    font-family: var(--font-monospace);
    flex-shrink: 0;
  }
</style>
