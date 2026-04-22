import { describe, it, expect, vi } from "vitest";
import { shouldRunToday, shouldRunThisWeek, nextFireTimestamp } from "../../src/services/scheduler-service";

describe("scheduler helpers", () => {
  it("shouldRunToday returns a boolean", () => {
    const now = new Date("2026-04-22T22:30:00Z").getTime();
    expect(typeof shouldRunToday({ enabled: true, time: "22:00", targetFolder: "" }, 0, now)).toBe("boolean");
    expect(shouldRunToday({ enabled: false, time: "22:00", targetFolder: "" }, 0, now)).toBe(false);
  });
  it("shouldRunThisWeek returns a boolean", () => {
    const wed = new Date("2026-04-22T22:30:00Z").getTime();
    expect(typeof shouldRunThisWeek({ enabled: true, time: "22:00", targetFolder: "", weekday: 3 }, 0, wed)).toBe("boolean");
    expect(shouldRunThisWeek({ enabled: false, time: "22:00", targetFolder: "", weekday: 3 }, 0, wed)).toBe(false);
  });
  it("nextFireTimestamp returns a number", () => {
    expect(typeof nextFireTimestamp("22:00", Date.now())).toBe("number");
  });
});
