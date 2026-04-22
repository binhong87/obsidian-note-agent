<script lang="ts">
  import { onMount } from "svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let paths: string[] = [];
  onMount(async () => { paths = await plugin.conversations.list(); });
  async function open(p: string) { await plugin.openConversation(p); }
</script>
<details><summary>History ({paths.length})</summary>
  <ul>{#each paths as p}<li><button class="conv-item" on:click={() => open(p)}>{p.split("/").pop()}</button></li>{/each}</ul>
</details>
<style>
  .conv-item { background: none; border: none; cursor: pointer; padding: 0; color: var(--text-accent); text-align: left; }
  .conv-item:hover { text-decoration: underline; }
</style>
