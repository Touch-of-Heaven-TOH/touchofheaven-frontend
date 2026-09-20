"use client";

import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import type { RequestJson } from "@/lib/api/types";

/** SWR fetcher for every admin GET. The key is the API path itself. */
export function adminFetcher<TData>(path: string): Promise<TData> {
  return browserApiFetch<TData>(path);
}

export function adminRequest<TData>(
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
 * The message to show an admin when an action fails. Backend AppError
 * messages are written for people (see Backend_for_HOF/lib/errors.ts), so
 * they are shown as-is - "This application has already been decided" is
 * exactly what a reviewer needs to read.
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

export function withQuery(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * SWR key matcher for the audit trail. A settings save and the trail that
 * shows it are separate requests, so a save has to revalidate the trail
 * explicitly - otherwise the page says "recorded in the audit log below"
 * above a list that hasn't moved.
 */
export function isAuditKey(key: unknown): boolean {
  return typeof key === "string" && key.startsWith("/api/v1/admin/audit");
}

/**
 * SWR key matcher for the application queue. A decision changes what the
 * queue should show, and the queue is a different request from the one
 * that made the decision - without this, going back to the list serves
 * the cached page and an already-decided application still looks
 * decidable, which earns a 409 on the second click.
 */
export function isApplicationListKey(key: unknown): boolean {
  return typeof key === "string" && key.startsWith("/api/v1/admin/professional-applications?");
}
