# Smart Note Agent

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

### Community plugins (recommended)

1. Open **Settings → Community plugins** and disable Safe mode if prompted
2. Click **Browse** and search for `Smart Note Agent`
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create the folder `<your-vault>/.obsidian/plugins/smart-note-agent/`
3. Copy the three files into that folder
4. Reload Obsidian and enable the plugin in **Settings → Community plugins**

## Setup

1. Open **Settings → Smart Note Agent**
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
| Z.ai | GLM-4 series via Z.ai |
| MiniMax | MiniMax-Text series |
| OpenRouter | Any model via openrouter.ai |
| Ollama | Local models — Llama, Mistral, Qwen, etc. |
| LM Studio | Local models via LM Studio |
| Custom | Any OpenAI-compatible or Anthropic-compatible endpoint |

## Disclosures

### Account required

Using a remote LLM provider (OpenAI, Anthropic, DeepSeek, Qwen, Kimi, Zhipu, Z.ai, MiniMax, OpenRouter) requires an account with that provider and a valid API key. Local providers (Ollama, LM Studio) and custom self-hosted endpoints require no account.

### Payment may be required

Remote LLM providers charge for API usage. You are billed directly by the provider you choose — this plugin has no subscription or in-app purchase of its own. Local providers (Ollama, LM Studio) are free.

### Network use

When you send a message, the plugin transmits your message text and relevant vault context to the LLM provider you have configured. No data is sent to any service by default — the plugin is inert until you supply an API key and send a message. The following remote services may be contacted, depending on your provider selection:

| Provider | Endpoint |
|---|---|
| OpenAI | `https://api.openai.com` |
| Anthropic | `https://api.anthropic.com` |
| DeepSeek | `https://api.deepseek.com` |
| Qwen (Alibaba Cloud) | `https://dashscope.aliyuncs.com` |
| Kimi (Moonshot AI) | `https://api.moonshot.cn` |
| Zhipu | `https://open.bigmodel.cn` |
| Z.ai | `https://open.z.ai` |
| MiniMax | `https://api.minimax.chat` |
| OpenRouter | `https://openrouter.ai` |

Ollama and LM Studio communicate only with `localhost` — no data leaves your machine. The Custom provider connects to whatever endpoint you configure.

### Vault access

This plugin reads, writes, and enumerates vault files in order to operate:

- **Read** — notes are read to answer questions, provide context to the LLM, and compute diffs before edits.
- **Enumerate** — `list_folder` and `search_vault` tools scan all files (or all Markdown files) in the vault to find matches. Only file paths and content relevant to the query are sent to the LLM.
- **Write** — in Edit and Scheduled modes the agent can create, modify, delete, and move notes. Every write operation is presented as a unified diff for your review and requires explicit approval before anything is written to disk.

### Clipboard access

When you click the **Copy** button on a code block in the chat view, the plugin writes that code block's text to your clipboard via the browser Clipboard API. The plugin never reads from your clipboard.

## Development

```bash
npm install
npm run dev       # esbuild watch mode — rebuilds on save
npm run build     # tsc type-check + production bundle
npm test          # unit tests (Vitest)
```

For local testing, symlink or copy the `dist/` folder into your vault:

```
<vault>/.obsidian/plugins/smart-note-agent/
```

The plugin artifacts (`main.js`, `manifest.json`, `styles.css`) are output to `dist/` after each build.

## License

[MIT](LICENSE)
