import { describe, it, expect, vi } from "vitest";
import { VaultService, PathError } from "../../src/services/vault-service";

function makeApp(files: Record<string, string> = {}) {
  const store = new Map(Object.entries(files));
  return {
    vault: {
      getAbstractFileByPath: (p: string) => store.has(p) ? { path: p } : null,
      read: vi.fn(async (f: any) => store.get(f.path) ?? ""),
      create: vi.fn(async (p: string, c: string) => { store.set(p, c); return { path: p }; }),
      modify: vi.fn(async (f: any, c: string) => { store.set(f.path, c); }),
      delete: vi.fn(async (f: any) => { store.delete(f.path); }),
      rename: vi.fn(async (f: any, np: string) => { const c = store.get(f.path); store.delete(f.path); store.set(np, c!); }),
      getMarkdownFiles: () => [...store.keys()].map(p => ({ path: p })),
    },
  } as any;
}

describe("VaultService", () => {
  it("rejects path traversal", async () => {
    const s = new VaultService(makeApp());
    await expect(s.readNote("../secret.md")).rejects.toBeInstanceOf(PathError);
  });
  it("reads existing note", async () => {
    const s = new VaultService(makeApp({ "a.md": "hello" }));
    expect(await s.readNote("a.md")).toBe("hello");
  });
  it("create fails when file exists", async () => {
    const s = new VaultService(makeApp({ "a.md": "x" }));
    await expect(s.createNote("a.md", "y")).rejects.toThrow(/exists/);
  });
  it("create succeeds when new", async () => {
    const app = makeApp();
    const s = new VaultService(app);
    await s.createNote("new.md", "hi");
    expect(app.vault.create).toHaveBeenCalled();
  });
  it("edit requires existing file", async () => {
    const s = new VaultService(makeApp());
    await expect(s.editNote("missing.md", "x")).rejects.toThrow(/not found/);
  });
});
