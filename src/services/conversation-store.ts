import { App, normalizePath } from "obsidian";
import { Conversation, serializeConversation, parseConversation } from "../agent/conversation";

export class ConversationStore {
  private readonly adapter;

  constructor(app: App, private folderRef: string | (() => string)) {
    this.adapter = app.vault.adapter;
  }

  private get folder(): string {
    return normalizePath(typeof this.folderRef === "function" ? this.folderRef() : this.folderRef);
  }

  private pathFor(c: Conversation): string {
    const date = new Date(c.createdAt).toISOString().slice(0, 10);
    const slug = (c.title ?? c.id).replace(/[^\w一-鿿-]+/g, "-").slice(0, 40);
    return normalizePath(`${this.folder}/${date}-${slug || c.id}.md`);
  }

  private async ensureFolder(): Promise<void> {
    if (!(await this.adapter.exists(this.folder))) {
      await this.adapter.mkdir(this.folder);
    }
  }

  async save(c: Conversation): Promise<string> {
    await this.ensureFolder();
    const path = this.pathFor(c);
    await this.adapter.write(path, serializeConversation(c));
    return path;
  }

  async load(path: string): Promise<Conversation> {
    return parseConversation(await this.adapter.read(normalizePath(path)));
  }

  async list(): Promise<string[]> {
    try {
      const { files } = await this.adapter.list(this.folder);
      return files.filter(f => f.endsWith(".md")).sort().reverse();
    } catch {
      return [];
    }
  }

  async delete(path: string): Promise<void> {
    await this.adapter.remove(normalizePath(path));
  }

  /** Delete conversations whose filename date is older than `days` days. */
  async purgeOlderThan(days: number): Promise<void> {
    const files = await this.list();
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    for (const f of files) {
      const m = f.match(/(\d{4}-\d{2}-\d{2})/);
      if (!m) continue;
      if (new Date(m[1]).getTime() < cutoffMs) {
        try { await this.adapter.remove(normalizePath(f)); } catch { /* best effort */ }
      }
    }
  }
}
