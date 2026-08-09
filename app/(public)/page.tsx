import type { Metadata } from "next";
import {
  ActivityStrip,
  AiStylePreviewSection,
  CommunityLooksSection,
  HeroSection,
  MapPreviewSection,
  MarketplacePreviewSection,
  StyleQuizBanner,
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
      <AiStylePreviewSection />
      <TrendingStylesSection />
      <MarketplacePreviewSection products={homeData.marketplaceProducts} />
      <CommunityLooksSection />
      <TopBraidersSection braiders={homeData.featuredBraiders} />
      <MapPreviewSection />
      <StyleQuizBanner />
      <TrustHighlightsSection />
    </>
  );
}
