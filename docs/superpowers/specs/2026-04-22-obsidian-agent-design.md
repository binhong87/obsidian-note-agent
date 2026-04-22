# Obsidian Agent Plugin — Design Spec

**Date:** 2026-04-22
**Status:** Approved for planning

## Summary

An Obsidian plugin that embeds an agentic assistant for personal knowledge management. Users chat with the agent in a right-sidebar pane; the agent answers questions about their vault (**Ask mode**) or creates/edits notes with per-edit diff approval (**Edit mode**). A scheduler runs built-in daily-summary and weekly-review tasks that produce new notes only. The LLM backend is a user-selected single active provider, with adapters for OpenAI, Anthropic, Ollama, OpenRouter, DeepSeek, Qwen (DashScope), Kimi (Moonshot), Zhipu GLM, and MiniMax. UI and default prompts are localized in English and Simplified Chinese.

## Goals

- Ship a v1 plugin that feels like Cursor-for-notes: chat, tool-driven retrieval, reviewable edits.
- First-class support for major Chinese LLM providers alongside Western ones.
- Scheduled automations that are useful but cannot damage user notes.
- Clean layering so adding a new provider or tool is a single-file change.

## Non-Goals (v1)

- No local embedding index / vector search (tool-driven retrieval only).
- No multi-profile provider routing; one active provider for everything.
- No custom user-defined scheduled tasks; presets only.
- No MCP integration.
- No inline editor-embedded completions; chat-pane driven only.
- No mobile-specific UI (must not break on mobile, but desktop is primary).

## Architecture

Six layers with narrow interfaces:

```
UI Layer (ChatView · DiffReviewView · SettingsTab · StatusBar)
          │
Agent Runtime (AgentLoop · ModeGate · ApprovalQueue · HistoryTrimmer)
      │                      │
LLM Provider Adapters    Tool Registry
      (9 adapters)         (read + write tools)
                               │
                       VaultService · ConversationStore ·
                       SchedulerService · I18n
```

**Key decisions:**

- Provider adapters share one interface (`chat(request) → AsyncIterable<Delta>`). Adding a provider is one file.
- Agent Runtime is provider-agnostic and UI-agnostic; unit-testable without Obsidian or real LLMs.
- Tool Registry is the only path to vault mutation. ModeGate filters which tools the model sees, making mode enforcement structural.
- Scheduled tasks are a restricted mode that exposes `create_note` but not edit/delete/move — "write-only, new notes only" is a structural guarantee, not a prompt guarantee.

## Components

### UI (`src/ui/`)

- **ChatView** — right-sidebar `ItemView`. Message list with streaming, mode toggle (Ask/Edit), model-status chip, conversation list, "New chat" button, cancel button.
- **DiffReviewView** — inline diff blocks in the assistant turn, one per pending edit. Per-edit Approve/Reject plus bottom-of-turn **Apply All** / **Reject All**. After the turn, a **Change Summary** ("3 created, 2 edited") with links.
- **SettingsTab** — provider picker, masked API-key field, model selector (populated per provider), default mode, scheduled-tasks on/off + time, chat-storage folder, language override.
- **StatusBar** — current provider/model + state (idle/thinking/waiting-for-approval).

### Agent Runtime (`src/agent/`)

- **Conversation** — append-only message list + metadata (`id`, `title`, `createdAt`, `mode`, `provider`, `model`).
- **AgentLoop** — build prompt → call provider → stream deltas → parse tool calls → enqueue writes for approval → resume on approval → repeat. Iteration cap (default 25) and wall-clock cap (default 120s) per turn.
- **ModeGate** — filters tools by mode: Ask (read only), Edit (read + write), Scheduled (read + `create_note`).
- **ApprovalQueue** — pending writes with computed diffs; UI subscribes; commits through `VaultService` on approval.
- **HistoryTrimmer** — when approaching a configurable token budget, drops oldest turns and inserts a provider-generated summary turn. Retries once on `ContextOverflowError`.

### LLM Providers (`src/providers/`)

- **`LLMProvider` interface** — `chat(request) → AsyncIterable<Delta>`, where `Delta` is `{type: "text" | "tool_call" | "done", ...}`.
- **Adapters:** `openai.ts`, `anthropic.ts`, `ollama.ts`, `openrouter.ts`, `deepseek.ts`, `qwen.ts` (DashScope), `kimi.ts` (Moonshot), `zhipu.ts` (GLM), `minimax.ts`.
- Most CN providers are OpenAI-compatible with different endpoint/auth; adapters normalize endpoint, auth header, tool-call format (function-calling vs. Anthropic-style blocks), and streaming delta shape.
- Common HTTP helper uses Obsidian's `requestUrl` to bypass CORS and to work on mobile.

### Tools (`src/tools/`)

- **Read (Ask + Edit + Scheduled):** `search_vault`, `read_note`, `list_folder`, `get_backlinks`, `get_outgoing_links`, `get_active_note`, `get_selection`.
- **Write (Edit only, approval-gated):** `create_note`, `edit_note` (full replace), `apply_patch` (targeted diff), `delete_note`, `move_note`.
- **Scheduled:** read tools + `create_note` only.
- Each tool declares one JSON schema; adapters translate per provider.

### Services (`src/services/`)

