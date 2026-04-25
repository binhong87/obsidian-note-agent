export interface PendingWrite {
  toolCallId: string;
  tool: string;
  args: Record<string, unknown>;
  diff: string;
}

export class ApprovalQueue {
  private entries: PendingWrite[] = [];
  private listeners = new Set<(list: PendingWrite[]) => void>();
  private commit: (pw: PendingWrite) => Promise<void>;

  constructor(opts: { commit: (pw: PendingWrite) => Promise<void> }) {
    this.commit = opts.commit;
  }

  enqueue(pw: PendingWrite): void { this.entries.push(pw); this.emit(); }
  list(): PendingWrite[] { return this.entries.slice(); }
  onChange(fn: (list: PendingWrite[]) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { for (const l of this.listeners) l(this.list()); }

  async approve(id: string) {
    const i = this.entries.findIndex(e => e.toolCallId === id);
    if (i < 0) return;
    const [pw] = this.entries.splice(i, 1);
    try {
      await this.commit(pw);
      this.emit();
    } catch (e) {
      this.entries.splice(i, 0, pw); // restore on failure so the item stays reviewable
      this.emit();
      throw e;
    }
  }

  reject(id: string) {
    const i = this.entries.findIndex(e => e.toolCallId === id);
    if (i >= 0) { this.entries.splice(i, 1); this.emit(); }
  }

  /** Apply all pending writes. Continues past individual failures; returns failed labels. */
  async approveAll(): Promise<string[]> {
    const failed: string[] = [];
    while (this.entries.length) {
      const [pw] = this.entries.splice(0, 1);
      try {
        await this.commit(pw);
      } catch (e) {
        console.error(`[agent] failed to commit ${pw.tool}:`, e);
        const label = String(pw.args?.path ?? pw.args?.from ?? pw.tool);
        failed.push(label);
      }
    }
    this.emit();
    return failed;
  }

  rejectAll() { this.entries = []; this.emit(); }
  clear() { this.entries = []; this.emit(); }
}
