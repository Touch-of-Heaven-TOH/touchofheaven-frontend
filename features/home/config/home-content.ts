import { homeMediaAssets } from "@/features/home/config/hero-media";
import type {
  HomeApiContract,
  HomeFeature,
  HomeImageCard,
  HomeLink,
  HomeSectionIntro,
} from "@/features/home/types/home.types";

export const homePrimaryActions = {
  book: { label: "Book a Hairstyle", href: "/book" },
  marketplace: { label: "Shop Marketplace", href: "/marketplace" },
  businesses: { label: "Find Businesses", href: "/businesses" },
  aiStudio: { label: "Start AI Style Preview", href: "/ai-studio" },
  styleQuiz: { label: "Take the Style Quiz", href: "/style-quiz" },
} satisfies Record<string, HomeLink>;

export const heroSearchSuggestions = [
  "Knotless braids",
  "Cornrows",
  "Boho braids",
  "Loc maintenance",
  "Hair care",
  "African fashion",
] as const;

export const trustFeatures = [
  {
    title: "Verified Businesses",
    description: "Public profiles are reviewed before they appear in discovery.",
    icon: "verified",
  },
  {
    title: "Secure Booking",
    description: "Sessions stay in HTTP-only cookies with backend CSRF checks.",
    icon: "lock",
  },
  {
    title: "AI Style Preview",
    description: "Try a look direction before starting the booking flow.",
    icon: "sparkles",
  },
  {
    title: "Fast Delivery",
    description: "Marketplace shipping rules stay separate from appointments.",
    icon: "delivery",
  },
] satisfies HomeFeature[];

export const aiPreviewSteps = [
  "Upload an approved selfie",
  "Choose a style direction",
  "Preview before booking",
] as const;

export const trendingStyleIntro = {
  eyebrow: "Trending Styles",
  title: "Book top looks",
  description:
    "Browse protective styles and start the booking journey without exposing private appointment details.",
  action: { label: "View all styles", href: "/beauty" },
} satisfies HomeSectionIntro;

export const trendingStyles = [
  {
    title: "Knotless Braids",
    description: "Lightweight, flexible, and polished for everyday wear.",
    href: "/book?style=knotless-braids",
    image: homeMediaAssets.primaryHero,
  },
  {
    title: "Boho Braids",
    description: "Soft texture and movement with a premium finish.",
    href: "/book?style=boho-braids",
    image: homeMediaAssets.studioBooking,
  },
  {
    title: "Cornrows",
    description: "Clean parting and lasting shape from reviewed professionals.",
    href: "/book?style=cornrows",
    image: homeMediaAssets.braidingDetail,
  },
  {
    title: "Goddess Braids",
    description: "Statement braids with an elevated special-occasion feel.",
    href: "/book?style=goddess-braids",
    image: homeMediaAssets.stylePortrait,
  },
] satisfies HomeImageCard[];

export const marketplaceIntro = {
  eyebrow: "Marketplace",
  title: "Shop authentic African products",
  description:
    "Browse hair care, fashion, pantry favorites, and aftercare products curated for style days and everyday care.",
  action: { label: "Open marketplace", href: "/marketplace" },
} satisfies HomeSectionIntro;

export const marketplaceCategories = [
  {
    title: "Hair & Beauty",
    description: "Oils, creams, bonnets, and aftercare essentials.",
    href: "/marketplace?category=hair-beauty",
    image: homeMediaAssets.marketplaceMixedProducts,
  },
  {
    title: "African Fashion",
    description: "Print bags, wraps, accessories, and occasion pieces.",
    href: "/marketplace?category=fashion",
    image: homeMediaAssets.marketplaceMixedProducts,
  },
  {
    title: "Health & Wellness",
    description: "Self-care products curated for the community.",
    href: "/marketplace?category=wellness",
    image: homeMediaAssets.bookingMarketplace,
  },
  {
    title: "Spices & Foods",
    description: "Pantry favorites for home, gifting, and gatherings.",
    href: "/marketplace?category=spices-foods",
    image: homeMediaAssets.marketplaceMixedProducts,
  },
] satisfies HomeImageCard[];

export const communityIntro = {
  eyebrow: "From our community",
  title: "Real styles. Real people. Real confidence.",
  description:
    "See appointment moments, finished protective styles, and product care details from the Touch of Heaven community.",
  action: { label: "Explore styles", href: "/beauty" },
} satisfies HomeSectionIntro;

export const communityLooks = [
  {
    title: "Booked and braided",
    description: "A polished appointment moment with the client already checking the next step.",
    href: "/beauty?gallery=booked-and-braided",
    image: homeMediaAssets.communitySalon,
  },
  {
    title: "Studio appointment",
    description: "A calm salon experience with digital booking support.",
    href: "/how-it-works",
    image: homeMediaAssets.studioBooking,
  },
  {
    title: "Protective style",
    description: "A finished style with clean parting and shine.",
    href: "/beauty?gallery=protective-styles",
    image: homeMediaAssets.stylePortrait,
  },
  {
    title: "Braiding in progress",
    description: "Detail-focused parting and steady hands.",
    href: "/beauty?gallery=process",
    image: homeMediaAssets.braidingDetail,
  },
] satisfies HomeImageCard[];

export const appPromoFeatures = [
  "Book appointments on the go",
  "Review business profiles",
  "Track marketplace orders",
] as const;

export const requiredHomeApiContracts = [
  {
    name: "Public homepage feed",
    endpoint: "/api/v1/public/homepage",
    purpose:
      "Single response for public activity, featured businesses, published services, and marketplace previews.",
    status: "pending",
  },
  {
    name: "Nearby businesses",
    endpoint: "/api/v1/braiders/nearby",
    purpose:
      "Already used by discovery map; homepage can reuse it for location-aware business cards once approved.",
    status: "available",
  },
  {
    name: "Marketplace catalog preview",
    endpoint: "/api/v1/marketplace/public/products",
    purpose:
      "Published product cards with public price/rating data only; no private inventory or seller details.",
    status: "pending",
  },
] satisfies HomeApiContract[];
