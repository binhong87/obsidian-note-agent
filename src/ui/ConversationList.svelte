<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type ObsidianNoteAgentPlugin from "../main";
  export let plugin: ObsidianNoteAgentPlugin;

  const dispatch = createEventDispatcher<{ select: void; newChat: void }>();

  let paths: string[] = [];
  let active = plugin.currentConversation?.path ?? "";

  onMount(async () => { paths = await plugin.conversations.list(); });

  async function open(p: string) {
    await plugin.openConversation(p);
    active = p;
    dispatch("select");
  }

  async function remove(p: string, evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    if (!confirm(t("history.deleteConfirm"))) return;
    try {
      await plugin.conversations.delete(p);
    } catch (e) {
      console.error("Failed to delete conversation", e);
      return;
    }
    paths = paths.filter(x => x !== p);
    if (active === p) {
      await plugin.startNewConversation();
      active = "";
      dispatch("newChat");
    }
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

  const t = (k: string, v?: Record<string, string | number>) => plugin.i18n.t(k, v);

  // Sentinel group keys — resolved to localized strings at render time
  const GROUP_TODAY = "__today__";
  const GROUP_YESTERDAY = "__yesterday__";
  const GROUP_OLDER = "__older__";

  function groupKey(p: string): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const m = p.match(/(\d{4}-\d{2}-\d{2})/);
    if (!m) return GROUP_OLDER;
    if (m[1] === formatDate(today)) return GROUP_TODAY;
    if (m[1] === formatDate(yesterday)) return GROUP_YESTERDAY;
    return m[1];
  }

  function groupDisplay(key: string): string {
    if (key === GROUP_TODAY) return t("history.today");
    if (key === GROUP_YESTERDAY) return t("history.yesterday");
    if (key === GROUP_OLDER) return t("history.older");
    return key;
  }

  function rowDate(p: string, key: string): string {
    if (key === GROUP_TODAY || key === GROUP_YESTERDAY) return "";
    const m = p.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "";
    const date = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    try {
      return new Intl.DateTimeFormat(plugin.i18n.getLocale?.() ?? undefined, {
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return `${m[2]}-${m[3]}`;
    }
  }

  type Group = { key: string; label: string; paths: string[] };

  function groupPaths(ps: string[]): Group[] {
    const map = new Map<string, string[]>();
    for (const p of ps) {
      const k = groupKey(p);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    const pinned = [GROUP_TODAY, GROUP_YESTERDAY];
    const entries = [...map.entries()];
    entries.sort(([a], [b]) => {
      const ia = pinned.indexOf(a);
      const ib = pinned.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      if (a === GROUP_OLDER) return 1;
      if (b === GROUP_OLDER) return -1;
      return b.localeCompare(a);
    });
    return entries.map(([k, items]) => ({ key: k, label: groupDisplay(k), paths: items }));
  }

  $: groups = groupPaths(paths);
</script>

<div class="cl-root" role="navigation">
  {#if groups.length === 0}
    <div class="cl-empty">{t("history.empty")}</div>
  {:else}
    {#each groups as group (group.key)}
      <div class="cl-section-label">{group.label}</div>
      {#each group.paths as p (p)}
        {@const d = rowDate(p, group.key)}
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
          <span
            class="cl-delete"
            role="button"
            tabindex="0"
            on:click={(e) => remove(p, e)}
            on:keydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); remove(p, e); } }}
            title={t("history.delete")}
            aria-label={t("history.delete")}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
        </button>
      {/each}
    {/each}
  {/if}

  <button class="cl-new-btn" on:click={startNew}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    {t("history.newConversation")}
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
  .cl-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    color: var(--text-faint);
    flex-shrink: 0;
    opacity: 0;
    cursor: pointer;
    transition: opacity 120ms, background 120ms, color 120ms;
  }
  .cl-item:hover .cl-delete,
  .cl-item:focus-within .cl-delete { opacity: 1; }
  .cl-delete:hover {
    background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent);
    color: var(--color-red, #e53e3e);
  }
  .cl-delete:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 1px;
    opacity: 1;
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
