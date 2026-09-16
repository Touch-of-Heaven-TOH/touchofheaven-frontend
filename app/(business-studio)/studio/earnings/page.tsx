import type { Metadata } from "next";
import { StudioEarningsDashboard } from "@/features/studio/components/earnings/StudioEarningsDashboard";

export const metadata: Metadata = {
  title: "Earnings",
  robots: { index: false, follow: false },
};

export default function StudioEarningsPage() {
  return <StudioEarningsDashboard />;
}
