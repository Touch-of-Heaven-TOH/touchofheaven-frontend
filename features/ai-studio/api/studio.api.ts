"use client";

import { browserApiFetch } from "@/lib/api/browser";
import type {
  AiStudioAudience,
  AiStudioCategory,
  AiStudioCreditBalance,
  AiStudioGenerateResponse,
  AiStudioSession,
  AiStudioSessionRaw,
  AiStudioStyle,
  AiStudioUploadAuthorization,
} from "@/features/ai-studio/types";

// The backend's TryOnCategory enum (SCREAMING_SNAKE_CASE) mapped to the
// human labels this UI already displays - see
// Backend_for_HOF/prisma/schema.prisma for the source of truth. Any
// category value not listed here falls back to a title-cased rendering of
// the raw enum (toDisplayCategory below) rather than being dropped.
const CATEGORY_LABELS: Record<string, AiStudioCategory> = {
  KNOTLESS_BRAIDS: "Knotless Braids",
  BOX_BRAIDS: "Box Braids",
  GODDESS_BRAIDS: "Goddess Braids",
  CORNROWS: "Cornrows",
  LOCS_AND_TWISTS: "Locs & Twists",
  FEED_IN_BRAIDS: "Feed-In Braids",
  BOHO_BRAIDS: "Boho Braids",
  PROTECTIVE_STYLES: "Protective Styles",
  FADE: "Fade",
  TAPER: "Taper",
  BUZZ_CUT: "Buzz Cut",
  LINE_UP: "Line Up",
  WAVES: "Waves",
  AFRO: "Afro",
};

const DISPLAY_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([raw, label]) => [label, raw]),
);

function toDisplayCategory(raw: string): AiStudioCategory {
  return (
    CATEGORY_LABELS[raw] ??
    (raw
      .toLowerCase()
      .split("_")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ") as AiStudioCategory)
  );
}

type RawStyle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  audience?: AiStudioAudience;
  description?: string | null;
  thumbnailUrl: string;
  availableColors: string[];
  availableSizes: string[];
  availableLengths: string[];
};

function toAiStudioStyle(raw: RawStyle): AiStudioStyle {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: toDisplayCategory(raw.category),
    audience: raw.audience,
    thumbnailUrl: raw.thumbnailUrl,
    images: [{ url: raw.thumbnailUrl, angle: "front", alt: raw.name }],
    availableColors: raw.availableColors,
    availableSizes: raw.availableSizes,
    availableLengths: raw.availableLengths,
  };
}

function toAiStudioSession(raw: AiStudioSessionRaw): AiStudioSession {
  return {
    id: raw.id,
    styleName: raw.style.name,
    styleSlug: raw.style.slug,
    selectedColor: raw.selectedColor,
    selectedSize: raw.selectedSize,
    selectedLength: raw.selectedLength,
    inputImageUrl: raw.inputImageUrl,
    resultImageUrl: raw.outputImageUrl ?? undefined,
    status: raw.status,
    errorMessage: raw.message,
    createdAt: raw.createdAt,
    completedAt:
      raw.status === "COMPLETED" || raw.status === "FAILED" ? raw.updatedAt : undefined,
  };
}

type StylesPayload =
  | RawStyle[]
  | {
      styles?: RawStyle[];
      items?: RawStyle[];
    };

type CreditsPayload =
  | AiStudioCreditBalance
  | {
      credits?: AiStudioCreditBalance;
    };

type SessionsPayload =
  | AiStudioSessionRaw[]
  | {
      sessions?: AiStudioSessionRaw[];
      items?: AiStudioSessionRaw[];
    };

function asStyles(payload: StylesPayload): RawStyle[] {
  if (Array.isArray(payload)) return payload;
  return payload.styles ?? payload.items ?? [];
}

function asCredits(payload: CreditsPayload): AiStudioCreditBalance {
  if ("balance" in payload) return payload;
  return payload.credits ?? { balance: 0 };
}

function asSessions(payload: SessionsPayload): AiStudioSessionRaw[] {
  if (Array.isArray(payload)) return payload;
  return payload.sessions ?? payload.items ?? [];
}

export async function fetchAiStudioStyles(input: {
  category?: string;
  audience?: AiStudioAudience;
  q?: string;
} = {}) {
  const params = new URLSearchParams();
  if (input.category && input.category !== "All") {
    // Accepts either the raw backend enum ("KNOTLESS_BRAIDS") or the
    // display label ("Knotless Braids") the UI's category chips use -
    // the backend's query schema only understands the raw enum form.
    params.set("category", DISPLAY_TO_CATEGORY[input.category] ?? input.category);
  }
  if (input.audience) params.set("audience", input.audience);
  if (input.q) params.set("q", input.q);
  const query = params.toString();
  const payload = await browserApiFetch<StylesPayload>(
    `/api/v1/studio/styles${query ? `?${query}` : ""}`,
  );
  return asStyles(payload).map(toAiStudioStyle);
}

export async function fetchAiStudioCredits() {
  return asCredits(
    await browserApiFetch<CreditsPayload>("/api/v1/studio/credits"),
  );
}

export async function requestAiStudioUploadUrl(input: {
  filename: string;
  contentType: "image/jpeg" | "image/png";
}) {
  return browserApiFetch<AiStudioUploadAuthorization>(
    "/api/v1/studio/upload-url",
    {
      method: "POST",
      body: input,
    },
  );
}

export async function startAiStudioGeneration(input: {
  objectKey: string;
  styleId: string;
  selectedColor: string;
  selectedSize: string;
  selectedLength: string;
}) {
  return browserApiFetch<AiStudioGenerateResponse>("/api/v1/studio/generate", {
    method: "POST",
    body: input,
  });
}

export async function fetchAiStudioSession(sessionId: string) {
  const raw = await browserApiFetch<AiStudioSessionRaw>(
    `/api/v1/studio/sessions/${encodeURIComponent(sessionId)}`,
  );
  return toAiStudioSession(raw);
}

export async function fetchAiStudioSessions(limit = 8) {
  const payload = await browserApiFetch<SessionsPayload>(
    `/api/v1/studio/sessions?limit=${limit}`,
  );
  return asSessions(payload).map(toAiStudioSession);
}

export async function shareAiStudioSession(sessionId: string) {
  return browserApiFetch<{ shareUrl: string }>(
    `/api/v1/studio/sessions/${encodeURIComponent(sessionId)}/share`,
    { method: "POST", body: {} },
  );
}

