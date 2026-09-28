"use client";

import type { ReactNode } from "react";
import { ClientShell } from "@/features/discovery/DiscoveryShell";

/** ClientShell is a client component; this lets a server page wrap its
 * content in the same chrome without becoming one itself. */
export function ClientShellFrame({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
