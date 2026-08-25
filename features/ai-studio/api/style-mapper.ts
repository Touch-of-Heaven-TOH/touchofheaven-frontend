import type {
  AiStudioAudience,
  AiStudioCategory,
  AiStudioSession,
  AiStudioSessionRaw,
  AiStudioStyle,
} from "@/features/ai-studio/types";

// The backend's TryOnCategory enum (SCREAMING_SNAKE_CASE) mapped to the
// human labels this UI displays - see Backend_for_HOF/prisma/schema.prisma
// for the source of truth. Any category value not listed here falls back
// to a title-cased rendering of the raw enum (toDisplayCategory below)
// rather than being dropped.
//
// No "use client" here - this is pure data transformation with no browser
// dependency, shared by both the client-side API layer (studio.api.ts) and
// the server-rendered initial catalogue fetch (app/(public)/ai-studio/
// page.tsx). Splitting it out is what keeps those two from silently
// drifting the way they already had - the server path bypassed this
// mapping entirely before this file existed.
export const CATEGORY_LABELS: Record<string, AiStudioCategory> = {
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

export const DISPLAY_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([raw, label]) => [label, raw]),
);

export function toDisplayCategory(raw: string): AiStudioCategory {
  return (
    CATEGORY_LABELS[raw] ??
    (raw
      .toLowerCase()
      .split("_")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ") as AiStudioCategory)
  );
}

export type RawStyle = {
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

export function toAiStudioStyle(raw: RawStyle): AiStudioStyle {
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

export function toAiStudioSession(raw: AiStudioSessionRaw): AiStudioSession {
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
