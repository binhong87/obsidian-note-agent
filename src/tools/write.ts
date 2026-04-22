import type { Tool } from "./types";

export const PENDING_PREFIX = "__PENDING_WRITE__:";

function pending(name: string, args: Record<string, unknown>): string {
  return PENDING_PREFIX + JSON.stringify({ tool: name, args });
}

export function buildWriteTools(): Tool[] {
  const str = { type: "string" } as const;
  return [
    { name: "create_note", kind: "write",
      schema: { name: "create_note", description: "Create a new note. Fails if path exists.",
        parameters: { type: "object", properties: { path: str, content: str }, required: ["path","content"] } },
      handler: async (a) => pending("create_note", a) },
    { name: "edit_note", kind: "write",
      schema: { name: "edit_note", description: "Replace full content of an existing note.",
        parameters: { type: "object", properties: { path: str, content: str }, required: ["path","content"] } },
      handler: async (a) => pending("edit_note", a) },
    { name: "apply_patch", kind: "write",
      schema: { name: "apply_patch", description: "Apply a unified diff patch to a note.",
        parameters: { type: "object", properties: { path: str, patch: str }, required: ["path","patch"] } },
      handler: async (a) => pending("apply_patch", a) },
    { name: "delete_note", kind: "write",
      schema: { name: "delete_note", description: "Delete a note.",
        parameters: { type: "object", properties: { path: str }, required: ["path"] } },
      handler: async (a) => pending("delete_note", a) },
    { name: "move_note", kind: "write",
      schema: { name: "move_note", description: "Move or rename a note.",
        parameters: { type: "object", properties: { from: str, to: str }, required: ["from","to"] } },
      handler: async (a) => pending("move_note", a) },
  ];
}
