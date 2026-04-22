import { describe, it, expect } from "vitest";
import { shouldRunToday, shouldRunThisWeek, nextFireTimestamp } from "../../src/services/scheduler-service";

describe("scheduler helpers", () => {
  it("shouldRunToday: disabled always returns false", () => {
    expect(shouldRunToday({ enabled: false, time: "09:00", targetFolder: "" }, 0, Date.now())).toBe(false);
  });

  it("shouldRunToday: returns false when last run was in the same date bucket as now", () => {
    const now = Date.now();
    // same millisecond → same date → should not run again
    expect(shouldRunToday({ enabled: true, time: "00:00", targetFolder: "" }, now, now)).toBe(false);
  });

  it("shouldRunToday: returns true when never run and time already passed today", () => {
    // Build a "now" where we know the configured time is definitely in the past:
    // set time to "00:00" and use a moment well into the day.
    const now = new Date();
    now.setHours(23, 59, 0, 0); // 23:59 local — "00:00" is always before this
    expect(shouldRunToday({ enabled: true, time: "00:00", targetFolder: "" }, 0, now.getTime())).toBe(true);
  });

  it("shouldRunThisWeek: disabled always returns false", () => {
    expect(shouldRunThisWeek({ enabled: false, time: "00:00", targetFolder: "", weekday: 0 }, 0, Date.now())).toBe(false);
  });

  it("shouldRunThisWeek: only true on configured weekday", () => {
    const now = new Date();
    now.setHours(23, 59, 0, 0);
    const today = now.getDay();
    const tomorrow = (today + 1) % 7;
    // configured for today → might run
    const forToday = shouldRunThisWeek({ enabled: true, time: "00:00", targetFolder: "", weekday: today }, 0, now.getTime());
    // configured for tomorrow → must not run today
    const forTomorrow = shouldRunThisWeek({ enabled: true, time: "00:00", targetFolder: "", weekday: tomorrow }, 0, now.getTime());
    expect(forToday).toBe(true);  // time passed + correct weekday + never run
    expect(forTomorrow).toBe(false);
  });

  it("nextFireTimestamp returns a future number", () => {
    const now = Date.now();
    const next = nextFireTimestamp("00:00", now);
    expect(typeof next).toBe("number");
    expect(next).toBeGreaterThan(now - 1); // at least >= now (could equal now if exactly midnight)
  });
});
