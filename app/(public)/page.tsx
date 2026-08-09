import type { Metadata } from "next";
import {
  DiscoverySearch,
  FeaturedBraiders,
  FinalCallToAction,
  HeroSection,
  HowItWorks,
  ServiceCategories,
  TrustAndSafety,
} from "@/features/home";

export const metadata: Metadata = {
  title: "African hair braiding appointments",
  description:
    "Discover verified braiders, compare services, and start a secure booking with Touch of Heaven.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DiscoverySearch />
      <ServiceCategories />
      <FeaturedBraiders />
      <HowItWorks />
      <TrustAndSafety />
      <FinalCallToAction />
    </>
  );
}
