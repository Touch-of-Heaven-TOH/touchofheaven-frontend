import type { Metadata } from "next";
import { StudioAvailability } from "@/features/studio/components/availability/StudioAvailability";

export const metadata: Metadata = {
  title: "Availability",
  robots: { index: false, follow: false },
};

export default function StudioAvailabilityPage() {
  return <StudioAvailability />;
}
