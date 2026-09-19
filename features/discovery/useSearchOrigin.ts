"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_CENTER_LABEL } from "@/lib/maps/config";
import { getDeviceLocation } from "@/lib/maps/device-location";
import type { Coordinates } from "@/lib/maps/types";

export type SearchOrigin = {
  coordinates: Coordinates;
  /** "you" for the device's position, otherwise the fallback city's name. */
  label: string;
  fromDevice: boolean;
};

/**
 * Where to look for providers when the visitor hasn't said: their device's
 * position if they share it within a few seconds, otherwise the platform's
 * default city. Null until one of those is settled.
 *
 * The discovery results page has its own, fuller version of this (place
 * search, "Locate me", map moves); this is the read-only one for pages that
 * only show a "near you" preview.
 */
export function useSearchOrigin(timeoutMs = 5_000): SearchOrigin | null {
  const [origin, setOrigin] = useState<SearchOrigin | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDeviceLocation({ timeoutMs, maximumAgeMs: 5 * 60_000 })
      .then((coordinates) => {
        if (!cancelled) setOrigin({ coordinates, label: "you", fromDevice: true });
      })
      .catch(() => {
        if (!cancelled) {
          setOrigin({ coordinates: DEFAULT_MAP_CENTER, label: DEFAULT_MAP_CENTER_LABEL, fromDevice: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [timeoutMs]);

  return origin;
}
