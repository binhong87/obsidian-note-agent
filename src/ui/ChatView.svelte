<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import MessageList from "./MessageList.svelte";
  import ModeToggle from "./ModeToggle.svelte";
  import ConversationList from "./ConversationList.svelte";
  import type ObsidianNoteAgentPlugin from "../main";
  import { activeProfile } from "../settings";
  export let plugin: ObsidianNoteAgentPlugin;

  let input = "";
  let busy = false;
  let pending = plugin.approvalQueue.list();
  let messages = plugin.currentConversation.messages.slice();
  let streamBuf = "";
  let compacting = plugin.compacting;
  let textarea: HTMLTextAreaElement;
  let showHistory = false;

  const unsub = plugin.approvalQueue.onChange(list => {
    pending = list;
  });
  const unsubCompacting = plugin.onCompactingChange(v => { compacting = v; });
  let settingsTick = 0;
  const unsubSettings = plugin.onSettingsChange(() => { settingsTick++; });
  onDestroy(unsub);
  onDestroy(unsubCompacting);
  onDestroy(unsubSettings);

  function autoResize() {
    if (!textarea) return;
    textarea.style.height = `auto`;
    textarea.style.height = Math.min(Math.max(textarea.scrollHeight, 66), 200) + "px";
  }

  async function send() {
    if (!input.trim() || busy) return;
    busy = true;
    const text = input;
    input = "";
    streamBuf = "";
    let errorMsg: string | null = null;
    await tick();
    autoResize();

    // Show user message immediately — don't wait for the first network event
    messages = [...messages, { role: "user", content: text }];
    await tick();

    try {
      for await (const evt of plugin.sendMessage(text)) {
        if (evt.type === "text") {
          streamBuf += (evt as { type: string; text: string }).text;
          // Don't sync messages here — streamBuf drives the live streaming view
        } else if (["tool","pending","done","stopped"].includes(evt.type)) {
          messages = [...plugin.currentConversation.messages];
          streamBuf = "";
        } else if (evt.type === "error") {
          errorMsg = `⚠ ${(evt as { type: string; error?: { message?: string } }).error?.message ?? "Unknown error"}`;
        }
        await tick();
      }
    } finally {
      busy = false;
      streamBuf = "";
      messages = [...plugin.currentConversation.messages];
      if (errorMsg) messages = [...messages, { role: "assistant", content: errorMsg }];
    }
  }

  function cancel() { plugin.cancelCurrentTurn(); }

  async function newChat() {
    await plugin.startNewConversation();
    messages = plugin.currentConversation.messages.slice();
    showHistory = false;
  }

  async function onConversationSelect() {
    messages = plugin.currentConversation.messages.slice();
    showHistory = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const t = (k: string, v?: Record<string, string | number>) => plugin.i18n.t(k, v);

  function openSettings() {
    const s = (plugin.app as Record<string, unknown>).setting as Record<string, unknown> | undefined;
    if (!s) return;
    const openFn = s["open"];
    const openByIdFn = s["openTabById"];
    if (typeof openFn === "function") Reflect.apply(openFn, s, []);
    if (typeof openByIdFn === "function") Reflect.apply(openByIdFn, s, [plugin.manifest.id]);
  }
  $: providerLabel = (settingsTick, `${plugin.i18n.t(`provider.${plugin.settings.providerId}`)}:${activeProfile(plugin.settings).model}`);
  $: charCount = input.length;
  $: showCharCount = charCount > 500;
</script>

<div class="ac-shell">
  <!-- Header -->
  <div class="ac-header">
    <button
      class="ac-btn ac-btn-ghost ac-history-toggle"
      class:ac-history-active={showHistory}
      on:click={() => (showHistory = !showHistory)}
      aria-expanded={showHistory}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </button>

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
      <ConversationList {plugin} on:select={onConversationSelect} on:newChat={newChat} />
    </div>
  {/if}

  <!-- Message area -->
  <MessageList {messages} {streamBuf} {pending} {plugin} {busy} {compacting} />

  <!-- Input area -->
  <div class="ac-input-wrap">
    <div class="ac-input-box" class:busy>
      <textarea
        bind:this={textarea}
        bind:value={input}
        placeholder={busy ? "" : t("chat.placeholder")}
        disabled={busy}
        rows="3"
        on:input={autoResize}
        on:keydown={onKeydown}
      ></textarea>

      <div class="ac-input-footer">
        <button class="ac-provider-chip" on:click={openSettings} title={t("chat.providerChip")} type="button">
          <span class="ac-provider-dot" aria-hidden="true"></span>
          {providerLabel}
        </button>
        <div class="ac-input-actions-wrap">
          {#if showCharCount}
            <span class="ac-char-count" class:ac-char-warn={charCount > 2000}>{charCount}</span>
          {/if}
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
    background: color-mix(in srgb, var(--background-primary) 88%, transparent);
    backdrop-filter: blur(8px) saturate(1.2);
    -webkit-backdrop-filter: blur(8px) saturate(1.2);
    border-bottom: 1px solid color-mix(in srgb, var(--background-modifier-border) 70%, transparent);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
    min-height: 38px;
    position: relative;
    z-index: 10;
  }
  .ac-header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .ac-provider-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-muted);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    padding: 2px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    cursor: pointer;
    font-family: inherit;
    line-height: 1.4;
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  }
  .ac-provider-chip:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    border-color: color-mix(in srgb, var(--interactive-accent) 40%, var(--background-modifier-border));
  }
  .ac-provider-chip:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 1px;
  }
  .ac-provider-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--color-green, #48bb78);
    flex-shrink: 0;
    box-shadow: 0 0 4px color-mix(in srgb, var(--color-green, #48bb78) 60%, transparent);
  }
  .ac-history-toggle { color: var(--text-muted); }
  .ac-history-active {
    color: var(--interactive-accent) !important;
    background: color-mix(in srgb, var(--interactive-accent) 12%, transparent) !important;
  }

  /* ── History drawer ── */
  .ac-history-drawer {
    border-bottom: 1px solid var(--background-modifier-border);
    max-height: 220px;
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
    transition: background 150ms ease, color 150ms ease, transform 120ms ease;
    flex-shrink: 0;
    line-height: 1;
  }
  .ac-btn:hover { background: var(--background-modifier-hover); }
  .ac-btn:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .ac-btn-ghost { color: var(--text-muted); }
  .ac-btn-ghost:hover { color: var(--text-normal); }

  .ac-btn-send {
    background: linear-gradient(
      135deg,
      var(--interactive-accent),
      color-mix(in srgb, var(--interactive-accent) 72%, #000)
    );
    color: var(--text-on-accent, #fff);
    border-radius: 7px;
    padding: 5px 6px;
    width: 28px; height: 28px;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--interactive-accent) 35%, transparent);
    transition: transform 120ms ease, box-shadow 120ms ease, opacity 150ms;
  }
  .ac-btn-send:not(:disabled):hover {
    transform: scale(1.06);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--interactive-accent) 45%, transparent);
  }
  .ac-btn-send:disabled {
    background: var(--background-modifier-border);
    color: var(--text-muted);
    cursor: not-allowed;
    box-shadow: none;
  }
  .ac-btn-stop {
    background: color-mix(in srgb, var(--color-red, #e53e3e) 15%, transparent);
    color: var(--color-red, #e53e3e);
    border-radius: 7px;
    width: 28px; height: 28px;
    border: 1px solid color-mix(in srgb, var(--color-red, #e53e3e) 40%, transparent);
  }
  .ac-btn-stop:hover { background: color-mix(in srgb, var(--color-red, #e53e3e) 25%, transparent); }

  /* ── Input area ── */
  .ac-input-wrap {
    padding: 8px 10px 10px;
    flex-shrink: 0;
  }
  .ac-input-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    background: var(--background-primary-alt);
    padding: 8px 8px 6px 12px;
    transition: border-color 200ms ease, box-shadow 200ms ease;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  }
  .ac-input-box:focus-within {
    border-color: var(--interactive-accent);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--interactive-accent) 20%, transparent),
      0 2px 10px rgba(0, 0, 0, 0.08);
  }
  .ac-input-box.busy {
    opacity: 0.65;
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
    min-height: 66px;
    max-height: 200px;
    padding: 0;
    box-shadow: none;
  }
  .ac-input-box textarea::placeholder { color: var(--text-faint); }

  .ac-input-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ac-input-actions-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .ac-input-actions { display: flex; align-items: center; }
  .ac-char-count {
    font-size: 10px;
    color: var(--text-faint);
    font-family: var(--font-monospace);
    line-height: 1;
    padding-bottom: 2px;
  }
  .ac-char-warn { color: var(--color-orange, #ed8936); }
</style>
