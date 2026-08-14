import type { Metadata } from "next";
import {
  ActivityStrip,
  AiStylePreviewSection,
  BookingProductsInfoSection,
  CommunityLooksSection,
  DemoBraiderProfileSection,
  HeroSection,
  MapPreviewSection,
  MarketplacePreviewSection,
  MobileAppSection,
  PlatformPhonePreviewsSection,
  StyleQuizBanner,
  StylistAvailabilitySection,
  TopBraidersSection,
  TrendingStylesSection,
  TrustHighlightsSection,
} from "@/features/home";
import { getHomePageData } from "@/features/home/api/home.queries";

export const metadata: Metadata = {
  title: "Beauty, braiding, and marketplace",
  description:
    "Book trusted braiding services, explore style inspiration, and preview authentic African marketplace products with Touch of Heaven.",
};

export default async function HomePage() {
  const homeData = await getHomePageData();

  return (
    <>
      <HeroSection />
      <ActivityStrip activity={homeData.activity} />
      <BookingProductsInfoSection />
      <AiStylePreviewSection />
      <TrendingStylesSection />
      <DemoBraiderProfileSection />
      <MarketplacePreviewSection products={homeData.marketplaceProducts} />
      <CommunityLooksSection />
      <TopBraidersSection braiders={homeData.featuredBraiders} />
      <MapPreviewSection />
      <StylistAvailabilitySection />
      <PlatformPhonePreviewsSection />
      <MobileAppSection />
      <StyleQuizBanner />
      <TrustHighlightsSection />
    </>
  );
}
