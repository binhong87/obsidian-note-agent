<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import MessageList from "./MessageList.svelte";
  import ModeToggle from "./ModeToggle.svelte";
  import ConversationList from "./ConversationList.svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;

  let input = "";
  let busy = false;
  let pending = plugin.approvalQueue.list();
  let messages = plugin.currentConversation.messages.slice();
  let streamBuf = "";
  let textarea: HTMLTextAreaElement;
  let showHistory = false;

  const unsub = plugin.approvalQueue.onChange(list => (pending = list));
  onDestroy(unsub);

  function autoResize() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }

  async function send() {
    if (!input.trim() || busy) return;
    busy = true;
    const text = input;
    input = "";
    streamBuf = "";
    await tick();
    autoResize();
    try {
      for await (const evt of plugin.sendMessage(text)) {
        if (evt.type === "text") {
          streamBuf += (evt as any).text;
          messages = [...plugin.currentConversation.messages];
        } else if (["applied","rejected","tool","done","stopped"].includes(evt.type)) {
          messages = [...plugin.currentConversation.messages];
          streamBuf = "";
        } else if (evt.type === "error") {
          messages = [...messages, { role: "assistant", content: `⚠ ${(evt as any).error.message}` }];
        }
        await tick();
      }
    } finally {
      busy = false;
      streamBuf = "";
      messages = [...plugin.currentConversation.messages];
    }
  }

  function cancel() { plugin.cancelCurrentTurn(); }

  async function newChat() {
    await plugin.startNewConversation();
    messages = plugin.currentConversation.messages.slice();
    showHistory = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
  }

  const t = (k: string, v?: any) => plugin.i18n.t(k, v);
  $: providerLabel = `${plugin.settings.providerId}/${plugin.settings.model || "–"}`;
</script>

<div class="ac-shell">
  <!-- Header -->
  <div class="ac-header">
    <button
      class="ac-btn ac-btn-ghost ac-history-toggle"
      on:click={() => (showHistory = !showHistory)}
      title="Conversation history"
      aria-expanded={showHistory}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </button>

    <span class="ac-provider-chip" title="Active provider / model">{providerLabel}</span>

    <div class="ac-header-right">
      <ModeToggle {plugin} />
      <button class="ac-btn ac-btn-ghost" on:click={newChat} title={t("chat.new")} aria-label={t("chat.new")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  </div>

  <!-- History drawer -->
  {#if showHistory}
    <div class="ac-history-drawer">
      <ConversationList {plugin} />
    </div>
  {/if}

  <!-- Message area -->
  <MessageList {messages} {streamBuf} {pending} {plugin} />

  <!-- Input area -->
  <div class="ac-input-wrap">
    <div class="ac-input-box" class:busy>
      <textarea
        bind:this={textarea}
        bind:value={input}
        placeholder={busy ? "" : t("chat.placeholder") || "Ask anything… (Ctrl+Enter)"}
        disabled={busy}
        rows="1"
        on:input={autoResize}
        on:keydown={onKeydown}
        aria-label="Chat input"
      ></textarea>

      <div class="ac-input-actions">
        {#if busy}
          <button class="ac-btn ac-btn-stop" on:click={cancel} title={t("chat.cancel")} aria-label={t("chat.cancel")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          </button>
        {:else}
          <button
            class="ac-btn ac-btn-send"
            on:click={send}
            disabled={!input.trim()}
            title={t("chat.send")}
            aria-label={t("chat.send")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .ac-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    font-size: var(--font-ui-small, 13px);
    background: var(--background-primary);
    color: var(--text-normal);
  }

  /* ── Header ── */
  .ac-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
    min-height: 36px;
  }
  .ac-header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .ac-provider-chip {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    padding: 1px 7px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
    cursor: default;
  }
  .ac-history-toggle {
    color: var(--text-muted);
  }

  /* ── History drawer ── */
  .ac-history-drawer {
    border-bottom: 1px solid var(--background-modifier-border);
    max-height: 180px;
    overflow-y: auto;
    flex-shrink: 0;
    background: var(--background-secondary);
  }

  /* ── Shared button base ── */
  .ac-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    padding: 5px;
    background: transparent;
    color: var(--text-normal);
    transition: background 150ms ease, color 150ms ease;
    flex-shrink: 0;
    line-height: 1;
  }
  .ac-btn:hover { background: var(--background-modifier-hover); }
  .ac-btn:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .ac-btn-ghost { color: var(--text-muted); }
  .ac-btn-ghost:hover { color: var(--text-normal); }

  .ac-btn-send {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    border-radius: 6px;
    padding: 5px 6px;
    width: 28px;
    height: 28px;
  }
  .ac-btn-send:hover { background: var(--interactive-accent-hover); }
  .ac-btn-send:disabled {
    background: var(--background-modifier-border);
    color: var(--text-muted);
    cursor: not-allowed;
  }
  .ac-btn-stop {
    background: var(--background-modifier-error, #e53e3e22);
    color: var(--text-error, #e53e3e);
    border-radius: 6px;
    width: 28px;
    height: 28px;
  }
  .ac-btn-stop:hover { background: var(--background-modifier-error-hover, #e53e3e44); }

  /* ── Input area ── */
  .ac-input-wrap {
    padding: 8px 10px 10px;
    flex-shrink: 0;
  }
  .ac-input-box {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    background: var(--background-primary-alt);
    padding: 6px 8px 6px 10px;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .ac-input-box:focus-within {
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--interactive-accent) 20%, transparent);
  }
  .ac-input-box.busy {
    opacity: 0.7;
    border-color: var(--background-modifier-border);
    box-shadow: none;
  }
  .ac-input-box textarea {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-normal);
    font-size: var(--font-ui-small, 13px);
    font-family: var(--font-interface);
    line-height: 1.5;
    resize: none;
    outline: none;
    min-height: 22px;
    max-height: 200px;
    padding: 0;
    box-shadow: none;
  }
  .ac-input-box textarea::placeholder { color: var(--text-faint); }
  .ac-input-actions { display: flex; align-items: flex-end; padding-bottom: 1px; }
</style>
