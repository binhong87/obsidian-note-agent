import type { Settings, ScheduledTaskSetting } from "../settings";

export function parseTime(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function nextFireTimestamp(hhmm: string, nowMs: number): number {
  const { h, m } = parseTime(hhmm);
  const d = new Date(nowMs); d.setHours(h, m, 0, 0);
  if (d.getTime() <= nowMs) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function shouldRunToday(cfg: ScheduledTaskSetting, lastRunMs: number, nowMs: number): boolean {
  if (!cfg.enabled) return false;
  const { h, m } = parseTime(cfg.time);
  const fire = new Date(nowMs); fire.setHours(h, m, 0, 0);
  if (nowMs < fire.getTime()) return false;
  const last = new Date(lastRunMs), today = new Date(nowMs);
  return last.toDateString() !== today.toDateString();
}

export function shouldRunThisWeek(cfg: ScheduledTaskSetting, lastRunMs: number, nowMs: number): boolean {
  if (!cfg.enabled) return false;
  const today = new Date(nowMs);
  if (today.getDay() !== (cfg.weekday ?? 0)) return false;
  return shouldRunToday(cfg, lastRunMs, nowMs);
}

export type ScheduledTaskRunner = (
  kind: "daily" | "weekly",
  cfg: ScheduledTaskSetting,
) => Promise<void>;

export class SchedulerService {
  private timer: number | null = null;
  private lastRun: Record<string, number> = {};

  constructor(private getSettings: () => Settings, private runner: ScheduledTaskRunner) {}

  start() {
    void this.tick();
    this.timer = window.setInterval(() => { void this.tick(); }, 60_000);
  }
  stop() { if (this.timer !== null) { activeWindow.clearInterval(this.timer); this.timer = null; } }

  private async tick() {
    const s = this.getSettings();
    const now = Date.now();
    if (shouldRunToday(s.scheduled.dailySummary, this.lastRun.daily ?? 0, now)) {
      this.lastRun.daily = now;
      try { await this.runner("daily", s.scheduled.dailySummary); } catch (e) { console.error("daily task failed", e); }
    }
    if (shouldRunThisWeek(s.scheduled.weeklyReview, this.lastRun.weekly ?? 0, now)) {
      this.lastRun.weekly = now;
      try { await this.runner("weekly", s.scheduled.weeklyReview); } catch (e) { console.error("weekly task failed", e); }
    }
  }
}
