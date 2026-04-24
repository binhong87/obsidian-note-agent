# Cursor/Document Chat UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the plugin chat UI from a bubble/card layout to a Cursor-style alternating-band document layout with VS Code-style code blocks and a grouped-by-date history drawer.

**Architecture:** Four targeted file changes — full rewrite of `MessageList.svelte` and `ConversationList.svelte`, an update to `markdown-action.ts` (replace floating copy button with a persistent header bar), and minor wiring in `ChatView.svelte`. All colors remain Obsidian CSS variables via `color-mix()` so the design adapts to any theme automatically.

**Tech Stack:** TypeScript 5.4, Svelte 4, esbuild, Obsidian plugin API (`MarkdownRenderer.render`, CSS variables)

---

### Task 1: Rewrite `MessageList.svelte` — alternating bands

**Files:**
- Modify: `src/ui/MessageList.svelte`

- [ ] **Step 1: Replace the full file contents**

Write `src/ui/MessageList.svelte` with the following (removes all bubbles/avatars, adds alternating bands + YOU/AGENT labels, scopes `:global()` rules to `.ml-turn-agent .ml-content`, adds VS Code code block header styles):

```svelte
<script lang="ts">
  import { afterUpdate } from "svelte";
  import DiffReviewBlock from "./DiffReviewBlock.svelte";
  import ChangeSummary from "./ChangeSummary.svelte";
  import { markdown } from "./markdown-action";
  import type ObsidianAgentPlugin from "../main";

  export let messages: any[];
  export let streamBuf: string;
  export let pending: any[];
  export let plugin: ObsidianAgentPlugin;

  let scrollEl: HTMLDivElement;
  let userScrolledUp = false;

  afterUpdate(() => {
    if (!userScrolledUp && scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  });

  function onScroll() {
    if (!scrollEl) return;
    userScrolledUp = (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) > 60;
  }

  function isError(content: string) { return content.startsWith("⚠"); }
</script>

<div class="ml-root" bind:this={scrollEl} on:scroll={onScroll} role="log" aria-live="polite" aria-label="Chat messages">

  {#if messages.filter(m => m.role === "user" || m.role === "assistant").length === 0 && !streamBuf}
    <div class="ml-empty">
      <div class="ml-empty-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <p class="ml-empty-title">Start a conversation</p>
      <p class="ml-empty-hint">Ask questions about your vault or switch to Edit mode to create and modify notes.</p>
    </div>
  {/if}

  {#each messages as m (m)}
    {#if m.role === "user"}
      <div class="ml-turn ml-turn-user">
        <div class="ml-name ml-name-user">You</div>
        <div class="ml-content">{m.content}</div>
      </div>

    {:else if m.role === "assistant"}
      <div class="ml-turn ml-turn-agent" class:ml-error={isError(m.content)}>
        <div class="ml-name ml-name-agent">Agent</div>
        {#if isError(m.content)}
          <div class="ml-content ml-content-error">{m.content}</div>
        {:else}
          <div class="ml-content" use:markdown={{ text: m.content, plugin }}></div>
        {/if}
      </div>

    {:else if m.role === "tool"}
      <div class="ml-tool-result">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="ml-tool-label">tool result</span>
      </div>
    {/if}
  {/each}

  {#if streamBuf}
    <div class="ml-turn ml-turn-agent">
      <div class="ml-name ml-name-agent">Agent</div>
      <div class="ml-content ml-streaming">{streamBuf}<span class="ml-cursor" aria-hidden="true"></span></div>
    </div>
  {/if}

  {#if pending.length}
    <div class="ml-pending-group">
      {#each pending as p (p.toolCallId)}
        <DiffReviewBlock {p} {plugin} />
      {/each}
      <div class="ml-bulk-actions">
        <button class="ml-bulk-btn ml-bulk-approve" on:click={() => plugin.approvalQueue.approveAll()}>
          {plugin.i18n.t("diff.applyAll")}
        </button>
        <button class="ml-bulk-btn ml-bulk-reject" on:click={() => plugin.approvalQueue.rejectAll()}>
          {plugin.i18n.t("diff.rejectAll")}
        </button>
      </div>
    </div>
  {/if}

  <ChangeSummary {plugin} />
</div>

<style>
  .ml-root {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scroll-behavior: smooth;
  }

  /* ── Empty state ── */
  .ml-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1;
    padding: 40px 28px;
    text-align: center;
  }
  .ml-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--interactive-accent) 12%, transparent);
    color: var(--interactive-accent);
    display: flex; align-items: center; justify-content: center;
  }
  .ml-empty-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-normal); }
  .ml-empty-hint { margin: 0; font-size: 12px; color: var(--text-faint); max-width: 220px; line-height: 1.6; }

  /* ── Alternating bands ── */
  .ml-turn {
    padding: 10px 13px;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .ml-turn-user {
    background: color-mix(in srgb, var(--interactive-accent) 6%, var(--background-primary));
  }
  .ml-turn-agent {
    background: var(--background-primary);
  }
  .ml-error.ml-turn-agent {
    background: color-mix(in srgb, var(--color-red, #e53e3e) 5%, var(--background-primary));
  }

  /* ── Name labels ── */
  .ml-name {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 5px;
  }
  .ml-name-user { color: var(--text-muted); }
  .ml-name-agent { color: var(--interactive-accent); }

  /* ── Content ── */
  .ml-content {
    font-size: var(--font-ui-small, 13px);
    line-height: 1.65;
    color: var(--text-normal);
    word-break: break-word;
  }
  .ml-turn-user .ml-content { white-space: pre-wrap; }
  .ml-content-error { color: var(--color-red, #e53e3e) !important; white-space: pre-wrap; }

  /* Streaming */
  .ml-streaming { white-space: pre-wrap; }
  .ml-cursor {
    display: inline-block; width: 2px; height: 1em;
    background: var(--interactive-accent);
    margin-left: 2px;
    vertical-align: text-bottom;
    border-radius: 1px;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  /* ── Tool result indicator ── */
  .ml-tool-result {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 13px;
    background: var(--background-primary);
    border-bottom: 1px solid var(--background-modifier-border);
    color: var(--text-faint);
    font-size: 11px;
  }
  .ml-tool-label { font-style: italic; }

  /* ── Pending diff group ── */
  .ml-pending-group {
    margin: 8px 12px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .ml-bulk-actions {
    display: flex; gap: 8px;
    padding: 8px 10px;
    background: var(--background-secondary);
    border-top: 1px solid var(--background-modifier-border);
  }
  .ml-bulk-btn {
    flex: 1; padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 500;
    transition: background 150ms, color 150ms, transform 100ms;
  }
  .ml-bulk-btn:active { transform: scale(0.97); }
  .ml-bulk-approve {
    background: color-mix(in srgb, var(--color-green, #48bb78) 15%, transparent);
    border: 1px solid var(--color-green, #48bb78);
    color: var(--color-green, #48bb78);
  }
  .ml-bulk-approve:hover { background: color-mix(in srgb, var(--color-green, #48bb78) 25%, transparent); }
  .ml-bulk-reject {
    background: transparent;
    border: 1px solid var(--color-red, #e53e3e);
    color: var(--color-red, #e53e3e);
  }
  .ml-bulk-reject:hover { background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent); }

  /* ── Markdown content (rendered inside agent turns) ── */
  .ml-turn-agent .ml-content :global(p) { margin: 0 0 8px; }
  .ml-turn-agent .ml-content :global(p:last-child) { margin-bottom: 0; }
  .ml-turn-agent .ml-content :global(h1) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1.2em; }
  .ml-turn-agent .ml-content :global(h2) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1.1em; }
  .ml-turn-agent .ml-content :global(h3) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-turn-agent .ml-content :global(h4) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-turn-agent .ml-content :global(h5) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-turn-agent .ml-content :global(h6) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-turn-agent .ml-content :global(ul) { padding-left: 20px; margin: 4px 0 8px; }
  .ml-turn-agent .ml-content :global(ol) { padding-left: 20px; margin: 4px 0 8px; }
  .ml-turn-agent .ml-content :global(li) { margin: 3px 0; }
  .ml-turn-agent .ml-content :global(li:last-child) { margin-bottom: 0; }
  .ml-turn-agent .ml-content :global(blockquote) {
    border-left: 3px solid var(--interactive-accent);
    margin: 8px 0; padding: 5px 12px;
    color: var(--text-muted);
    background: color-mix(in srgb, var(--interactive-accent) 6%, transparent);
    border-radius: 0 6px 6px 0;
  }
  .ml-turn-agent .ml-content :global(code:not(pre code)) {
    font-family: var(--font-monospace);
    font-size: 0.88em;
    background: color-mix(in srgb, var(--interactive-accent) 10%, var(--background-secondary));
    color: var(--text-accent);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .ml-turn-agent .ml-content :global(pre) {
    margin: 8px 0;
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--interactive-accent) 20%, var(--background-modifier-border));
  }
  .ml-turn-agent .ml-content :global(.ob-code-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 10px;
    background: color-mix(in srgb, var(--interactive-accent) 8%, var(--background-secondary));
    border-bottom: 1px solid color-mix(in srgb, var(--interactive-accent) 15%, var(--background-modifier-border));
  }
  .ml-turn-agent .ml-content :global(.ob-code-lang) {
    font-family: var(--font-monospace);
    font-size: 10px;
    color: var(--interactive-accent);
    letter-spacing: 0.02em;
  }
  .ml-turn-agent .ml-content :global(.ob-copy-btn) {
    font-size: 10px;
    font-weight: 500;
    font-family: var(--font-interface);
    background: transparent;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 1px 7px;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 120ms, color 120ms;
  }
  .ml-turn-agent .ml-content :global(.ob-copy-btn:hover) {
    background: var(--background-primary);
    color: var(--text-normal);
  }
  .ml-turn-agent .ml-content :global(pre code) {
    font-family: var(--font-monospace);
    font-size: 12px;
    line-height: 1.6;
    display: block;
    padding: 10px 12px;
    overflow-x: auto;
    background: color-mix(in srgb, var(--interactive-accent) 4%, var(--background-secondary)) !important;
  }
  .ml-turn-agent .ml-content :global(table) {
    border-collapse: collapse;
    width: 100%; margin: 8px 0; font-size: 12px;
  }
  .ml-turn-agent .ml-content :global(th) {
    border: 1px solid var(--background-modifier-border);
    padding: 5px 10px; text-align: left;
    background: var(--background-secondary); font-weight: 600;
  }
  .ml-turn-agent .ml-content :global(td) {
    border: 1px solid var(--background-modifier-border);
    padding: 5px 10px; text-align: left;
  }
  .ml-turn-agent .ml-content :global(a) { color: var(--text-accent); text-decoration: none; }
  .ml-turn-agent .ml-content :global(a:hover) { text-decoration: underline; }
  .ml-turn-agent .ml-content :global(hr) {
    border: none;
    border-top: 1px solid var(--background-modifier-border);
    margin: 10px 0;
  }
  .ml-turn-agent .ml-content :global(strong) { font-weight: 600; }
  .ml-turn-agent .ml-content :global(em) { font-style: italic; color: var(--text-muted); }
</style>
```

