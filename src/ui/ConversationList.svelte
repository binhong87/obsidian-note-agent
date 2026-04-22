<script lang="ts">
  import { onMount } from "svelte";
  import type ObsidianAgentPlugin from "../main";
  export let plugin: ObsidianAgentPlugin;
  let paths: string[] = [];
  onMount(async () => { paths = await plugin.conversations.list(); });
  async function open(p: string) { await plugin.openConversation(p); }
</script>
<details><summary>History ({paths.length})</summary>
  <ul>{#each paths as p}<li><a on:click|preventDefault={() => open(p)} href="#">{p.split("/").pop()}</a></li>{/each}</ul>
</details>
