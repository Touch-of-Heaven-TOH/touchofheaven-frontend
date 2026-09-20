"use client";

import useSWR, { type KeyedMutator } from "swr";
import { browserApiFetch } from "@/lib/api/browser";

/** GET /api/v1/customer/me — the record every settings screen pre-fills from. */
export type CustomerProfile = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  preferredName: string | null;
  avatarObjectKey: string | null;
  /** Built by the API from the storage base URL; null until a photo exists. */
  avatarUrl: string | null;
  preferredLanguage: string;
  timezone: string;
  phoneNumberE164: string | null;
  phoneVerifiedAt: string | null;
  profileCompletedAt: string | null;
  deletion: { status: string; requestedAt: string; scheduledFor: string } | null;
};

export type BeautyProfile = {
  hairType: string | null;
  hairLength: string | null;
  scalpSensitivity: string | null;
  skinTone: string | null;
  preferredStyles: string[];
  allergies: string | null;
  notes: string | null;
  shareWithProviders: boolean;
  updatedAt: string | null;
};

export type BeautyOption = { value: string; label: string; swatch?: string };

export type BeautyProfilePayload = {
  profile: BeautyProfile;
  options: {
    hairTypes: BeautyOption[];
    hairLengths: BeautyOption[];
    scalpSensitivities: BeautyOption[];
    skinTones: BeautyOption[];
    styles: BeautyOption[];
  };
};

export type ConsentRecord = {
  id: string;
  consentType: string;
  decision: "GRANTED" | "WITHDRAWN";
  occurredAt: string;
};

type Result<TData> = {
  data: TData | undefined;
  error: unknown;
  isLoading: boolean;
  mutate: KeyedMutator<TData>;
};

function get<TData>(path: string): Promise<TData> {
  return browserApiFetch<TData>(path);
}

export function useCustomerProfile(): Result<{ profile: CustomerProfile }> {
  return useSWR<{ profile: CustomerProfile }>("/api/v1/customer/me", get);
}

export function useBeautyProfile(): Result<BeautyProfilePayload> {
  return useSWR<BeautyProfilePayload>("/api/v1/customer/beauty-profile", get);
}

/** The full consent history, newest first (the API orders by occurredAt desc). */
export function useConsents(): Result<{ consents: ConsentRecord[] }> {
  return useSWR<{ consents: ConsentRecord[] }>("/api/v1/customer/consents", get);
}

/** A human sentence for a failed request, for a toast or an inline banner. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
