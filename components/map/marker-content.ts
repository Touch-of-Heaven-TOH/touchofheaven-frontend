import type { NearbyBraider, NextAvailableSlotBucket } from '@/lib/discovery/types';

const AVAILABILITY_DOT_COLOR: Record<NextAvailableSlotBucket, string> = {
  TODAY: '#22c55e', // green
  THIS_WEEK: '#f59e0b', // amber
  LATER: '#9ca3af', // grey
  NONE: '#9ca3af', // grey
};

/**
 * Builds the raw HTML content element for a braider's custom marker - a
 * circular photo with a gold ring and an availability dot. Returned as a
 * plain DOM node (not JSX) because google.maps.marker.AdvancedMarkerElement
 * takes a `content` DOM element, not a React tree; React never renders or
 * reconciles anything inside it. Hover/tap scaling is a CSS transition on
 * this element, toggled by a class the caller adds/removes - see
 * BraiderMap.tsx's pointer handlers.
 */
export function buildBraiderMarkerContent(braider: NearbyBraider): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'toh-marker';
  wrapper.setAttribute(
    'aria-label',
    [
      braider.professionalName,
      braider.specialties[0],
      `${braider.distanceKm} km away`,
    ]
      .filter(Boolean)
      .join(', '),
  );
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('tabindex', '0');

  const photo = document.createElement('div');
  photo.className = 'toh-marker-photo';
  if (braider.photo) {
    photo.style.backgroundImage = `url(${braider.photo.url})`;
  } else {
    photo.classList.add('toh-marker-photo-placeholder');
  }

  const dot = document.createElement('span');
  dot.className = 'toh-marker-dot';
  dot.style.backgroundColor = AVAILABILITY_DOT_COLOR[braider.nextAvailableSlotBucket];

  const tooltip = document.createElement('span');
  tooltip.className = 'toh-marker-tooltip';
  tooltip.textContent = braider.professionalName;

  wrapper.append(photo, dot, tooltip);
  return wrapper;
}

/** The pulsing "you are here" marker - a solid dot with two expanding,
 * fading rings, all pure CSS animation (see globals.css's toh-user-dot
 * keyframes) so it costs nothing in JS after being mounted once. */
export function buildUserLocationMarkerContent(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'toh-user-location';
  wrapper.setAttribute('aria-label', 'Your current location');

  const ringOuter = document.createElement('span');
  ringOuter.className = 'toh-user-location-ring toh-user-location-ring-outer';
  const ringInner = document.createElement('span');
  ringInner.className = 'toh-user-location-ring toh-user-location-ring-inner';
  const dot = document.createElement('span');
  dot.className = 'toh-user-location-dot';

  wrapper.append(ringOuter, ringInner, dot);
  return wrapper;
}
