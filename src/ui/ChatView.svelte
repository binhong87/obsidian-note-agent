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

  const unsub = plugin.approvalQueue.onChange(list => pending = list);
  onDestroy(unsub);

  async function send() {
    if (!input.trim() || busy) return;
    busy = true; const text = input; input = ""; streamBuf = "";
    try {
      for await (const evt of plugin.sendMessage(text)) {
        if (evt.type === "text") { streamBuf += (evt as any).text; messages = [...plugin.currentConversation.messages]; }
        else if (evt.type === "applied" || evt.type === "rejected" || evt.type === "tool" || evt.type === "done" || evt.type === "stopped") {
          messages = [...plugin.currentConversation.messages]; streamBuf = "";
        } else if (evt.type === "error") { messages = [...messages, { role: "assistant", content: `⚠ ${(evt as any).error.message}` }]; }
        await tick();
      }
    } finally { busy = false; streamBuf = ""; messages = [...plugin.currentConversation.messages]; }
  }

  function cancel() { plugin.cancelCurrentTurn(); }
  async function newChat() { await plugin.startNewConversation(); messages = plugin.currentConversation.messages.slice(); }

  const t = (k: string, v?: any) => plugin.i18n.t(k, v);
</script>

<div class="agent-chat">
  <div class="agent-top">
    <button on:click={newChat}>{t("chat.new")}</button>
    <ModeToggle {plugin} />
  </div>
  <ConversationList {plugin} />
  <MessageList {messages} {streamBuf} {pending} {plugin} />
  <div class="agent-input">
    <textarea bind:value={input} placeholder="..." disabled={busy} on:keydown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}></textarea>
    {#if busy}
      <button on:click={cancel}>{t("chat.cancel")}</button>
    {:else}
      <button on:click={send}>{t("chat.send")}</button>
    {/if}
  </div>
</div>

<style>
  .agent-chat { display: flex; flex-direction: column; height: 100%; gap: 0.5rem; padding: 0.5rem; }
  .agent-top { display: flex; gap: 0.5rem; }
  .agent-input { display: flex; gap: 0.25rem; }
  .agent-input textarea { flex: 1; min-height: 3rem; }
</style>
