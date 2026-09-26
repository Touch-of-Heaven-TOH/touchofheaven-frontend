import type { Metadata } from "next";
import { StudioPortfolio } from "@/features/studio/components/portfolio/StudioPortfolio";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false, follow: false },
};

export default function StudioPortfolioPage() {
  return <StudioPortfolio />;
}