- [ ] **Step 2: Build to verify no compile errors**

Run: `npm run build`
Expected: exits 0, no TypeScript or Svelte errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/MessageList.svelte
git commit -m "feat: rewrite MessageList to alternating-band document layout"
```

---

### Task 2: Update `markdown-action.ts` — VS Code-style code block header

**Files:**
- Modify: `src/ui/markdown-action.ts`

The current `injectCopyButton` creates a floating button hidden until hover. The spec requires an always-visible header bar with the language name on the left and Copy button on the right, matching the mockup. The CSS for this header is in `MessageList.svelte` (Task 1); this task injects the DOM structure.

- [ ] **Step 1: Replace `injectCopyButton` with `injectCodeHeader`**

Write `src/ui/markdown-action.ts` with:

```typescript
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

  async function render(p: MarkdownParams) {
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
      });
    });

    header.appendChild(langLabel);
    header.appendChild(btn);
    pre.insertBefore(header, pre.firstChild);
  }

  render(params);

  return {
    update(newParams: MarkdownParams) { render(newParams); },
    destroy() { owner.unload(); },
  };
}
```

- [ ] **Step 2: Build to verify no compile errors**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/ui/markdown-action.ts
git commit -m "feat: replace hover copy button with always-visible VS Code-style code header"
```

