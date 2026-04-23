<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;

  const dispatch = createEventDispatcher<{ select: void; newChat: void }>();

  let paths: string[] = [];
  let active = plugin.currentConversation?.path ?? "";

  onMount(async () => { paths = await plugin.conversations.list(); });

  async function open(p: string) {
    await plugin.openConversation(p);
    active = p;
    dispatch("select");
  }

  function startNew() {
    dispatch("newChat");
  }

  function label(p: string): string {
    return (p.split("/").pop() ?? p).replace(/\.md$/i, "");
  }

  function formatDate(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  }

  function dateLabel(p: string): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const m = p.match(/(\d{4}-\d{2}-\d{2})/);
    if (!m) return "Older";
    if (m[1] === formatDate(today)) return "Today";
    if (m[1] === formatDate(yesterday)) return "Yesterday";
    return m[1];
  }

  function rowDate(p: string, groupLbl: string): string {
    if (groupLbl === "Today" || groupLbl === "Yesterday") return "";
    const m = p.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "";
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m[2]) - 1]} ${parseInt(m[3])}`;
  }

  type Group = { label: string; paths: string[] };

  function groupPaths(ps: string[]): Group[] {
    const map = new Map<string, string[]>();
    for (const p of ps) {
      const key = dateLabel(p);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const pinned = ["Today", "Yesterday"];
    const entries = [...map.entries()];
    entries.sort(([a], [b]) => {
      const ia = pinned.indexOf(a);
      const ib = pinned.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      if (a === "Older") return 1;
      if (b === "Older") return -1;
      return b.localeCompare(a);
    });
    return entries.map(([lbl, items]) => ({ label: lbl, paths: items }));
  }

  $: groups = groupPaths(paths);
</script>

<div class="cl-root" role="navigation">
  {#if groups.length === 0}
    <div class="cl-empty">No saved conversations</div>
  {:else}
    {#each groups as group (group.label)}
      <div class="cl-section-label">{group.label}</div>
      {#each group.paths as p (p)}
        {@const d = rowDate(p, group.label)}
        <button
          class="cl-item"
          class:cl-active={p === active}
          on:click={() => open(p)}
          title={p}
          aria-current={p === active ? "page" : undefined}
        >
          <svg class="cl-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="cl-label">{label(p)}</span>
          {#if d}<span class="cl-date">{d}</span>{/if}
        </button>
      {/each}
    {/each}
  {/if}

  <button class="cl-new-btn" on:click={startNew}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    New conversation
  </button>
</div>

<style>
  .cl-root {
    display: flex;
    flex-direction: column;
    padding: 4px 0 0;
    background: var(--background-primary);
    min-height: 100%;
  }
  .cl-empty {
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-faint);
    font-style: italic;
  }
  .cl-section-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
    padding: 8px 13px 3px;
  }
  .cl-item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 7px 13px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    border-left: 3px solid transparent;
    border-bottom: 1px solid var(--background-modifier-border);
    transition: background 120ms ease, color 120ms ease;
    white-space: nowrap;
    overflow: hidden;
  }
  .cl-item:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .cl-item:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: -2px; }
  .cl-active {
    border-left-color: var(--interactive-accent);
    background: color-mix(in srgb, var(--interactive-accent) 8%, transparent) !important;
    color: var(--text-accent) !important;
  }
  .cl-icon { flex-shrink: 0; opacity: 0.5; }
  .cl-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cl-date {
    font-size: 10px;
    color: var(--text-faint);
    font-family: var(--font-monospace);
    flex-shrink: 0;
  }
  .cl-new-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 13px;
    border: none;
    border-top: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    color: var(--interactive-accent);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 120ms;
    position: sticky;
    bottom: 0;
  }
  .cl-new-btn:hover {
    background: color-mix(in srgb, var(--interactive-accent) 8%, transparent);
  }
</style>
