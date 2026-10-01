/*
 * The date vocabulary the whole platform shares: the search bar writes it,
 * the URL carries it, and the results page filters on it.
 *
 * Two presets and an exact day. The presets exist because the discovery API
 * buckets each provider's next opening as TODAY / THIS_WEEK / LATER / NONE,
 * and it also returns nextAvailableSlotAt as a timestamp - which is what
 * makes an exact day answerable rather than decorative.
 *
 * "Tomorrow" used to be offered on the dashboard. Nothing could answer it.
 */

export type SearchDatePreset = "any" | "today" | "week";

/** A preset, or an exact day as YYYY-MM-DD. */
export type SearchDate = SearchDatePreset | `${number}-${number}-${number}`;

export const SEARCH_DATE_PRESETS: ReadonlyArray<{
  value: SearchDatePreset;
  label: string;
}> = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
];

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Local calendar date as YYYY-MM-DD - never toISOString, which shifts to UTC. */
export function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isExactDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** What the field shows: "Any date", "Today", "This week", or "Fri 3 Oct". */
export function formatSearchDate(value: SearchDate) {
  const preset = SEARCH_DATE_PRESETS.find((option) => option.value === value);
  if (preset) return preset.label;
  if (!isExactDate(value)) return "Any date";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Does this provider's next opening satisfy the chosen date?
 *
 * An exact day means "free by then" rather than "free on exactly that day":
 * a provider open sooner still suits someone who asked for the 12th, and
 * nextAvailableSlotAt is the first opening, not the only one.
 */
export function matchesSearchDate(
  value: SearchDate,
  provider: { nextAvailableSlotAt: string | null; nextAvailableSlotBucket: string },
): boolean {
  if (value === "any") return true;
  if (value === "today") return provider.nextAvailableSlotBucket === "TODAY";
  if (value === "week") {
    return (
      provider.nextAvailableSlotBucket === "TODAY" ||
      provider.nextAvailableSlotBucket === "THIS_WEEK"
    );
  }
  if (!isExactDate(value)) return true;
  if (!provider.nextAvailableSlotAt) return false;
  const endOfChosenDay = new Date(`${value}T00:00:00`);
  endOfChosenDay.setHours(23, 59, 59, 999);
  return new Date(provider.nextAvailableSlotAt) <= endOfChosenDay;
}
