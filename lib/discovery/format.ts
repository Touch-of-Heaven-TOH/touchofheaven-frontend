const KM_TO_MILES = 0.621371;

/** US locales show imperial distance; everywhere else shows metric -
 * matching how people in each region actually think about "how far." */
function usesImperialUnits(): boolean {
  if (typeof navigator === 'undefined') return false;
  try {
    const locale = new Intl.Locale(navigator.language);
    return locale.region === 'US';
  } catch {
    return false;
  }
}

export function formatDistance(distanceKm: number): string {
  if (usesImperialUnits()) {
    const miles = distanceKm * KM_TO_MILES;
    return `${miles.toFixed(1)} miles away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export function formatNextAvailableSlot(
  nextAvailableSlotAt: string | null,
  bucket: 'TODAY' | 'THIS_WEEK' | 'LATER' | 'NONE',
): { text: string; tone: 'available' | 'soon' | 'later' | 'full' } {
  if (bucket === 'NONE' || !nextAvailableSlotAt) {
    return { text: 'Fully booked — join waitlist', tone: 'full' };
  }

  const slot = new Date(nextAvailableSlotAt);
  const time = slot.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (bucket === 'TODAY') {
    return { text: `Available today · ${time}`, tone: 'available' };
  }
  if (bucket === 'THIS_WEEK') {
    const day = slot.toLocaleDateString(undefined, { weekday: 'long' });
    return { text: `Available ${day} · ${time}`, tone: 'soon' };
  }

  const daysUntil = Math.max(
    1,
    Math.round((slot.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  return { text: `Next opening in ${daysUntil} days`, tone: 'later' };
}
