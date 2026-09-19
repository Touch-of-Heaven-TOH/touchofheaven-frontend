"use client";

import { createContext, useContext } from "react";
import type { SafeUser } from "@/types/auth";

const ViewerContext = createContext<SafeUser | null>(null);

/**
 * Makes the signed-in visitor (or null) that a server layout already
 * loaded available to client components below it, so they don't each have
 * to ask the API again. The layout owns the lookup; this only passes it on.
 */
export function ViewerProvider({
  viewer,
  children,
}: {
  viewer: SafeUser | null;
  children: React.ReactNode;
}) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export function useViewer(): SafeUser | null {
  return useContext(ViewerContext);
}
