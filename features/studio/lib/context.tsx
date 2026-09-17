"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type {
  AccessLevel,
  BusinessContext,
  BusinessModule,
} from "@/features/studio/lib/types";

type StudioContextValue = BusinessContext & {
  /** Mirrors the backend's permission check so the UI only offers what
   * the API will accept. The API remains the authority either way. */
  can: (module: BusinessModule, level?: Exclude<AccessLevel, "none">) => boolean;
};

const StudioContext = createContext<StudioContextValue | null>(null);

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, manage: 2 };

export function StudioProvider({
  value,
  children,
}: {
  value: BusinessContext;
  children: ReactNode;
}) {
  const contextValue = useMemo<StudioContextValue>(
    () => ({
      ...value,
      can: (module, level = "view") => RANK[value.permissions[module]] >= RANK[level],
    }),
    [value],
  );

  return <StudioContext.Provider value={contextValue}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) {
    throw new Error("useStudio must be used inside the Studio layout.");
  }
  return value;
}
