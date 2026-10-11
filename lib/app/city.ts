"use client";

import { useSyncExternalStore } from "react";
import { CITIES, type City } from "@/lib/app/data";

const KEY = "toh-city";
const listeners = new Set<() => void>();

function read(): City["key"] {
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved === "yaounde" ? "yaounde" : "douala";
  } catch {
    return "douala";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The city the visitor browses, remembered on this device. Douala by default. */
export function useCity(): [City, (key: City["key"]) => void] {
  const key = useSyncExternalStore(subscribe, read, () => "douala" as const);
  const choose = (next: City["key"]) => {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Not remembered; the change below still applies to this tab.
    }
    listeners.forEach((listener) => listener());
  };
  return [CITIES.find((city) => city.key === key) ?? CITIES[0]!, choose];
}
