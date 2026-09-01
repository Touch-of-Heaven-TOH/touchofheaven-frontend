import type { Metadata } from "next";
import { StudioEarnings } from "@/features/studio/components/StudioEarnings";
import { studioContent } from "@/config/page-content";

const content = studioContent.earnings;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function StudioEarningsPage() {
  return <StudioEarnings />;
}
