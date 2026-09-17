"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** True from the `lg` breakpoint up. False during server rendering, so the
 * first paint is the mobile composition and desktop enhances after hydration. */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

function subscribeClock(intervalMs: number) {
  return (callback: () => void) => {
    const id = window.setInterval(callback, intervalMs);
    return () => window.clearInterval(id);
  };
}

const clockSubscribers = new Map<number, (callback: () => void) => () => void>();

/** The current time, re-read every `intervalMs` (rounded to that interval so
 * the snapshot is stable between ticks). Used for countdowns and "in 25 min"
 * labels that must stay honest while a page is left open. */
export function useNow(intervalMs = 30_000) {
  let subscribe = clockSubscribers.get(intervalMs);
  if (!subscribe) {
    subscribe = subscribeClock(intervalMs);
    clockSubscribers.set(intervalMs, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