---

### Task 3: Rewrite `ConversationList.svelte` — grouped-by-date history drawer

**Files:**
- Modify: `src/ui/ConversationList.svelte`

The current component renders a flat list. This task adds `groupPaths()` to bucket sessions into Today/Yesterday/date/Older groups, renders section labels, and adds a "New conversation" button pinned at the bottom. Events `select` and `newChat` are dispatched so `ChatView` can react.

- [ ] **Step 1: Replace the full file contents**

Write `src/ui/ConversationList.svelte` with:

```svelte
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

  async function startNew() {
    await plugin.startNewConversation();
    active = plugin.currentConversation?.path ?? "";
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
    return entries.map(([lbl, ps]) => ({ label: lbl, paths: ps }));
  }

  $: groups = groupPaths(paths);
</script>

<div class="cl-root" role="navigation" aria-label="Conversation history">
  {#if groups.length === 0}
    <div class="cl-empty">No saved conversations</div>
  {:else}
    {#each groups as group (group.label)}
      <div class="cl-section-label">{group.label}</div>
      {#each group.paths as p (p)}
        <button
          class="cl-item"
          class:cl-active={p === active}
          on:click={() => open(p)}
          title={p}
          aria-current={p === active ? "page" : undefined}
        >
          <svg class="cl-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="cl-label">{label(p)}</span>
          {#if rowDate(p, group.label)}
            <span class="cl-date">{rowDate(p, group.label)}</span>
          {/if}
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
    background: transparent;
    color: var(--interactive-accent);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 120ms;
  }
  .cl-new-btn:hover {
    background: color-mix(in srgb, var(--interactive-accent) 8%, transparent);
  }
</style>
```

