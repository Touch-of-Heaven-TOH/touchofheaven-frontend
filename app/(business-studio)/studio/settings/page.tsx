import type { Metadata } from "next";
import { StudioSettings } from "@/features/studio/components/settings/StudioSettings";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function StudioSettingsPage() {
  return <StudioSettings />;
}
