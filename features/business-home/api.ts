import { serverApiFetch } from "@/lib/api/server";

/**
 * Counts shown on the business-facing home page. The backend returns them in
 * the public homepage feed (GET /api/v1/public/homepage). If that call fails
 * the page still renders; it just leaves the numbers out rather than inventing
 * them.
 */
export type PlatformStats = {
  verifiedBusinesses: number;
  publishedServices: number;
  completedAppointments: number;
};

// The development server can take a few seconds to answer the first call.
const FEED_TIMEOUT_MS = 5000;

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  try {
    const payload = await serverApiFetch<unknown>("/api/v1/public/homepage", {
      cache: "no-store",
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
    const stats =
      typeof payload === "object" && payload !== null
        ? (payload as { stats?: Record<string, unknown> }).stats
        : undefined;
    if (!stats) return null;

    const verifiedBusinesses = asCount(stats.verifiedBusinesses);
    const publishedServices = asCount(stats.publishedServices);
    const completedAppointments = asCount(stats.completedAppointments);
    if (verifiedBusinesses === null || publishedServices === null || completedAppointments === null) {
      return null;
    }
    return { verifiedBusinesses, publishedServices, completedAppointments };
  } catch {
    return null;
  }
}
