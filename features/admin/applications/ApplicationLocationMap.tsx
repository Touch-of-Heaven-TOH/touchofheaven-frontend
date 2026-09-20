"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { MAP_STYLE_URL } from "@/lib/maps/config";
import { guardNullComparisons } from "@/lib/maps/style-guards";

/**
 * One pin, where the applicant says they work. Deliberately a plain map
 * rather than the discovery map: a reviewer is checking whether a stated
 * address lands somewhere plausible, not browsing.
 *
 * Nothing is fuzzed here. The private-studio offset exists to protect a
 * provider's home address from clients; an admin reviewing the application
 * is the one person who has to see the real position to judge it.
 */
export function ApplicationLocationMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = container.current;
    if (!node) return;

    const map = new maplibregl.Map({
      container: node,
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: { compact: true },
      // A review page scrolls; grabbing the wheel to zoom the map instead
      // of the page is the classic embedded-map annoyance.
      scrollZoom: false,
    });

    map.setStyle(MAP_STYLE_URL, {
      transformStyle: (_previous: StyleSpecification | undefined, next: StyleSpecification) =>
        guardNullComparisons(next),
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const marker = new maplibregl.Marker({ color: "#2D1B4E" })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup({ offset: 24 }).setText(label))
      .addTo(map);

    return () => {
      marker.remove();
      map.remove();
    };
  }, [latitude, longitude, label]);

  return (
    <div
      ref={container}
      role="img"
      aria-label={`Map showing ${label} at latitude ${latitude.toFixed(4)}, longitude ${longitude.toFixed(4)}`}
      className="h-64 w-full overflow-hidden rounded-md border border-[var(--color-border)]"
    />
  );
}