- [ ] **Step 2: Build to verify no compile errors**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/ui/ConversationList.svelte
git commit -m "feat: date-grouped history drawer with New conversation button"
```

---

### Task 4: Update `ChatView.svelte` — wire conversation events + expand drawer height

**Files:**
- Modify: `src/ui/ChatView.svelte`

Three targeted edits: add a handler for the `select` event from `ConversationList` (refreshes message list and closes drawer), wire both events onto the component element, and bump the drawer `max-height` to match the spec.

- [ ] **Step 1: Add `onConversationSelect` handler**

After the `newChat` function (around line 60, before `function onKeydown`), add:

```typescript
async function onConversationSelect() {
  messages = plugin.currentConversation.messages.slice();
  showHistory = false;
}
```

- [ ] **Step 2: Wire events on `<ConversationList>`**

In the template, change (around line 102):
```svelte
<!-- before -->
<ConversationList {plugin} />
<!-- after -->
<ConversationList {plugin} on:select={onConversationSelect} on:newChat={newChat} />
```

- [ ] **Step 3: Expand history drawer max-height**

In the `<style>` block, change (inside `.ac-history-drawer`):
```css
/* before */
max-height: 200px;
/* after */
max-height: 220px;
```

- [ ] **Step 4: Build and run tests**

Run: `npm run build && npm test`
Expected: build exits 0, all 61 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/ui/ChatView.svelte
git commit -m "feat: wire ConversationList events, expand history drawer to 220px"
```

---

### Task 5: Build production bundle and commit artifacts

**Files:**
- Modify: `main.js`, `main.css`

- [ ] **Step 1: Final clean build**

Run: `npm run build`
Expected: exits 0, `main.js` and `main.css` updated in project root

- [ ] **Step 2: Force-add and commit build artifacts**

```bash
git add -f main.js main.css
git commit -m "build: production bundle for Cursor/document UI redesign"
```

---

## Post-Implementation Verification Checklist

Install `main.js` + `main.css` into `<vault>/.obsidian/plugins/obsidian-agent/`, reload Obsidian, then check:

1. **Alternating bands** — user turns have a faint accent tint, agent turns are plain background, clear `YOU` / `AGENT` labels in uppercase
2. **No bubbles/avatars** — full-width content, no rounded bubble shapes or circular avatars
3. **Code blocks** — header bar with language label (left, accent color, monospace) + always-visible Copy button (right); body is soft lavender (light) or dark tinted (dark); border-radius 7px
4. **Inline code** — accent-tinted background, accent text color
5. **Copy button** — clicking shows "✓ Copied" for 2 seconds then resets to "Copy"
6. **Light theme** — user bands show subtle accent tint, code blocks show soft lavender
7. **Dark theme** — same structure, code block body dark-tinted
8. **History drawer** — clock icon toggles it open/closed; sessions appear under Today / Yesterday / date / Older sections; clicking a session loads it and closes the drawer; "New conversation" button is pinned at the bottom with accent color
9. **Streaming** — blinking cursor at end of in-progress agent turn
10. **Edit mode** — diff blocks still show file chip, line numbers, approve/reject buttons (unchanged)
11. **Tests** — `npm test` passes 61/61
