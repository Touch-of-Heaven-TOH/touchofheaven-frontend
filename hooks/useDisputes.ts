"use client";

import useSWR from "swr";
import { browserApiFetch } from "@/lib/api/browser";
import type { DisputeDetail, DisputesResponse } from "@/lib/resolution/types";

export function useDisputes() {
  const { data, error, isLoading, mutate } = useSWR<DisputesResponse>(
    "/api/v1/resolution/disputes?limit=50",
    (path: string) => browserApiFetch<DisputesResponse>(path),
  );

  return {
    disputes: data?.disputes ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

export function useDispute(disputeId: string | null) {
  const key = disputeId ? `/api/v1/resolution/disputes/${disputeId}` : null;
  const { data, error, isLoading, mutate } = useSWR<DisputeDetail>(key, (path: string) =>
    browserApiFetch<DisputeDetail>(path),
  );

  return {
    dispute: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}
