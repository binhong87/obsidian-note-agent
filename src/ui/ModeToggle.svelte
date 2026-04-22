<script lang="ts">
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let mode = plugin.settings.mode;
  async function set(m: "ask" | "edit") {
    mode = m; plugin.settings.mode = m; plugin.currentConversation.mode = m;
    await plugin.saveSettings();
  }
</script>
<div>
  <button class:active={mode === "ask"} on:click={() => set("ask")}>{plugin.i18n.t("chat.mode.ask")}</button>
  <button class:active={mode === "edit"} on:click={() => set("edit")}>{plugin.i18n.t("chat.mode.edit")}</button>
</div>
<style>.active { font-weight: bold; }</style>
