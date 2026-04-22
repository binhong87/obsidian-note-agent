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
      <div class="ml-msg ml-user">
        <div class="ml-bubble ml-bubble-user">{m.content}</div>
        <div class="ml-avatar ml-avatar-user" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
        </div>
      </div>

    {:else if m.role === "assistant"}
      <div class="ml-msg ml-assistant" class:ml-error={isError(m.content)}>
        <div class="ml-avatar ml-avatar-bot" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        {#if isError(m.content)}
          <div class="ml-bubble ml-bubble-bot ml-bubble-error">{m.content}</div>
        {:else}
          <div class="ml-bubble ml-bubble-bot" use:markdown={{ text: m.content, plugin }}></div>
        {/if}
      </div>

    {:else if m.role === "tool"}
      <div class="ml-tool-result">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="ml-tool-label">tool result</span>
      </div>
    {/if}
  {/each}

  <!-- Streaming (plain text — no markdown flicker during generation) -->
  {#if streamBuf}
    <div class="ml-msg ml-assistant">
      <div class="ml-avatar ml-avatar-bot" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <div class="ml-bubble ml-bubble-bot ml-streaming">
        {streamBuf}<span class="ml-cursor" aria-hidden="true"></span>
      </div>
    </div>
  {/if}

  <!-- Pending writes -->
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
    gap: 2px;
    padding: 12px 0 4px;
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

  /* ── Message rows ── */
  .ml-msg {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 3px 12px;
    animation: ml-fadein 180ms ease-out both;
  }
  @keyframes ml-fadein {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) { .ml-msg { animation: none; } }

  .ml-user { flex-direction: row-reverse; }

  /* ── Avatars ── */
  .ml-avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ml-avatar-user {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
  }
  .ml-avatar-bot {
    background: var(--background-secondary);
    color: var(--interactive-accent);
    border: 1px solid var(--background-modifier-border);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--interactive-accent) 15%, transparent);
  }

  /* ── Bubbles ── */
  .ml-bubble {
    font-size: var(--font-ui-small, 13px);
    line-height: 1.65;
    word-break: break-word;
    min-width: 0;
  }
  .ml-bubble-user {
    background: linear-gradient(
      135deg,
      var(--interactive-accent),
      color-mix(in srgb, var(--interactive-accent) 72%, #000)
    );
    color: var(--text-on-accent, #fff);
    border-radius: 16px 16px 4px 16px;
    padding: 9px 13px;
    max-width: 78%;
    white-space: pre-wrap;
    box-shadow: 0 2px 10px color-mix(in srgb, var(--interactive-accent) 30%, transparent);
  }
  .ml-bubble-bot {
    background: var(--background-primary-alt);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px 16px 16px 16px;
    padding: 10px 14px;
    max-width: 88%;
    color: var(--text-normal);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  }

  /* Error state */
  .ml-error .ml-avatar-bot {
    background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent);
    color: var(--color-red, #e53e3e);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent);
  }
  .ml-bubble-error { color: var(--text-error, #e53e3e) !important; white-space: pre-wrap; }

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
    padding: 2px 12px 2px 46px;
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

  /* ── Markdown content styles (rendered inside .ml-bubble-bot) ── */
  .ml-bubble-bot :global(p) { margin: 0 0 8px; }
  .ml-bubble-bot :global(p:last-child) { margin-bottom: 0; }
  .ml-bubble-bot :global(h1) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1.2em; }
  .ml-bubble-bot :global(h2) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1.1em; }
  .ml-bubble-bot :global(h3) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-bubble-bot :global(h4) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-bubble-bot :global(h5) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-bubble-bot :global(h6) { margin: 14px 0 5px; font-weight: 600; color: var(--text-normal); line-height: 1.3; font-size: 1em; }
  .ml-bubble-bot :global(ul) { padding-left: 20px; margin: 4px 0 8px; }
  .ml-bubble-bot :global(ol) { padding-left: 20px; margin: 4px 0 8px; }
  .ml-bubble-bot :global(li) { margin: 3px 0; }
  .ml-bubble-bot :global(li:last-child) { margin-bottom: 0; }
  .ml-bubble-bot :global(blockquote) {
    border-left: 3px solid var(--interactive-accent);
    margin: 8px 0; padding: 5px 12px;
    color: var(--text-muted);
    background: color-mix(in srgb, var(--interactive-accent) 6%, transparent);
    border-radius: 0 6px 6px 0;
  }
  .ml-bubble-bot :global(code:not(pre code)) {
    font-family: var(--font-monospace);
    font-size: 0.88em;
    background: color-mix(in srgb, var(--interactive-accent) 10%, var(--background-secondary));
    color: var(--text-accent);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .ml-bubble-bot :global(pre) {
    position: relative;
    margin: 8px 0;
    border-radius: 8px;
    overflow: hidden;
    background: var(--code-background, var(--background-secondary)) !important;
    border: 1px solid var(--background-modifier-border);
  }
  .ml-bubble-bot :global(pre code) {
    font-family: var(--font-monospace);
    font-size: 12px;
    line-height: 1.6;
    display: block;
    padding: 12px 14px;
    overflow-x: auto;
    background: transparent !important;
  }
  /* Copy button */
  .ml-bubble-bot :global(.ob-copy-btn) {
    position: absolute;
    top: 6px; right: 6px;
    padding: 2px 8px;
    font-size: 10px; font-weight: 500;
    font-family: var(--font-interface);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: opacity 150ms, background 150ms;
  }
  .ml-bubble-bot :global(pre:hover .ob-copy-btn) { opacity: 1; }
  .ml-bubble-bot :global(.ob-copy-btn:hover) {
    background: var(--background-secondary);
    color: var(--text-normal);
  }
  /* Tables */
  .ml-bubble-bot :global(table) {
    border-collapse: collapse;
    width: 100%; margin: 8px 0; font-size: 12px;
  }
  .ml-bubble-bot :global(th) {
    border: 1px solid var(--background-modifier-border);
    padding: 5px 10px; text-align: left;
    background: var(--background-secondary); font-weight: 600;
  }
  .ml-bubble-bot :global(td) {
    border: 1px solid var(--background-modifier-border);
    padding: 5px 10px; text-align: left;
  }
  .ml-bubble-bot :global(a) { color: var(--text-accent); text-decoration: none; }
  .ml-bubble-bot :global(a:hover) { text-decoration: underline; }
  .ml-bubble-bot :global(hr) {
    border: none;
    border-top: 1px solid var(--background-modifier-border);
    margin: 10px 0;
  }
  .ml-bubble-bot :global(strong) { font-weight: 600; }
  .ml-bubble-bot :global(em) { font-style: italic; color: var(--text-muted); }
</style>
