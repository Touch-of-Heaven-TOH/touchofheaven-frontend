import type { Metadata } from "next";
import { StudioAnalytics } from "@/features/studio/components/analytics/StudioAnalytics";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function StudioAnalyticsPage() {
  return <StudioAnalytics />;
}
