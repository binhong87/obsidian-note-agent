<script lang="ts">
  import { onDestroy } from "svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;

  let mode = plugin.settings.mode;
  let autoApprove = plugin.settings.autoApprove;

  const unsubSettings = plugin.onSettingsChange(() => {
    mode = plugin.settings.mode;
    autoApprove = plugin.settings.autoApprove;
  });
  onDestroy(unsubSettings);

  async function setMode(m: "ask" | "edit") {
    mode = m;
    plugin.settings.mode = m;
    plugin.currentConversation.mode = m;
    await plugin.saveSettings();
  }

  async function toggleAuto() {
    autoApprove = !autoApprove;
    plugin.settings.autoApprove = autoApprove;
    await plugin.saveSettings();
  }

  const t = (k: string) => plugin.i18n.t(k);
</script>

<div class="mt-wrap">
  <div class="mt-root" role="group" aria-label={t("chat.mode.aria")}>
    <button
      class="mt-option"
      class:mt-active={mode === "ask"}
      on:click={() => setMode("ask")}
      aria-pressed={mode === "ask"}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      {t("chat.mode.ask")}
    </button>
    <button
      class="mt-option"
      class:mt-active={mode === "edit"}
      on:click={() => setMode("edit")}
      aria-pressed={mode === "edit"}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      {t("chat.mode.edit")}
    </button>
  </div>

  {#if mode === "edit"}
    <button
      class="mt-auto"
      class:mt-auto-on={autoApprove}
      on:click={toggleAuto}
      aria-pressed={autoApprove}
      title={t("chat.autoApprove.tooltip")}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      {t("chat.autoApprove")}
    </button>
  {/if}
</div>

<style>
  .mt-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .mt-root {
    display: flex;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 7px;
    padding: 2px;
    gap: 1px;
  }
  .mt-option {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 500;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background: transparent;
    color: var(--text-muted);
    transition: background 150ms ease, color 150ms ease, transform 120ms ease;
    white-space: nowrap;
  }
  .mt-option:hover { color: var(--text-normal); background: var(--background-modifier-hover); }
  .mt-option:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .mt-option:active { transform: scale(0.97); }
  .mt-active {
    background: linear-gradient(
      135deg,
      var(--interactive-accent),
      color-mix(in srgb, var(--interactive-accent) 72%, #000)
    ) !important;
    color: var(--text-on-accent, #fff) !important;
    box-shadow: 0 1px 4px color-mix(in srgb, var(--interactive-accent) 40%, transparent);
  }

  /* Auto-approve toggle */
  .mt-auto {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 7px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 150ms ease, color 150ms ease, border-color 150ms ease, transform 120ms ease;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
  }
  .mt-auto:hover {
    color: var(--text-normal);
    border-color: var(--color-orange, #ed8936);
  }
  .mt-auto:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .mt-auto:active { transform: scale(0.97); }
  .mt-auto-on {
    background: color-mix(in srgb, var(--color-orange, #ed8936) 18%, transparent) !important;
    border-color: var(--color-orange, #ed8936) !important;
    color: var(--color-orange, #ed8936) !important;
  }
</style>
