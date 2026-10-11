/**
 * Display helpers shared by the redesigned screens.
 *
 * Money: the backend stores every amount as integer minor units (x100),
 * whatever the currency. The app sells in FCFA (XAF), which has no
 * everyday minor unit, so 1 500 000 stored shows as "15 000 FCFA".
 */

const fcfaFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatFcfa(minorUnits: number): string {
  // fr-FR groups with a narrow no-break space; swap in a regular no-break
  // space so every font renders it.
  return `${fcfaFormatter.format(Math.round(minorUnits / 100)).replace(/ /g, " ")} FCFA`;
}

/** "From 15 000 FCFA" style, for a service or style card. */
export function formatFromPrice(minorUnits: number): string {
  return `From ${formatFcfa(minorUnits)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Douala",
});
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Douala",
});

/** "Thu 16 Oct" in Cameroon time, wherever the viewer is. */
export function formatDay(value: string | Date): string {
  return dayFormatter.format(new Date(value));
}

/** "10:30" in Cameroon time. */
export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value));
}

export function formatDayTime(value: string | Date): string {
  return `${formatDay(value)} · ${formatTime(value)}`;
}

/** "2 h ago", "Yesterday", "12 Sep" for message lists. */
export function formatRelative(value: string | Date, now = new Date()): string {
  const date = new Date(value);
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  if (hours < 48) return "Yesterday";
  return formatDay(date);
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