- **VaultService** — thin wrapper over `app.vault` / `MetadataCache`. Only place that touches `TFile`/`TFolder`. Path validation rejects traversal (`..`) and out-of-vault writes. Writes via `vault.process()` / `vault.modify()` so Obsidian's undo stack captures them.
- **ConversationStore** — persists each conversation as a markdown note under `{settings.chatsFolder}/YYYY-MM-DD-<slug>.md` with YAML frontmatter (`id`, `mode`, `provider`, `model`). Reopen reconstructs the runtime `Conversation`.
- **SchedulerService** — on plugin load, registers interval checks against task settings (daily/weekly at hour:minute). Each run is a headless `AgentLoop` invocation in Scheduled mode. Activity is logged to `activity.log.md`.
- **I18n** — loads `locales/en.json` and `locales/zh-CN.json`; auto-detects from `moment.locale()` with settings override; `t(key, vars)`.

### Secrets

API keys live in Obsidian's per-device plugin `data.json` (not synced by Obsidian Sync by default). Settings UI shows a warning. No custom keychain code in v1.

## Data Flow

### Ask mode message

1. User sends in `ChatView` → `AgentLoop.send(userMsg)`.
2. Build request: localized system prompt + trimmed history + read-only tool schemas.
3. `LLMProvider.chat(...)` streams; text deltas render live.
4. On `tool_call`, loop pauses streaming, executes via `VaultService` (read-only), appends `tool_result`, re-invokes provider.
5. Terminates on `done` with no tool calls, or iteration cap.
6. `ConversationStore.persist()`.

### Edit mode with approval

1. As Ask, but write tools are exposed.
2. On a write tool call, loop does **not** execute. `ApprovalQueue.enqueue({tool, args, diff})`; `diff` is computed against the current file (or via shadow-apply for patches).
3. `DiffReviewView` renders pending edit inline. Text streaming continues; loop halts at the next tool boundary until user acts.
4. Approve / Apply All → commit via `VaultService` → `tool_result: {status: "applied"}`. Reject → `{status: "rejected_by_user"}`. Loop resumes.
5. Post-turn: `ChangeSummary` renders created/edited/deleted counts with note links.

### Scheduled task (daily summary / weekly review)

1. Scheduler tick at configured time → headless `AgentLoop` in Scheduled mode.
2. Tools: all read tools + `create_note` only.
3. Localized system prompt with target path from settings template (e.g., `Summaries/Daily/{{date}}.md`).
4. Runs without UI. Results append a line to `activity.log.md`.
5. Safety is structural: no edit/delete/move tool is present to be called.

### Streaming & cancellation

Provider adapters yield an async iterator; the view subscribes and renders. An `AbortController` in the loop propagates cancellation to the HTTP request.

## Error Handling

- **Provider errors:** adapters throw typed errors — `AuthError`, `RateLimitError`, `ContextOverflowError`, `ProviderUnavailableError`, `UnknownProviderError`. The loop renders user-facing messages in chat with a Retry button. `AuthError` deep-links to Settings. `ContextOverflowError` triggers `HistoryTrimmer` and one retry.
- **Read tools:** missing file / bad path returns `{error: "..."}` in `tool_result` so the model can recover. Never bubbles to UI.
- **Write tools:** path validation before commit (reject `..`, out-of-vault, creating an existing file via `create_note`). Failures appear as rejected items in the change summary.
- **Scheduled tasks:** never throw to UI. Log to `activity.log.md`. Three consecutive failures of the same task → one-time notice on next Obsidian launch.
- **Loop safety:** iteration cap (25) and wall-clock cap (120s) per turn. On cap hit: append system message, preserve partial output, persist.
- **Concurrent edits:** before committing `edit_note` / `apply_patch`, re-read and compare mtime; if changed since diff was shown, reject with "file changed externally."

## Testing

### Unit (Vitest)

- `AgentLoop` with mock `LLMProvider`: iteration cap, mode gating, approval routing, cancellation, history trimming.
- `ModeGate`: tool sets per mode.
- Provider adapters: shared parameterized suite across all nine, driven by recorded fixtures against a mocked `requestUrl`. Asserts request shape + delta parsing.
- `VaultService`: path validation, read/write/delete.
- `HistoryTrimmer`, `I18n`, `ConversationStore` serialization roundtrip.

### Integration

- In-memory vault mock or `obsidian-plugin-test-utils`. End-to-end: load → register view → send message → tool call → approval → persist → reload conversation.
- Scheduler: fake-timers advance past configured time, assert task ran and created expected note.

### Manual QA (checklist in `docs/superpowers/qa/`)

- Each provider: auth, streaming, tool-call parsing, error surfacing.
- Edit-mode approval: single approve, single reject, Apply All, cancel mid-turn.
- Mobile (iOS/Android): `requestUrl` works, sidebar renders, no Node-only APIs leaked.
- Large vault (10k notes): search tool stays responsive.

**Coverage target:** Agent Runtime + Tool Registry + Provider Adapters ≥ 80% line coverage; UI smoke-tested only.

## Tech Stack

- TypeScript, Obsidian plugin API.
- UI: Svelte (lighter bundle than React, well-supported by Obsidian community).
- Build: esbuild (standard Obsidian plugin template).
- Tests: Vitest.
- Lint/format: ESLint + Prettier.

## Open Questions (for plan phase)

- Exact model list per provider — surface via provider `listModels()` where available, else a curated static list.
- Default token budgets for history trim per provider (differs widely: DeepSeek 64k, Qwen 128k, Anthropic 200k, Ollama model-dependent).
- Conversation-note filename slug strategy (first user message? LLM-named?).
