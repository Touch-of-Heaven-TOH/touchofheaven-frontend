import type { AppointmentStatus } from "@/features/studio/lib/types";

/**
 * Everything the Studio displays about time is shown in the *business's*
 * timezone (BusinessContext.timezone), never the viewer's device timezone -
 * a manager checking the calendar while travelling must see the salon's
 * day, not their own.
 */

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timezone: string) {
  let formatter = partsFormatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    partsFormatters.set(timezone, formatter);
  }
  return formatter;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function zonedParts(date: Date, timezone: string): ZonedParts {
  const values: Record<string, string> = {};
  for (const part of partsFormatter(timezone).formatToParts(date)) {
    values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour) % 24,
    minute: Number(values.minute),
    weekday: WEEKDAY_INDEX[values.weekday ?? "Sun"] ?? 0,
  };
}

/** "YYYY-MM-DD" for the day `date` falls on in `timezone`. */
export function dateKeyIn(date: Date, timezone: string): string {
  const { year, month, day } = zonedParts(date, timezone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function minutesIntoDay(date: Date, timezone: string): number {
  const { hour, minute } = zonedParts(date, timezone);
  return hour * 60 + minute;
}

function offsetMs(instant: number, timezone: string) {
  const whole = Math.floor(instant / 60_000) * 60_000;
  const parts = zonedParts(new Date(whole), timezone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return asUtc - whole;
}

/**
 * The UTC instant for a wall-clock time in `timezone`. Two passes, so a
 * time whose offset differs from the start of the day (a DST change
 * between midnight and the chosen time) still resolves correctly.
 */
export function zonedTimeToUtc(dateKey: string, time: string, timezone: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const firstOffset = offsetMs(guess, timezone);
  let result = guess - firstOffset;
  const secondOffset = offsetMs(result, timezone);
  if (secondOffset !== firstOffset) result = guess - secondOffset;
  return new Date(result);
}

export function addDaysToKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayOfWeekOfKey(key: string): number {
  return new Date(`${key}T12:00:00Z`).getUTCDay();
}

/** Monday of the week containing `key`. */
export function startOfWeekKey(key: string): string {
  return addDaysToKey(key, -((dayOfWeekOfKey(key) + 6) % 7));
}

export function keyToLabel(key: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(
    new Date(`${key}T12:00:00Z`),
  );
}

export function formatTime(value: string | Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(
  value: string | Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" },
): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...options }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string | Date, timezone: string): string {
  return `${formatDate(value, timezone)} · ${formatTime(value, timezone)}`;
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Parses "12.50" / "12" into cents; null for anything that is not money. */
export function parseMoneyToCents(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatPercentBp(basisPoints: number): string {
  const percent = basisPoints / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export type StatusTone = "warning" | "info" | "accent" | "brand" | "success" | "neutral" | "danger";

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  PENDING_PAYMENT: { label: "Awaiting deposit", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  ARRIVED: { label: "Checked in", tone: "accent" },
  IN_PROGRESS: { label: "In service", tone: "brand" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED_BY_CUSTOMER: { label: "Cancelled by client", tone: "neutral" },
  CANCELLED_BY_PROFESSIONAL: { label: "Cancelled by business", tone: "neutral" },
  NO_SHOW: { label: "No-show", tone: "danger" },
  DISPUTED: { label: "Disputed", tone: "danger" },
};

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const BALANCE_METHOD_LABEL = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile money",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
} as const;
