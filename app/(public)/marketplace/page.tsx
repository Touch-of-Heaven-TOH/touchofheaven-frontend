import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceScreen } from "@/features/app/market/MarketplaceScreen";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Hair, skin and grooming products from beauty businesses in Douala and Yaoundé.",
};

export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceScreen />
    </Suspense>
  );
}
