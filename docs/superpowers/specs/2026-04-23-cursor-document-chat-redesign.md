# Cursor/Document Chat UI Redesign

**Date:** 2026-04-23
**Status:** Approved — ready for implementation

---

## Problem

The current chat UI (committed `f7eb170`) is visually inconsistent with the user's expectations. Despite two rounds of redesign, it still uses floating bubbles and heavy card borders that feel like a generic chat widget rather than a focused, developer-grade agent interface. The user wants something closer to Cursor or Claude Desktop: clean, readable, document-style.

## Design Decisions (confirmed via visual brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout style | Cursor/document — no bubbles, full-width sections | Developer-focused, content-first |
| Color strategy | Follow Obsidian theme (CSS variables) | Adapts to user's light/dark/custom theme automatically |
| Turn separator | Alternating bands — user messages get a subtle accent tint | Clearest visual distinction, closest to Cursor/ChatGPT |
| Code blocks | VS Code header (language label + always-visible Copy button), theme-adaptive background | Light theme: soft lavender bg; Dark theme: deep dark bg |
| History | Collapsible drawer below header, grouped by date | Clock icon toggles it; active session gets accent left stripe |

---

## Visual Design Spec

### Header (always visible)
- Green online dot + provider/model label chip
- Mode toggle pill (Ask / Edit) — active segment gets gradient fill
- Clock icon button → toggles history drawer (lights up accent when open)
- `+` new conversation button
- Frosted glass: `backdrop-filter: blur(6px)` with semi-transparent theme background
- Subtle `box-shadow` instead of hard border

### History Drawer (collapsible)
- Slides in below header when clock is toggled
- `max-height: ~220px`, scrollable
- Sessions grouped by **Today / Yesterday / [date]** section labels
- Each row: chat bubble icon · session title (truncated) · date/time right-aligned
- Active session: accent left border stripe + accent tint background
- "New conversation" button pinned at bottom of list
- Collapses back when clock is clicked again or a session is selected
- Date grouping: parse `YYYY-MM-DD` from the filename (e.g. `agent-chats/2026-04-23-title.md`). "Today" = today's date, "Yesterday" = yesterday, older = display the date string. Sessions without a parseable date fall into an "Older" bucket.

### Message List
- Full-width alternating bands:
  - **User turn**: `color-mix(in srgb, --interactive-accent 6%, --background-primary)` tint
  - **Agent turn**: `--background-primary` (no tint)
- Each turn starts with a small uppercase name label:
  - User: `YOU` — muted grey
  - Agent: `AGENT` — accent color
- No avatars, no bubbles, no border cards
- Content uses full available width, `padding: 10px 13px`
- `border-bottom: 1px solid --background-modifier-border` between turns
- Streaming turn: same band layout, with inline blinking cursor at end of text

### Code Blocks (inside agent turns)
- **Header bar**: language label (left, accent color, monospace) + Copy button (right, always visible)
- **Light Obsidian**: header `--background-secondary` tinted with accent (~`#eeecff` equivalent via `color-mix`), body soft lavender (`color-mix(in srgb, --interactive-accent 4%, --background-secondary)`)
- **Dark Obsidian**: header and body use `--code-background` or darker variant of `--background-secondary`
- Border: `1px solid --background-modifier-border` with accent tint
- Border radius: `7px`
- Syntax colors: use Obsidian's own rendered output (via `MarkdownRenderer.render`) — we style the container, not override Prism
- Copy button: plain text "Copy" → "✓ Copied" for 2s on click

### Inline code
- `background: color-mix(in srgb, --interactive-accent 10%, --background-secondary)`
- `color: --text-accent`
- `font-family: --font-monospace`, `border-radius: 3px`, `padding: 1px 4px`

### Input Area
- Elevated card: `background: --background-primary-alt`, `border-radius: 8px`, soft shadow
- Focus: accent border + glow ring
- Single-line expanding textarea (max 200px)
- Send button: gradient accent, scales slightly on hover
- Char counter appears at 500+ chars

### Diff Review Block (Edit mode)
- File path shown as accent-tinted pill chip
- Dual-column line number gutter (old | new)
- `3px` left accent stripe on add/del rows
- Approve (filled) / Reject (outline) buttons

### Change Summary Bar
- Pinned at bottom of message list after a turn completes edits
- Badge chips: created (green) / edited (accent) / deleted (red), each with count
- Checkmark icon + "Changes applied:" label

---

## CSS Implementation Strategy

All colors via Obsidian CSS variables — never raw hex in component styles:
- `--background-primary` / `--background-primary-alt` / `--background-secondary`
- `--background-modifier-border`
- `--interactive-accent` / `--interactive-accent-hover` / `--text-on-accent`
- `--text-normal` / `--text-muted` / `--text-faint` / `--text-accent`
- `--font-monospace` / `--font-interface`
- `--color-green` / `--color-red` for diff and summary

Use `color-mix(in srgb, var(--interactive-accent) X%, transparent)` for tints so gradients adapt to the user's accent color.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/ui/MessageList.svelte` | Full rewrite — alternating bands, name labels, no bubbles/cards, code block container styles |
| `src/ui/ChatView.svelte` | Frosted header, history toggle state, elevated input |
| `src/ui/ConversationList.svelte` | Grouped-by-date history drawer (Today/Yesterday/date sections) |
| `src/ui/DiffReviewBlock.svelte` | Already updated — minor tweaks to match new palette |
| `src/ui/ModeToggle.svelte` | Already updated — verify gradient matches new header |
| `src/ui/ChangeSummary.svelte` | Already updated — verify badge style matches new palette |
| `src/ui/markdown-action.ts` | Already exists — update `:global()` code block styles to match new theme-adaptive approach |

---

## What Does NOT Change

- All Svelte component structure and props (no API surface changes)
- `markdown-action.ts` logic (only its injected CSS changes)
- Plugin backend (agent loop, providers, tools, settings)
- Build system / test suite

---

## Verification

1. `npm run build` — clean, no errors
2. `npm test` — 61/61 pass
3. Install `main.js` + `main.css` into Obsidian vault plugin folder
4. Open chat panel — verify:
   - **Light theme**: user turns show soft accent tint, agent turns white, code blocks lavender
   - **Dark theme**: same structure, code blocks deep dark
   - **History drawer**: clock icon toggles it, sessions grouped by date, clicking a session loads it
   - **Markdown**: paste a message with code block, list, bold — verify renders correctly
   - **Streaming**: cursor blinks in the agent band during generation
   - **Edit mode**: diff block shows file chip, line numbers, stripes
5. Commit code + rebuilt `main.js` / `main.css`
