import type { Mode } from "../types";
import type { Tool, ToolContext } from "./types";
import { buildReadTools } from "./read";
import { buildWriteTools } from "./write";

export function buildToolRegistry(ctx: ToolContext, mode: Mode): Tool[] {
  const read = buildReadTools(ctx);
  if (mode === "ask") return read;
  const write = buildWriteTools();
  if (mode === "scheduled") return [...read, ...write.filter(t => t.name === "create_note")];
  return [...read, ...write];
}
