<script lang="ts">
  import { afterUpdate } from "svelte";
  import DiffReviewBlock from "./DiffReviewBlock.svelte";
  import ChangeSummary from "./ChangeSummary.svelte";
  import type ObsidianAgentPlugin from "../main";

  export let messages: any[];
  export let streamBuf: string;
  export let pending: any[];
  export let plugin: ObsidianAgentPlugin;

  let scrollEl: HTMLDivElement;
  let userScrolledUp = false;

  afterUpdate(() => {
    if (!userScrolledUp && scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  });

  function onScroll() {
    if (!scrollEl) return;
    const distFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    userScrolledUp = distFromBottom > 60;
  }

  // Detect if message content starts with ⚠
  function isError(content: string) { return content.startsWith("⚠"); }
</script>

<div class="ml-root" bind:this={scrollEl} on:scroll={onScroll} role="log" aria-live="polite" aria-label="Chat messages">

  {#if messages.filter(m => m.role === "user" || m.role === "assistant").length === 0 && !streamBuf}
    <div class="ml-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ml-empty-icon"><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2"/><path d="M12 8v4l3 3"/></svg>
      <p>Start a conversation</p>
      <p class="ml-empty-hint">Ask questions about your vault or switch to Edit mode to create and modify notes.</p>
    </div>
  {/if}

  {#each messages as m (m)}
    {#if m.role === "user"}
      <div class="ml-msg ml-user">
        <div class="ml-avatar ml-avatar-user" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
        </div>
        <div class="ml-bubble ml-bubble-user">{m.content}</div>
      </div>

    {:else if m.role === "assistant"}
      <div class="ml-msg ml-assistant" class:ml-error={isError(m.content)}>
        <div class="ml-avatar ml-avatar-bot" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="ml-bubble ml-bubble-bot">{m.content}</div>
      </div>

    {:else if m.role === "tool"}
      <div class="ml-tool-result">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="ml-tool-label">tool result</span>
      </div>
    {/if}
  {/each}

  <!-- Streaming assistant turn -->
  {#if streamBuf}
    <div class="ml-msg ml-assistant">
      <div class="ml-avatar ml-avatar-bot" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <div class="ml-bubble ml-bubble-bot ml-streaming">
        {streamBuf}<span class="ml-cursor" aria-hidden="true"></span>
      </div>
    </div>
  {/if}

  <!-- Pending writes (diff approval) -->
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
    padding: 8px 0;
    scroll-behavior: smooth;
  }

  /* ── Empty state ── */
  .ml-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1;
    padding: 32px 24px;
    text-align: center;
    color: var(--text-muted);
  }
  .ml-empty-icon { opacity: 0.4; }
  .ml-empty p { margin: 0; font-size: 13px; }
  .ml-empty-hint { font-size: 12px; color: var(--text-faint); max-width: 220px; line-height: 1.5; }

  /* ── Message row ── */
  .ml-msg {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 4px 12px;
  }
  .ml-msg:hover { background: var(--background-modifier-hover); }

  /* ── Avatars ── */
  .ml-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .ml-avatar-user {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
  }
  .ml-avatar-bot {
    background: var(--background-secondary);
    color: var(--text-accent);
    border: 1px solid var(--background-modifier-border);
  }

  /* ── Bubbles ── */
  .ml-bubble {
    flex: 1;
    font-size: var(--font-ui-small, 13px);
    line-height: 1.6;
    color: var(--text-normal);
    word-break: break-word;
    white-space: pre-wrap;
    padding: 4px 0;
    min-width: 0;
  }
  .ml-bubble-user {
    background: var(--background-secondary);
    border-radius: 0 8px 8px 8px;
    padding: 7px 10px;
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border);
  }
  .ml-bubble-bot { padding: 4px 2px; }

  /* Error state */
  .ml-error .ml-bubble { color: var(--text-error, #e53e3e); }
  .ml-error .ml-avatar-bot { background: var(--background-modifier-error, #e53e3e22); color: var(--text-error, #e53e3e); }

  /* ── Streaming cursor ── */
  .ml-streaming { position: relative; }
  .ml-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--text-accent);
    margin-left: 2px;
    vertical-align: text-bottom;
    border-radius: 1px;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  /* ── Tool result indicator ── */
  .ml-tool-result {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 12px 3px 42px;
    color: var(--text-faint);
    font-size: 11px;
  }
  .ml-tool-label { font-style: italic; }

  /* ── Pending writes ── */
  .ml-pending-group {
    margin: 8px 12px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    overflow: hidden;
  }
  .ml-bulk-actions {
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    background: var(--background-secondary);
    border-top: 1px solid var(--background-modifier-border);
  }
  .ml-bulk-btn {
    flex: 1;
    padding: 5px 10px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    background: var(--background-primary);
    color: var(--text-normal);
    transition: background 150ms, color 150ms;
  }
  .ml-bulk-approve { border-color: var(--color-green, #48bb78); color: var(--color-green, #48bb78); }
  .ml-bulk-approve:hover { background: color-mix(in srgb, var(--color-green, #48bb78) 15%, transparent); }
  .ml-bulk-reject { border-color: var(--color-red, #e53e3e); color: var(--color-red, #e53e3e); }
  .ml-bulk-reject:hover { background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent); }
</style>
