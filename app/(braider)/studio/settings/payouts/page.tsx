import type { Metadata } from "next";
import { StudioPayouts } from "@/features/studio/components/StudioPayouts";
import { studioContent } from "@/config/page-content";

const content = studioContent.settingsPayouts;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function StudioSettingsPayoutsPage() {
  return <StudioPayouts />;
}
