import type { Metadata } from "next";
import { PortfolioModeration } from "@/features/admin/moderation/PortfolioModeration";

export const metadata: Metadata = {
  title: "Portfolio moderation",
  description: "Decide whether a client's photo may go on a provider's public profile.",
  robots: { index: false, follow: false },
};

export default function AdminModerationPage() {
  return <PortfolioModeration />;
}
