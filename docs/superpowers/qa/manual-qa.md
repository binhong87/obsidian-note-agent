# Obsidian Agent — Manual QA Checklist

## Install

- [ ] Copy `main.js`, `manifest.json`, (optional `styles.css`) into `<vault>/.obsidian/plugins/obsidian-agent/`.
- [ ] Enable in Community Plugins.
- [ ] Agent icon appears in the left ribbon; clicking opens the right-sidebar chat.

## Provider smoke tests (repeat for each enabled provider)

For each of: openai, anthropic, ollama, openrouter, deepseek, qwen, kimi, zhipu, minimax

- [ ] Settings → pick provider, enter key, enter model.
- [ ] Ask mode: send "summarize my vault". Confirm streaming appears.
- [ ] Confirm a tool call (search_vault / read_note) fires — message list shows a tool turn.
- [ ] Wrong key → error toast says "Authentication failed. Check Settings."
- [ ] Cancel mid-stream → text stops; no crash.

## Edit mode

- [ ] Switch to Edit. Send "create a note Inbox/test.md with 'hello'".
- [ ] Pending diff block appears with Approve / Reject.
- [ ] Approve → note is created. Ctrl+Z in the editor undoes it.
- [ ] Repeat; click Reject → no note created; conversation continues.
- [ ] Apply All with two pending edits → both commit in order.
- [ ] Post-turn Change Summary shows correct counts.

## Scheduled tasks

- [ ] Enable Daily Summary with time set 1 minute in the future. Wait; a new note appears under the configured folder. No existing user note is modified.
- [ ] Enable Weekly Review with today's weekday; verify it runs at configured time; creates a new note only.
- [ ] Disable both; confirm no further notes are created.

## Localization

- [ ] Settings → Language → 中文. Chat UI labels switch to Chinese.
- [ ] New chat in zh-CN uses the Chinese system prompt (verify the model's reply language reflects this).

## Mobile smoke (iOS or Android Obsidian)

- [ ] Plugin loads on mobile.
- [ ] At least one provider (recommend DeepSeek / OpenAI) works via `requestUrl`.
- [ ] Chat view renders and scrolls.

## Robustness

- [ ] Send a very long message that exceeds provider context — HistoryTrimmer kicks in, retry succeeds.
- [ ] Kill network mid-stream — error surface, no frozen UI.
- [ ] Trigger 25-iteration cap (use a prompt that forces loops) — loop terminates with "stopped: max_iterations".

## Conversation persistence

- [ ] After a chat, a note appears in `_agent/chats/` with YAML frontmatter.
- [ ] Open the conversation list, click an older chat; messages reload.
- [ ] Delete the conversation note in the vault; list refreshes (no crash).
