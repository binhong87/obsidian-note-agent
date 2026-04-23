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

  // Build a lookup from toolCallId → ToolCall so tool result rows can show the tool name + args
  $: toolCallMap = new Map<string, { name: string; args: Record<string, unknown> }>(
    messages
      .filter((m: any) => m.role === "assistant" && m.toolCalls?.length)
      .flatMap((m: any) => m.toolCalls.map((tc: any) => [tc.id, tc]))
  );

  function firstArgHint(args: Record<string, unknown>): string {
    const val = Object.values(args ?? {})[0];
    if (!val) return "";
    const s = String(val);
    return s.length > 40 ? s.slice(0, 40) + "…" : s;
  }

  function previewResult(content: string): string {
    try {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        if (json.length === 0) return "no results";
        const label = json[0]?.path !== undefined ? "note" : "item";
        return `${json.length} ${label}${json.length === 1 ? "" : "s"}`;
      }
      if (json && typeof json === "object") {
        if ("error" in json) return `error: ${String(json.error).slice(0, 60)}`;
        if ("status" in json) return String(json.status);
      }
      if (typeof json === "string") return json.slice(0, 80);
    } catch { /* not JSON */ }
    return content.length > 80 ? content.slice(0, 80) + "…" : content;
  }
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
      {@const tc = toolCallMap.get(m.toolCallId ?? "")}
      <div class="ml-tool-result" title={m.content}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="ml-tool-name">{tc?.name ?? "tool"}</span>
        {#if tc?.args && firstArgHint(tc.args)}
          <span class="ml-tool-arg">"{firstArgHint(tc.args)}"</span>
        {/if}
        <span class="ml-tool-sep">→</span>
        <span class="ml-tool-preview">{previewResult(m.content)}</span>
      </div>
    {/if}
  {/each}

  {#if streamBuf}
    <div class="ml-turn ml-turn-agent">
      <div class="ml-name ml-name-agent">Agent</div>
      <div class="ml-content" use:markdown={{ text: streamBuf, plugin }}></div>
      <span class="ml-cursor" aria-hidden="true"></span>
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
    /* Override Obsidian's global user-select: none */
    user-select: text;
    -webkit-user-select: text;
  }
  /* Ensure all descendants are selectable too (Obsidian sets * { user-select: none }) */
  .ml-root :global(*) {
    user-select: text;
    -webkit-user-select: text;
  }
  /* Buttons inside the chat should not be selectable */
  .ml-root :global(button) {
    user-select: none;
    -webkit-user-select: none;
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
  .ml-cursor {
    display: inline-block; width: 2px; height: 1em;
    background: var(--interactive-accent);
    margin-top: 2px;
    vertical-align: text-bottom;
    border-radius: 1px;
    animation: ml-blink 1s step-end infinite;
  }
  @keyframes ml-blink { 50% { opacity: 0; } }

  /* ── Tool result indicator ── */
  .ml-tool-result {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 13px;
    background: var(--background-primary);
    border-bottom: 1px solid var(--background-modifier-border);
    color: var(--text-faint);
    font-size: 11px;
    font-family: var(--font-monospace);
    overflow: hidden;
  }
  .ml-tool-name {
    color: var(--interactive-accent);
    font-weight: 600;
    flex-shrink: 0;
  }
  .ml-tool-arg {
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
  }
  .ml-tool-sep {
    color: var(--text-faint);
    flex-shrink: 0;
  }
  .ml-tool-preview {
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

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
  .ml-turn-agent .ml-content :global(pre) :global(code) {
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
