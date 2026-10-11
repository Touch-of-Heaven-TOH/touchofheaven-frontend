/**
 * Response shapes the redesigned screens read, mirroring Backend-of-TOH by
 * hand (the repos share no code). Money is always integer minor units.
 */
import type { BusinessCategory } from "@/lib/app/business-look";
import type { NearbyBraider } from "@/lib/discovery/types";

export type AppNearbyBusiness = NearbyBraider & {
  businessName: string | null;
  businessCategory: BusinessCategory | null;
  handle: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
};

export type TeamMemberSummary = {
  id: string;
  displayName: string;
  jobTitle: string | null;
  role: string;
};

export type BusinessPolicy = {
  cancellationPolicy: { key: string; label: string; description: string } | null;
  depositRequired: boolean;
  depositPercent: number | null;
  cancellationHours: number | null;
};

export type BusinessProfile = {
  braiderId: string;
  professionalName: string;
  businessName: string | null;
  businessCategory: BusinessCategory | null;
  workMode: "SOLO" | "TEAM" | null;
  locationModel: "PUBLIC_SALON" | "PRIVATE_STUDIO" | "MOBILE" | null;
  verifiedAt: string | null;
  handle: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  businessPhone: string | null;
  yearsOfExperience: number | null;
  languages: string[];
  socialLinks: { instagram: string | null; facebook: string | null; tiktok: string | null; website: string | null } | null;
  bio: string | null;
  acceptsNewClients: boolean;
  rating: { average: number | null; count: number };
  specialties: string[];
  team: TeamMemberSummary[];
  policy: BusinessPolicy | null;
};

export type Variation = {
  id: string;
  variationType?: string;
  label: string;
  priceDeltaCents: number;
  durationDeltaMins: number;
  isRequired?: boolean;
};

export type Service = {
  id: string;
  braiderId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  basePriceCents: number;
  baseDurationMins: number;
  depositPercentage: number;
  cancellationPolicy: string;
  variations: Variation[];
  media: { id: string; url: string; altText: string }[];
};

export type Review = {
  id: string;
  rating: number;
  reviewBody: string;
  createdAt: string;
  service: { id: string; name: string };
  response: { responseBody: string; respondedAt: string } | null;
};

export type BusinessLocation = {
  id: string;
  locationType: "PUBLIC_SALON" | "PRIVATE_STUDIO";
  label: string | null;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};

export type Appointment = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  computedPriceCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  serviceName: string | null;
  braiderName: string | null;
  locationDescription: string | null;
  braiderId?: string;
  serviceId?: string;
  teamMemberName?: string | null;
  reviewed?: boolean;
};

export type Favorite = {
  braiderId: string;
  name: string;
  professionalName: string;
  logoUrl: string | null;
  handle: string | null;
  savedAt: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  title: string;
  priceCents: number;
  currency: string;
  availableToSell: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  sellerId: string;
  sellerName: string;
  category: { id: string; name: string; slug: string };
  name: string;
  slug: string;
  descriptionHtml: string | null;
  status: string;
  variants: ProductVariant[];
  media: { id: string; url: string; altText: string }[];
  publishedAt: string | null;
};

export type CommerceCategory = { id: string; name: string; slug: string };

export type CartItem = {
  id: string;
  productVariantId: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  lineTotalCents: number;
  availableToSell: number;
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
    sellerId?: string;
    sellerName?: string;
    category: { id: string; name: string; slug: string };
  };
  variant: { id: string; sku: string; title: string };
};

export type Cart = {
  id: string | null;
  status: string;
  items: CartItem[];
  subtotalCents: number;
};

export type Order = {
  id: string;
  status: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  sellerGroups: {
    id: string;
    sellerId: string;
    sellerName: string;
    status: string;
    lineItems: {
      id: string;
      productVariantId: string;
      quantity: number;
      unitPriceCents: number;
      productSnapshot: { productName?: string; name?: string; variantTitle?: string } | null;
      status: string;
    }[];
    fulfilments: { id: string; status: string; shippedAt: string | null; deliveredAt: string | null }[];
  }[];
  placedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type Address = {
  id: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  locality: string;
  administrativeArea: string | null;
  countryCode: string;
  purpose: string;
  isDefault: boolean;
};

export type Conversation = {
  id: string;
  appointmentId: string | null;
  lastMessageAt: string;
  unreadCount: number;
  counterpart: { id: string; name: string; isBusiness?: boolean; businessCategory?: BusinessCategory | null };
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
};

export type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type AppointmentDetail = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  durationMins: number;
  computedPriceCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  checkInCode: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  serviceId?: string;
  teamMemberName?: string | null;
  reviewed?: boolean;
  business: { id: string; name: string; professionalName: string; phone: string | null; timezone: string };
  location: { label: string; locationType: string };
  cancellationPolicy: { key: string; label: string; description: string };
  snapshot: {
    serviceName: string;
    braiderName: string;
    braiderLocationDescription: string | null;
    variationSelections: unknown;
  } | null;
  pendingChangeRequest: {
    id: string;
    type: "RESCHEDULE" | "CANCELLATION";
    requestedStartAt: string | null;
    reason: string;
    createdAt: string;
  } | null;
  canRequestChange: boolean;
};
