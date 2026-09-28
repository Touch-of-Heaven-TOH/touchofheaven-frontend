"use client";

import { useEffect, useRef } from "react";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * Records that this client opened a professional's profile.
 *
 * Without this the "Recently viewed" strip on the client home could never
 * fill: the endpoint existed and nothing called it.
 *
 * Renders nothing, and deliberately fails silently. A profile is a public
 * page, so a signed-out visitor answering 401 here is the normal case,
 * not an error worth showing anyone - and a client reading a profile
 * should never see a message about bookkeeping.
 */
export function RecordProfileView({ braiderId }: { braiderId: string }) {
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    // Once per profile per mount: React runs effects twice in development
    // and the strip should not be reordered by that alone.
    if (recorded.current === braiderId) return;
    recorded.current = braiderId;

    void browserApiFetch(`/api/v1/customer/recently-viewed/${braiderId}`, {
      method: "POST",
    }).catch(() => undefined);
  }, [braiderId]);

  return null;
}
