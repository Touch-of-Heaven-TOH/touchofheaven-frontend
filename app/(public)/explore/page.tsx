import type { Metadata } from "next";
import { ExploreDiscoveryPage } from "@/features/discovery/DiscoveryModule";

export const metadata: Metadata = {
  title: "Explore | Touch of Heaven",
  description:
    "Discover verified beauty and wellness businesses, compare services, and book with confidence.",
};

export default function ExplorePage() {
  return <ExploreDiscoveryPage />;
}
