# Obsidian Note Agent

An agentic AI assistant plugin for [Obsidian](https://obsidian.md) that can read and — with your approval — modify vault notes, powered by your choice of LLM provider.

[中文文档](README-cn.md)

## Features

- **Agentic chat** — multi-turn conversations with an autonomous tool-calling loop
- **Vault tools** — full-text search, read notes, list folders, follow backlinks and outgoing links, get the active note and current selection
- **Edit mode** — create, edit (full replace or unified patch), delete, and move notes; every change is shown as a diff for your review before it is committed
- **Multiple providers** — OpenAI, Anthropic, DeepSeek, Qwen (Alibaba), Kimi (Moonshot), Zhipu (GLM), MiniMax, OpenRouter, Ollama (local), and any custom OpenAI- or Anthropic-compatible endpoint
- **Three modes**
  - **Ask** — read-only; for Q&A and research without touching your vault
  - **Edit** — full write access; all changes require your approval via a diff UI
  - **Scheduled** — automated background runs (daily summary, weekly review) with restricted write access
- **Scheduled tasks** — daily summaries and weekly reviews written automatically to configurable folders
- **Auto-compaction** — conversation history is compacted transparently when approaching the model's context limit
- **Per-provider profiles** — separate API key, base URL, and model saved per provider
- **User profile** — optional personal description injected into every system prompt
- **i18n** — English and Simplified Chinese UI, auto-detected from Obsidian's language setting

## Installation

### Via BRAT (recommended for pre-release)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin
2. In BRAT settings, add: `Bin-Home/obsidian-note-agent`
3. Enable the plugin in **Settings → Community plugins**

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create the folder `<your-vault>/.obsidian/plugins/obsidian-note-agent/`
3. Copy the three files into that folder
4. Reload Obsidian and enable the plugin in **Settings → Community plugins**

## Setup

1. Open **Settings → Obsidian Note Agent**
2. Select your LLM provider and enter your API key
3. Optionally set a custom base URL (for self-hosted or proxy endpoints) and model name
4. Choose a mode: **Ask** for read-only access, **Edit** for write access

## Usage

- Click the **bot icon** in the left ribbon, or run `Open Note Agent` from the command palette
- Type your message and press Enter (or Shift+Enter for a new line)
- In **Edit mode**, the agent proposes note changes as unified diffs — approve or reject each one before it is written to disk
- Use `New Chat` to start a fresh conversation; previous conversations are saved and accessible via the history panel

## Supported Providers

| Provider | Notes |
|---|---|
| OpenAI | GPT-4o, GPT-4o-mini, o1, o3, etc. |
| Anthropic | Claude 3.5 / 4 series |
| DeepSeek | deepseek-v3, deepseek-r1 |
| Qwen | Alibaba Cloud Dashscope (qwen-plus, qwen-max, etc.) |
| Kimi | Moonshot AI (moonshot-v1 series) |
| Zhipu | GLM-4 series |
| MiniMax | MiniMax-Text series |
| OpenRouter | Any model via openrouter.ai |
| Ollama | Local models — Llama, Mistral, Qwen, etc. |
| Custom | Any OpenAI-compatible or Anthropic-compatible endpoint |

## Development

```bash
npm install
npm run dev       # esbuild watch mode — rebuilds on save
npm run build     # tsc type-check + production bundle
npm test          # unit tests (Vitest)
```

For local testing, symlink or copy the repo folder into your vault:

```
<vault>/.obsidian/plugins/obsidian-note-agent/
```

The plugin artifacts are `main.js`, `manifest.json`, and `styles.css` at the repo root.

## License

MIT
