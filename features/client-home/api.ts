"use client";

import { browserApiFetch } from "@/lib/api/browser";

/**
 * The client home's data contract.
 *
 * One request answers the whole page (see
 * Backend_for_HOF/modules/customers/client-home.service.ts). These types
 * mirror that response exactly - including the parts that are honestly
 * empty, such as an unread notification count the platform cannot yet
 * produce.
 */

export type HomeCategory = {
  id: string;
  slug: string;
  name: string;
  iconKey: string;
};

export type HomeProfessional = {
  id: string;
  braiderId: string;
  professionalName: string;
  locationLabel: string | null;
  isApproximateLocation: boolean;
  photo: { url: string; altText: string } | null;
  specialties: string[];
  rating: { average: number | null; count: number };
  nextAvailableSlotAt: string | null;
  nextAvailableSlotBucket: "TODAY" | "THIS_WEEK" | "LATER" | "NONE";
  distanceKm: number;
};

export type HomeRecentlyViewed = {
  braiderId: string;
  professionalName: string;
  handle: string | null;
  logoUrl: string | null;
  viewedAt: string;
};

export type HomeAppointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  serviceName: string;
  professionalName: string | null;
  locationLabel: string | null;
};

export type ClientHome = {
  viewer: {
    displayName: string;
    firstName: string | null;
    avatarObjectKey: string | null;
  };
  location: { city: string; region: string; latitude: number; longitude: number };
  /** notifications is null when the platform has no inbox to count. */
  unread: { messages: number; notifications: number | null };
  categories: HomeCategory[];
  categoriesFailed: boolean;
  nearby: HomeProfessional[];
  recommendations: HomeProfessional[];
  nearbyFailed: boolean;
  recentlyViewed: HomeRecentlyViewed[];
  upcomingAppointment: HomeAppointment | null;
  aiStudio: { available: boolean; hasDraft: boolean; draftId: string | null };
  featureFlags: {
    marketplaceEnabled: boolean;
    aiStudioEnabled: boolean;
    maintenanceMode: boolean;
  };
};

export const CLIENT_HOME_KEY = "/api/v1/customer/home";

export function clientHomeFetcher(path: string): Promise<ClientHome> {
  return browserApiFetch<ClientHome>(path);
}

/** A professional's public profile. The app has always called these
 * businesses; the URL follows the app, not the design's wording. */
export function professionalHref(braiderId: string) {
  return `/businesses/${braiderId}`;
}

export function bookHref(braiderId: string) {
  return `/book/${braiderId}`;
}

/** Selecting a tile is a search with that category applied, so the result
 * is a shareable URL rather than hidden component state. */
export function categoryHref(slug: string) {
  return `/explore?category=${encodeURIComponent(slug)}`;
}

export function searchHref(params: {
  q?: string;
  location?: string;
  date?: string;
}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.location?.trim()) search.set("location", params.location.trim());
  if (params.date && params.date !== "any") search.set("date", params.date);
  const query = search.toString();
  return query ? `/explore?${query}` : "/explore";
}

export function formatDistance(km: number) {
  const miles = km * 0.621371;
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

export function nextAvailableLabel(item: HomeProfessional) {
  if (!item.nextAvailableSlotAt) return null;
  const when = new Date(item.nextAvailableSlotAt);
  const time = when.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (item.nextAvailableSlotBucket === "TODAY") return `Today, ${time}`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (when.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;

  return `${when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}
