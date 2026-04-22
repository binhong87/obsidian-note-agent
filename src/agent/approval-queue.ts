export interface PendingWrite {
  toolCallId: string;
  tool: string;
  args: Record<string, unknown>;
  diff: string;
}
export interface WriteDecision { status: "applied" | "rejected_by_user"; }

type Entry = { pw: PendingWrite; resolve: (d: WriteDecision) => void };

export class ApprovalQueue {
  private entries: Entry[] = [];
  private listeners = new Set<(list: PendingWrite[]) => void>();

  enqueue(pw: PendingWrite): Promise<WriteDecision> {
    return new Promise((resolve) => {
      this.entries.push({ pw, resolve });
      this.emit();
    });
  }
  list(): PendingWrite[] { return this.entries.map(e => e.pw); }
  onChange(fn: (list: PendingWrite[]) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { for (const l of this.listeners) l(this.list()); }

  approve(id: string) { this.resolveOne(id, "applied"); }
  reject(id: string) { this.resolveOne(id, "rejected_by_user"); }
  approveAll() { while (this.entries.length) this.resolveAt(0, "applied"); }
  rejectAll() { while (this.entries.length) this.resolveAt(0, "rejected_by_user"); }
  private resolveOne(id: string, s: WriteDecision["status"]) {
    const i = this.entries.findIndex(e => e.pw.toolCallId === id);
    if (i >= 0) this.resolveAt(i, s);
  }
  private resolveAt(i: number, s: WriteDecision["status"]) {
    const [e] = this.entries.splice(i, 1); e.resolve({ status: s }); this.emit();
  }
}
