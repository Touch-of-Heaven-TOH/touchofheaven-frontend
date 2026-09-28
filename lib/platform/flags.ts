import "server-only";

import { serverApiFetch } from "@/lib/api/server";

export type PlatformFlags = {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  newRegistrationsEnabled: boolean;
  aiStudioEnabled: boolean;
  marketplaceEnabled: boolean;
};

const OPEN: PlatformFlags = {
  maintenanceMode: false,
  maintenanceMessage: null,
  newRegistrationsEnabled: true,
  aiStudioEnabled: true,
  marketplaceEnabled: true,
};

/**
 * The platform's own switches, read server-side.
 *
 * A page that must not be reachable when a feature is off cannot ask the
 * browser whether it is off - the browser is not the authority. If the
 * backend cannot be reached the flags read as open rather than closed,
 * because a network blip should not take working features off the
 * platform.
 */
export async function getPlatformFlags(): Promise<PlatformFlags> {
  try {
    return await serverApiFetch<PlatformFlags>("/api/v1/platform/status");
  } catch {
    return OPEN;
  }
}
