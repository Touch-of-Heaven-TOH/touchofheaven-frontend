"use client";

import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import type { RequestJson } from "@/lib/api/types";

/** SWR fetcher for every Studio GET. The key is the API path itself. */
export function studioFetcher<TData>(path: string): Promise<TData> {
  return browserApiFetch<TData>(path);
}

export function studioRequest<TData>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: RequestJson,
): Promise<TData> {
  return browserApiFetch<TData>(path, {
    method,
    ...(body !== undefined ? { body } : {}),
  });
}

/**
 * The message to show a person when an action fails. Backend AppError
 * messages are written for end users (see Backend_for_HOF/lib/errors.ts),
 * so they are shown as-is; anything else gets a generic fallback rather
 * than a stack trace or a status code.
 */
export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiClientError) {
    if (error.status === 429) return "Too many attempts. Wait a moment and try again.";
    if (error.status >= 500 && error.code === "NON_JSON_RESPONSE") return fallback;
    return error.message || fallback;
  }
  return fallback;
}

export function errorCode(error: unknown): string | null {
  return error instanceof ApiClientError ? error.code : null;
}

/** A fresh key per attempt at a money-moving action (see the refund service). */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function withQuery(
  path: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
