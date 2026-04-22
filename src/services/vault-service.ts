import { App, TFile, normalizePath } from "obsidian";

export class PathError extends Error { constructor(m: string) { super(m); this.name = "PathError"; } }

function validatePath(p: string): string {
  const n = normalizePath(p);
  if (n.includes("..") || n.startsWith("/") || n.startsWith("\\")) throw new PathError(`invalid path: ${p}`);
  return n;
}

export class VaultService {
  constructor(private app: App) {}

  async readNote(path: string): Promise<string> {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f) throw new Error(`not found: ${p}`);
    return this.app.vault.read(f as TFile);
  }

  async createNote(path: string, content: string): Promise<void> {
    const p = validatePath(path);
    if (this.app.vault.getAbstractFileByPath(p)) throw new Error(`already exists: ${p}`);
    await this.ensureParent(p);
    await this.app.vault.create(p, content);
  }

  async editNote(path: string, content: string): Promise<void> {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f) throw new Error(`not found: ${p}`);
    await this.app.vault.modify(f as TFile, content);
  }

  async deleteNote(path: string): Promise<void> {
    const p = validatePath(path);
    const f = this.app.vault.getAbstractFileByPath(p);
    if (!f) throw new Error(`not found: ${p}`);
    await this.app.vault.delete(f);
  }

  async moveNote(oldPath: string, newPath: string): Promise<void> {
    const a = validatePath(oldPath); const b = validatePath(newPath);
    const f = this.app.vault.getAbstractFileByPath(a);
    if (!f) throw new Error(`not found: ${a}`);
    await this.ensureParent(b);
    await this.app.vault.rename(f, b);
  }

  async listFolder(path: string): Promise<string[]> {
    const p = path === "" ? "" : validatePath(path);
    return this.app.vault.getMarkdownFiles()
      .map(f => f.path)
      .filter(fp => p === "" || fp === p || fp.startsWith(p + "/"));
  }

  async searchVault(query: string): Promise<{ path: string; snippet: string }[]> {
    const q = query.toLowerCase();
    const hits: { path: string; snippet: string }[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const c = await this.app.vault.read(f);
      const i = c.toLowerCase().indexOf(q);
      if (i >= 0) hits.push({ path: f.path, snippet: c.slice(Math.max(0, i - 40), i + 120) });
      if (hits.length >= 20) break;
    }
    return hits;
  }

  getBacklinks(path: string): string[] {
    const cache = (this.app as any).metadataCache;
    const rec = cache?.resolvedLinks ?? {};
    const out: string[] = [];
    for (const src of Object.keys(rec)) if (rec[src][path]) out.push(src);
    return out;
  }

  getOutgoingLinks(path: string): string[] {
    const cache = (this.app as any).metadataCache;
    const rec = cache?.resolvedLinks?.[path] ?? {};
    return Object.keys(rec);
  }

  private async ensureParent(p: string): Promise<void> {
    const parent = p.split("/").slice(0, -1).join("/");
    if (!parent) return;
    if (!this.app.vault.getAbstractFileByPath(parent)) {
      await (this.app.vault as any).createFolder?.(parent);
    }
  }
}
