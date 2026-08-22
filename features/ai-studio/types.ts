import type { SafeUser } from "@/types/auth";

// The first 8 are the real backend TryOnCategory values (mapped from
// SCREAMING_SNAKE_CASE by CATEGORY_LABELS in api/studio.api.ts). The last 3
// ("Passion Twists"/"Faux Locs"/"French Curl") only exist in the local
// fallback catalog (data/fallback-catalog.ts) - kept here so that catalog
// still type-checks, not because the backend serves them.
export type AiStudioCategory =
  | "Knotless Braids"
  | "Box Braids"
  | "Goddess Braids"
  | "Cornrows"
  | "Locs & Twists"
  | "Feed-In Braids"
  | "Boho Braids"
  | "Protective Styles"
  | "Fade"
  | "Taper"
  | "Buzz Cut"
  | "Line Up"
  | "Waves"
  | "Afro"
  | "Passion Twists"
  | "Faux Locs"
  | "French Curl";

export type AiStudioAudience = "WOMEN" | "MEN" | "UNISEX";

export type AiStudioImageAngle = "front" | "side" | "back" | "detail";

export type AiStudioStyleImage = {
  url: string;
  angle: AiStudioImageAngle;
  alt: string;
};

export type AiStudioStyle = {
  id: string;
  slug: string;
  name: string;
  category: AiStudioCategory;
  audience?: AiStudioAudience;
  // density/length/parting/texture only ever have real values in the local
  // fallback catalog - the real backend catalog (scraped, not hand-curated)
  // doesn't capture this level of per-style detail yet, so these are
  // optional rather than a promise every style can keep.
  density?: string;
  length?: string;
  parting?: string;
  texture?: string;
  thumbnailUrl: string;
  images: AiStudioStyleImage[];
  availableColors: string[];
  availableSizes: string[];
  availableLengths: string[];
};

export type AiStudioColor = {
  id: string;
  code: string;
  name: string;
  group: "Black" | "Brown" | "Blonde" | "Blends";
  swatchColors: string[];
};

export type AiStudioCreditBalance = {
  balance: number;
  lifetimeEarned?: number;
  lifetimeConsumed?: number;
};

export type AiStudioSessionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type AiStudioSession = {
  id: string;
  styleName: string;
  styleSlug: string;
  selectedColor: string;
  selectedSize: string;
  selectedLength: string;
  inputImageUrl?: string;
  resultImageUrl?: string;
  status: AiStudioSessionStatus;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
};

export type AiStudioUploadAuthorization = {
  uploadUrl: string;
  objectKey: string;
};

// Raw shape of GET /api/v1/studio/sessions/:id (and the sessions list) as
// the backend actually serializes it (see studio.service.ts's
// serializeSessionDetail) - toAiStudioSession() in api/studio.api.ts adapts
// this into AiStudioSession below.
export type AiStudioSessionRaw = {
  id: string;
  status: AiStudioSessionStatus;
  inputImageUrl: string;
  outputImageUrl: string | null;
  selectedColor: string;
  selectedSize: string;
  selectedLength: string;
  style: { name: string; slug: string; thumbnailUrl: string };
  creditsConsumed: number;
  createdAt: string;
  updatedAt: string;
  message?: string;
};

export type AiStudioGenerateResponse = {
  sessionId: string;
};

export type AiStudioExperienceProps = {
  initialUser: SafeUser | null;
  initialStyleId?: string | null;
  initialColorId?: string | null;
  initialStyles?: AiStudioStyle[];
  initialCatalogSource?: "backend" | "fallback";
  initialCatalogError?: string | null;
};
