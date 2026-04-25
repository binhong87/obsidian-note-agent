import type { Tool, ToolContext } from "./types";

const safe = async (fn: () => Promise<string>): Promise<string> => {
  try { return await fn(); } catch (e: any) { return JSON.stringify({ error: String(e?.message ?? e) }); }
};

export function buildReadTools(ctx: ToolContext): Tool[] {
  return [
    {
      name: "search_vault", kind: "read",
      schema: { name: "search_vault", description: "Full-text search across notes.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
      handler: (a) => safe(async () => JSON.stringify(await ctx.vault.searchVault(String(a.query)))),
    },
    {
      name: "read_note", kind: "read",
      schema: { name: "read_note", description: "Read full markdown content of a note.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => ctx.vault.readNote(String(a.path))),
    },
    {
      name: "list_folder", kind: "read",
      schema: { name: "list_folder", description: "List all file paths under a folder (notes, attachments, canvas, etc.). Pass an empty string to list the vault root.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => JSON.stringify(await ctx.vault.listFolder(String(a.path ?? "")))),
    },
    {
      name: "get_backlinks", kind: "read",
      schema: { name: "get_backlinks", description: "Notes that link to the given path.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => JSON.stringify(ctx.vault.getBacklinks(String(a.path)))),
    },
    {
      name: "get_outgoing_links", kind: "read",
      schema: { name: "get_outgoing_links", description: "Notes linked from the given path.",
        parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      handler: (a) => safe(async () => JSON.stringify(ctx.vault.getOutgoingLinks(String(a.path)))),
    },
    {
      name: "get_active_note", kind: "read",
      schema: { name: "get_active_note", description: "Current note in the editor.", parameters: { type: "object", properties: {} } },
      handler: () => safe(async () => JSON.stringify(ctx.activeFile())),
    },
    {
      name: "get_selection", kind: "read",
      schema: { name: "get_selection", description: "Currently selected text.", parameters: { type: "object", properties: {} } },
      handler: () => safe(async () => ctx.selection()),
    },
  ];
}
