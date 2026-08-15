import type { Metadata } from "next";
import {
  ActivityStrip,
  BookingProductsInfoSection,
  HeroSection,
  MarketplacePreviewSection,
  TopBraidersSection,
} from "@/features/home";
import { CountrySourceSection } from "@/features/home/components/sections/CountrySourceSection";
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
      <BookingProductsInfoSection />
      <ActivityStrip activity={homeData.activity} />
      <TopBraidersSection braiders={homeData.featuredBraiders} />
      <CountrySourceSection />
      <MarketplacePreviewSection products={homeData.marketplaceProducts} />
    </>
  );
}
