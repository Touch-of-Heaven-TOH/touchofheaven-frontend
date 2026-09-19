import type { Coordinates } from "@/lib/maps/types";

export type DeviceLocationFailure = "unsupported" | "denied" | "timeout" | "unavailable";

export class DeviceLocationError extends Error {
  constructor(readonly reason: DeviceLocationFailure) {
    super(`Device location ${reason}`);
    this.name = "DeviceLocationError";
  }
}

export type DeviceLocationOptions = {
  /** Wall-clock limit, including any time the permission prompt is open. */
  timeoutMs: number;
  /** Reuse a fix this recent instead of waiting for a new one. */
  maximumAgeMs?: number;
  highAccuracy?: boolean;
  /**
   * Called if the device answers after `timeoutMs` has already rejected the
   * promise - for example the visitor clicks "Allow" on the prompt after
   * eight seconds. The caller decides whether it is still wanted.
   */
  onLateFix?: (coordinates: Coordinates) => void;
};

async function permissionIsDenied(): Promise<boolean> {
  try {
    if (!("permissions" in navigator) || !navigator.permissions?.query) return false;
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state === "denied";
  } catch {
    return false;
  }
}

/**
 * One position fix from the browser, with a timeout that really is a
 * timeout. getCurrentPosition's own `timeout` option only starts counting
 * once permission has been granted, so a visitor who ignores the prompt
 * would otherwise leave the page waiting forever. An already-blocked
 * permission rejects straight away instead of waiting out the timer.
 */
export async function getDeviceLocation(options: DeviceLocationOptions): Promise<Coordinates> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    throw new DeviceLocationError("unsupported");
  }
  if (await permissionIsDenied()) {
    throw new DeviceLocationError("denied");
  }

  return new Promise<Coordinates>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new DeviceLocationError("timeout"));
    }, options.timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (settled) {
          options.onLateFix?.(coordinates);
          return;
        }
        settled = true;
        window.clearTimeout(timer);
        resolve(coordinates);
      },
      (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        const reason: DeviceLocationFailure =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable";
        reject(new DeviceLocationError(reason));
      },
      {
        enableHighAccuracy: options.highAccuracy ?? false,
        maximumAge: options.maximumAgeMs ?? 0,
        // Generous on purpose: the wall-clock timer above is the real limit,
        // and a slow fix that lands later can still be used via onLateFix.
        timeout: Math.max(options.timeoutMs, 30_000),
      },
    );
  });
}
