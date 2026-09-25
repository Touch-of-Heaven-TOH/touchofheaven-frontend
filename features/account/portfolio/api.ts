"use client";

import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import type { RequestJson } from "@/lib/api/types";

/** Everything the client portfolio reads and writes, in one place. */

export type PortfolioCategory = "HAIR" | "NAILS" | "WELLNESS" | "AI_PREVIEW" | "OTHER";
export type ItemVisibility = "PUBLIC" | "SHARED_WITH_PROFESSIONALS" | "PRIVATE";

export type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  category: PortfolioCategory;
  visibility: ItemVisibility;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  collectionId: string | null;
  createdAt: string;
};

export type PortfolioPage = {
  items: PortfolioItem[];
  nextCursor: string | null;
  categories: { category: PortfolioCategory; count: number }[];
};

export type PortfolioCollection = { id: string; name: string; itemCount: number };

export type FavoriteProvider = {
  braiderId: string;
  name: string;
  professionalName: string;
  logoUrl: string | null;
  handle: string | null;
};

export type ClientStats = {
  completedBookings: number;
  verifiedReviews: number;
  savedProfessionals: number;
};

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  HAIR: "Hair",
  NAILS: "Nails",
  WELLNESS: "Wellness",
  AI_PREVIEW: "AI previews",
  OTHER: "Other",
};

export const VISIBILITY_LABELS: Record<ItemVisibility, string> = {
  PUBLIC: "Public",
  SHARED_WITH_PROFESSIONALS: "Shared with professional",
  PRIVATE: "Private",
};

export function portfolioFetcher<TData>(path: string): Promise<TData> {
  return browserApiFetch<TData>(path);
}

export function portfolioRequest<TData>(
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
 * Uploads a photo straight to storage, then records it.
 *
 * Two steps because the file never passes through the API: the backend
 * signs a URL, the browser PUTs to it, and only the resulting key comes
 * back to be saved.
 */
export async function uploadPortfolioPhoto(input: {
  file: File;
  title: string;
  category: PortfolioCategory;
  visibility: ItemVisibility;
  description?: string;
}): Promise<PortfolioItem> {
  const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const presign = await portfolioRequest<{
    uploadUrl: string;
    storageKey: string;
  }>("/api/v1/customer/portfolio/upload-url", "POST", { fileExtension: extension });

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: input.file,
    headers: { "Content-Type": input.file.type || "image/jpeg" },
  });
  if (!put.ok) {
    throw new Error("The photo could not be uploaded. Please try again.");
  }

  const created = await portfolioRequest<{ item: PortfolioItem }>(
    "/api/v1/customer/portfolio",
    "POST",
    {
      storageKey: presign.storageKey,
      title: input.title,
      category: input.category,
      visibility: input.visibility,
      ...(input.description ? { description: input.description } : {}),
    },
  );
  return created.item;
}

/**
 * Photo storage is optional in this environment. When it is not set up the
 * backend answers 503 MEDIA_UPLOAD_NOT_CONFIGURED, and the page says so
 * plainly rather than showing an upload button that cannot work.
 */
export function isStorageUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiClientError && error.code === "MEDIA_UPLOAD_NOT_CONFIGURED"
  );
}

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiClientError) {
    if (error.status === 429) return "Too many attempts. Wait a moment and try again.";
    if (error.status >= 500 && error.code === "NON_JSON_RESPONSE") return fallback;
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
