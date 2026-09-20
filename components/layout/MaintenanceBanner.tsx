import { TriangleAlert } from "lucide-react";
import { serverApiFetch } from "@/lib/api/server";

/**
 * What an admin switching on maintenance mode actually buys: a line at the
 * top of every page, for everyone, signed in or not.
 *
 * Rendered on the server from the public status endpoint so a visitor sees
 * it in the first paint rather than after a client fetch resolves - a
 * banner that arrives late is a banner people have already scrolled past.
 *
 * If the status call fails, nothing is rendered. A platform-wide alarm
 * that appears because a request timed out would train everyone to ignore
 * it.
 */
export async function MaintenanceBanner() {
  let status: { maintenanceMode: boolean; maintenanceMessage: string | null };
  try {
    status = await serverApiFetch<{
      maintenanceMode: boolean;
      maintenanceMessage: string | null;
    }>("/api/v1/platform/status");
  } catch {
    return null;
  }

  if (!status.maintenanceMode) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 bg-[var(--color-warning)] px-4 py-3 text-sm font-bold text-white"
    >
      <TriangleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
      <p>{status.maintenanceMessage ?? "We're doing some work and will be back shortly."}</p>
    </div>
  );
}
