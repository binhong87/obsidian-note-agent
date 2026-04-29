import type { VaultService } from "../services/vault-service";

export interface ToolSchema {
  name: string;
  description: string;
  parameters: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

export interface Tool {
  name: string;
  schema: ToolSchema;
  handler: (args: Record<string, unknown>) => Promise<string>;
  kind: "read" | "write";
}

export interface ToolContext {
  vault: VaultService;
  activeFile: () => { path: string; content: string } | null;
  selection: () => string;
}
