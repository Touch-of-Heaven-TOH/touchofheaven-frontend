import type { SafeUser } from "@/types/auth";

export type AiStudioCategory =
  | "Knotless Braids"
  | "Boho Braids"
  | "Passion Twists"
  | "Faux Locs"
  | "French Curl"
  | "Box Braids"
  | "Goddess Braids"
  | "Cornrows"
  | "Locs & Twists"
  | "Feed-In Braids";

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
  density: string;
  length: string;
  parting: string;
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
