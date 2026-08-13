export type HomeMediaAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
  focalPoint: string;
};

export type HeroMediaItem = {
  id: string;
  type: "image";
  source: string;
  mobileSource?: string;
  poster?: string;
  alternativeText: string;
  focalPoint: string;
  displayDurationMs: number;
  priority: boolean;
  autoplay: boolean;
  loop: boolean;
  overlayStrength: "light" | "medium" | "strong";
  ctaRelation: "book" | "marketplace" | "ai-preview";
};

export type HomeLink = {
  label: string;
  href: string;
  description?: string;
};

export type HomeSectionIntro = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: HomeLink;
};

export type HomeFeature = {
  title: string;
  description: string;
  icon: "verified" | "lock" | "sparkles" | "delivery" | "map" | "support";
};

export type HomeImageCard = {
  title: string;
  description: string;
  href: string;
  image: HomeMediaAsset;
};

export type HomeApiContract = {
  name: string;
  endpoint: string;
  purpose: string;
  status: "available" | "pending";
};

export type DynamicSectionStatus = "ready" | "empty" | "unavailable";

export type DynamicSection<TItem> = {
  status: DynamicSectionStatus;
  endpoint: string;
  items: TItem[];
  message: string;
};

export type PublicHomeActivity = {
  id: string;
  label: string;
  detail: string;
  occurredAt: string;
};

export type PublicHomeBraider = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  href: string;
  image?: HomeMediaAsset;
  ratingAverage: number | null;
  ratingCount: number;
};

export type PublicHomeProduct = {
  id: string;
  name: string;
  category: string;
  href: string;
  image?: HomeMediaAsset;
  priceLabel: string | null;
  ratingAverage: number | null;
  ratingCount: number;
};

export type HomePageData = {
  source: "backend" | "pending-contract" | "unavailable";
  activity: DynamicSection<PublicHomeActivity>;
  featuredBraiders: DynamicSection<PublicHomeBraider>;
  marketplaceProducts: DynamicSection<PublicHomeProduct>;
};
