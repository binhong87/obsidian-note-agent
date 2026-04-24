import type { VaultService } from "./vault-service";
import { Conversation, serializeConversation, parseConversation } from "../agent/conversation";

export class ConversationStore {
  constructor(private vault: VaultService, private folderRef: string | (() => string)) {}

  private get folder(): string {
    return typeof this.folderRef === "function" ? this.folderRef() : this.folderRef;
  }

  private pathFor(c: Conversation): string {
    const date = new Date(c.createdAt).toISOString().slice(0, 10);
    const slug = (c.title ?? c.id).replace(/[^\w一-龥-]+/g, "-").slice(0, 40);
    return `${this.folder}/${date}-${slug || c.id}.md`;
  }

  async save(c: Conversation): Promise<string> {
    const path = this.pathFor(c);
    const content = serializeConversation(c);
    try { await this.vault.editNote(path, content); }
    catch { await this.vault.createNote(path, content); }
    return path;
  }

  async load(path: string): Promise<Conversation> {
    return parseConversation(await this.vault.readNote(path));
  }

  async list(): Promise<string[]> {
    return this.vault.listFolder(this.folder);
  }

  async delete(path: string): Promise<void> {
    await this.vault.deleteNote(path);
  }
}
