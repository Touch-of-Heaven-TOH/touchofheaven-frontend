import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDistance, formatNextAvailableSlot } from '@/lib/discovery/format';

describe('formatDistance', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('formats in kilometres for a non-US locale', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'en-GB' });
    expect(formatDistance(4.2)).toBe('4.2 km away');
  });

  it('formats in miles for a US locale', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'en-US' });
    // 4.2 km * 0.621371 ≈ 2.6 miles
    expect(formatDistance(4.2)).toBe('2.6 miles away');
  });

  it('falls back to kilometres when the locale is unparseable', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'not-a-real-locale-tag!!' });
    expect(formatDistance(1)).toBe('1.0 km away');
  });
});

describe('formatNextAvailableSlot', () => {
  it('reports "full" for bucket NONE regardless of the timestamp', () => {
    const result = formatNextAvailableSlot(null, 'NONE');
    expect(result.tone).toBe('full');
    expect(result.text).toMatch(/fully booked/i);
  });

  it('reports "full" when the timestamp is missing even if the bucket is not NONE', () => {
    const result = formatNextAvailableSlot(null, 'TODAY');
    expect(result.tone).toBe('full');
  });

  it('reports "available" with an explicit time for bucket TODAY', () => {
    const slot = new Date();
    slot.setHours(slot.getHours() + 1);
    const result = formatNextAvailableSlot(slot.toISOString(), 'TODAY');
    expect(result.tone).toBe('available');
    expect(result.text).toMatch(/^Available today · /);
  });

  it('reports "soon" with a weekday name for bucket THIS_WEEK', () => {
    const slot = new Date();
    slot.setDate(slot.getDate() + 3);
    const result = formatNextAvailableSlot(slot.toISOString(), 'THIS_WEEK');
    expect(result.tone).toBe('soon');
    expect(result.text).toMatch(/^Available \w+ · /);
  });

  it('reports "later" with a day count for bucket LATER', () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const slot = new Date('2026-01-15T12:00:00Z'); // 14 days out
    const result = formatNextAvailableSlot(slot.toISOString(), 'LATER');

    expect(result.tone).toBe('later');
    expect(result.text).toBe('Next opening in 14 days');

    vi.useRealTimers();
  });

  it('floors the day count at 1 even for a same-day LATER timestamp', () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const slot = new Date('2026-01-01T18:00:00Z');
    const result = formatNextAvailableSlot(slot.toISOString(), 'LATER');

    expect(result.text).toBe('Next opening in 1 days');

    vi.useRealTimers();
  });
});
