# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — esbuild watch mode; bundles `src/main.ts` to `main.js` (CJS, Obsidian plugin format) and copies `main.css` → `styles.css` after each rebuild.
- `npm run build` — `tsc --noEmit` type-check, then a production esbuild bundle.
- `npm test` — runs Vitest once (`vitest run --passWithNoTests`).
- `npm run test:watch` — Vitest in watch mode.
- Single test: `npx vitest run tests/path/to/file.test.ts` (optionally `-t "test name"`).
- No lint script is wired up, though `eslint` + `eslint-plugin-svelte` are installed; invoke via `npx eslint <path>` if needed.

There is no install-into-vault step in scripts — `main.js`, `manifest.json`, and `styles.css` at the repo root are the plugin artifacts. Symlink or copy the repo into `<vault>/.obsidian/plugins/obsidian-agent/` for local testing.

## Architecture

This is an **Obsidian plugin** that adds an agentic chat pane capable of reading and (with approval) modifying vault notes. It is LLM-provider-agnostic.

### Layered structure (all under `src/`)

- **`main.ts`** — `ObsidianAgentPlugin` (extends `Plugin`). Wires everything together, owns the single active `Conversation`, exposes `sendMessage()` as an async generator that streams `LoopEvent`s to the UI. Also contains the `commitWrite` / `computeDiff` bridge that turns pending tool calls into real vault mutations after UI approval, and runs `SchedulerService` jobs.
- **`agent/`** — provider-agnostic orchestration.
  - `agent-loop.ts` — the core tool-calling loop. For each iteration it assembles `[system, ...conversation.messages]`, passes through `trimHistory(budget)`, streams the provider response (text deltas + tool calls), then dispatches each tool call. Uses a per-iteration `AbortController` linked to both outer cancel and `turnTimeoutMs` — `AbortError` is translated into a user-facing timeout `LoopEvent`.
  - `approval-queue.ts` — gate write tools behind UI approval.
  - `mode-gate.ts` — picks the system prompt key based on `Mode`.
  - `conversation.ts`, `history-trimmer.ts` — message store and token-budget trimming.
- **`providers/`** — one file per LLM vendor, all implementing `LLMProvider.chat()` as an async iterable of `Delta`s. `registry.ts::createProvider(id, cfg)` is the only entry point; `http.ts` and `openai-compat.ts` contain shared streaming/SSE plumbing used by the OpenAI-compatible backends (DeepSeek, Qwen, Kimi, Zhipu, MiniMax, OpenRouter). Anthropic and Ollama have their own implementations.
- **`tools/`** — tool schemas and handlers. `registry.ts::buildToolRegistry(ctx, mode)` returns the mode-appropriate set: `ask` → read-only; `scheduled` → read + `create_note` only; `edit` → read + all write tools. **Write tools do not mutate the vault directly** — they return a `PENDING_PREFIX`-tagged marker string. The agent loop surfaces this as a `pending` event; `main.ts` then calls `computeDiff`, waits for approval (via `DiffReviewBlock.svelte`), and only then invokes `commitWrite` which executes `VaultService` ops and records them in `lastTurnSummary`.
- **`services/`** — side-effectful helpers: `VaultService` (Obsidian file ops), `ConversationStore` (persists conversations as notes under `settings.chatsFolder`), `SchedulerService` (daily/weekly cron-like runs calling `runScheduled` in `main.ts`), `I18n` (en / zh-CN, used for system prompts too — see `mode-gate.systemPromptKey`).
- **`ui/`** — Svelte 4 + Obsidian `ItemView`. `chat-view.ts` mounts `ChatView.svelte`; `SettingsTab.ts` is the settings pane (no Svelte). Svelte is compiled in-bundle by `esbuild-svelte`.

### Key cross-cutting details

- **Streaming model**: everything from the provider → agent loop → plugin → UI is an async iterable of events, not a Promise. Don't wrap in `.then`; `for await` through it, and remember that cancellation flows via `AgentLoop.cancel()` → `AbortController`.
- **Pending-write protocol**: if you add a new mutating tool, follow the existing pattern — handler returns `PENDING_PREFIX + JSON.stringify({ tool, args })`, add a `case` in `main.ts::commitWrite`, and (usually) a branch in `computeDiff` so the UI can show a preview.
- **Settings migration**: `migrateSettings()` in `settings.ts` is the single place new settings fields get defaulted; call it on load so existing users don't break.
- **Provider list of record**: `types.ts::ProviderId` is the canonical union. If you add a provider, update both `ProviderId` and `providers/registry.ts`.
- **Build externals**: `obsidian`, `electron`, and `@codemirror/*` are marked external in `esbuild.config.mjs` — never import them into code paths that might be unit-tested under Node without mocking.

### Tests

Vitest, Node environment. Test tree mirrors `src/` (`tests/agent`, `tests/providers`, `tests/tools`, `tests/services`, plus `tests/fixtures`). Obsidian APIs are not available in tests — tests either mock `VaultService` or exercise pure modules (`agent-loop`, `history-trimmer`, providers against stubbed `fetch`, patch utils).
