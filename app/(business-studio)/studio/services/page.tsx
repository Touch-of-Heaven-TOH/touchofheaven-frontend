import type { Metadata } from "next";
import { StudioServices } from "@/features/studio/components/services/StudioServices";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default function StudioServicesPage() {
  return <StudioServices />;
}
