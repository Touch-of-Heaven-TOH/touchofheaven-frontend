import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  dateKeyIn,
  minutesIntoDay,
  parseMoneyToCents,
  startOfWeekKey,
  zonedTimeToUtc,
} from "@/features/studio/lib/format";

describe("studio time helpers", () => {
  it("converts a Douala wall-clock time to the right UTC instant", () => {
    expect(zonedTimeToUtc("2026-09-16", "09:00", "Africa/Douala").toISOString()).toBe(
      "2026-09-16T08:00:00.000Z",
    );
  });

  it("resolves a time after a daylight-saving change in the same day", () => {
    // New York springs forward at 02:00 on 2026-03-08; 09:00 that morning is EDT (UTC-4).
    expect(zonedTimeToUtc("2026-03-08", "09:00", "America/New_York").toISOString()).toBe(
      "2026-03-08T13:00:00.000Z",
    );
  });

  it("buckets an instant into the business's calendar day, not the viewer's", () => {
    const lateEvening = new Date("2026-09-16T23:30:00.000Z");
    expect(dateKeyIn(lateEvening, "UTC")).toBe("2026-09-16");
    expect(dateKeyIn(lateEvening, "Africa/Douala")).toBe("2026-09-17");
    expect(minutesIntoDay(lateEvening, "Africa/Douala")).toBe(30);
  });

  it("does calendar arithmetic on date keys across month ends", () => {
    expect(addDaysToKey("2026-01-31", 1)).toBe("2026-02-01");
    expect(startOfWeekKey("2026-09-20")).toBe("2026-09-14");
    expect(startOfWeekKey("2026-09-14")).toBe("2026-09-14");
  });
});

describe("parseMoneyToCents", () => {
  it("parses whole and decimal amounts into integer cents", () => {
    expect(parseMoneyToCents("45")).toBe(4500);
    expect(parseMoneyToCents("45.5")).toBe(4550);
    expect(parseMoneyToCents("1,250.75")).toBe(125075);
  });

  it("rejects anything that is not a plain money amount", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("-5")).toBeNull();
    expect(parseMoneyToCents("12.345")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
  });
});
