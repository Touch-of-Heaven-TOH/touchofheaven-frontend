import type {
  HomeMediaAsset,
  PublicHomeActivity,
  PublicHomeBraider,
  PublicHomeProduct,
} from "@/features/home/types/home.types";

export type PublicHomePagePayload = {
  activity: PublicHomeActivity[];
  featuredBraiders: PublicHomeBraider[];
  marketplaceProducts: PublicHomeProduct[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseMediaAsset(value: unknown): HomeMediaAsset | undefined {
  if (!isRecord(value)) return undefined;

  const src = asString(value.src);
  const alt = asString(value.alt);
  const width = asNumber(value.width);
  const height = asNumber(value.height);

  if (!src || !alt || !width || !height) return undefined;

  return {
    src,
    alt,
    width,
    height,
    aspectRatio: Number((width / height).toFixed(2)),
    focalPoint: asString(value.focalPoint) ?? "center center",
  };
}

function parseActivityItem(value: unknown): PublicHomeActivity | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const label = asString(value.label);
  const detail = asString(value.detail);
  const occurredAt = asString(value.occurredAt);

  if (!id || !label || !detail || !occurredAt) return null;

  return { id, label, detail, occurredAt };
}

function parseBraider(value: unknown): PublicHomeBraider | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const name = asString(value.name);
  const specialty = asString(value.specialty);
  const location = asString(value.location);
  const href = asString(value.href);
  const ratingAverage = asNumber(value.ratingAverage);
  const ratingCount = asNumber(value.ratingCount) ?? 0;

  if (!id || !name || !specialty || !location || !href) return null;

  return {
    id,
    name,
    specialty,
    location,
    href,
    image: parseMediaAsset(value.image),
    ratingAverage,
    ratingCount,
  };
}

function parseProduct(value: unknown): PublicHomeProduct | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const name = asString(value.name);
  const category = asString(value.category);
  const href = asString(value.href);
  const priceLabel = asString(value.priceLabel);
  const ratingAverage = asNumber(value.ratingAverage);
  const ratingCount = asNumber(value.ratingCount) ?? 0;

  if (!id || !name || !category || !href) return null;

  return {
    id,
    name,
    category,
    href,
    image: parseMediaAsset(value.image),
    priceLabel,
    ratingAverage,
    ratingCount,
  };
}

function parseArray<TItem>(
  value: unknown,
  parser: (item: unknown) => TItem | null,
): TItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(parser).filter((item): item is TItem => item !== null);
}

export function parsePublicHomePagePayload(
  value: unknown,
): PublicHomePagePayload {
  if (!isRecord(value)) {
    return { activity: [], featuredBraiders: [], marketplaceProducts: [] };
  }

  return {
    activity: parseArray(value.activity, parseActivityItem),
    featuredBraiders: parseArray(value.featuredBraiders, parseBraider),
    marketplaceProducts: parseArray(value.marketplaceProducts, parseProduct),
  };
}
