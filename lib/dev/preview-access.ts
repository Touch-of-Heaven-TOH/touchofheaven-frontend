import type { TohRole } from "@/types/auth";

/**
 * Development-only preview access.
 *
 * While the product is still being built, the team needs to open any page by
 * typing its URL. With DEV_PREVIEW_ACCESS=true, a protected page that would
 * normally send you to a sign-in form instead signs you in as a demo account
 * with the right role (business owner, client or admin) and opens the page
 * with real data. The backend still checks every request: this only saves
 * typing a password.
 *
 * It is impossible to turn on outside `next dev` on this computer: it
 * requires NODE_ENV=development, the flag, and a localhost host. Set
 * DEV_PREVIEW_ACCESS=false (or remove it) to get the normal redirects back.
 */

export type PreviewPersona = "owner" | "customer" | "admin";

export const PREVIEW_PERSONAS: readonly PreviewPersona[] = ["owner", "customer", "admin"];

/** Set for a few seconds after a preview sign-in, so a page that still
 * refuses the account redirects normally instead of looping. */
export const PREVIEW_SWITCH_COOKIE = "toh_preview_switch";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isPreviewAccessEnabled(host: string | null | undefined): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.DEV_PREVIEW_ACCESS !== "true") return false;
  if (!host) return false;
  const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0]!;
  return LOCAL_HOSTNAMES.has(hostname.toLowerCase());
}

export function isPreviewPersona(value: string | null | undefined): value is PreviewPersona {
  return PREVIEW_PERSONAS.includes(value as PreviewPersona);
}

function startsWith(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** The demo account a protected path is meant for. */
export function personaForPath(pathname: string): PreviewPersona {
  if (startsWith(pathname, "/admin")) return "admin";
  if (
    startsWith(pathname, "/studio") ||
    startsWith(pathname, "/business/setup") ||
    startsWith(pathname, "/professional-application")
  ) {
    return "owner";
  }
  return "customer";
}

export function personaForRole(role: TohRole): PreviewPersona {
  if (role === "ADMIN") return "admin";
  if (role === "BRAIDER" || role === "SELLER") return "owner";
  return "customer";
}

export function previewSignInPath(persona: PreviewPersona, next: string): string {
  return `/dev/preview-sign-in?as=${persona}&next=${encodeURIComponent(next)}`;
}

export function previewEmail(persona: PreviewPersona): string | undefined {
  const value = {
    owner: process.env.DEV_PREVIEW_OWNER_EMAIL,
    customer: process.env.DEV_PREVIEW_CUSTOMER_EMAIL,
    admin: process.env.DEV_PREVIEW_ADMIN_EMAIL,
  }[persona];
  return value?.trim() || undefined;
}
