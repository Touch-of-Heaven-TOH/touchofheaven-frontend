import type { Metadata } from "next";
import { StudioOverview } from "@/features/studio/components/overview/StudioOverview";

// The Studio home lives in the optional catch-all rather than a sibling
// page.tsx: Next.js rejects a literal /studio page at the same specificity
// as an optional catch-all's zero-segment match. Every real section has its
// own page.tsx, which Next.js resolves ahead of this catch-all, so an
// unknown /studio/... path also lands here on Home instead of a hard 404.
export const metadata: Metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

export default function StudioHomePage() {
  return <StudioOverview />;
}
