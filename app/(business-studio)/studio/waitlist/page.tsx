import type { Metadata } from "next";
import { StudioWaitlist } from "@/features/studio/components/waitlist/StudioWaitlist";

export const metadata: Metadata = {
  title: "Waitlist",
  robots: { index: false, follow: false },
};

export default function StudioWaitlistPage() {
  return <StudioWaitlist />;
}
