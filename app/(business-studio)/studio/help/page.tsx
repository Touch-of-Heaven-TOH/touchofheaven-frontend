import type { Metadata } from "next";
import { StudioHelp } from "@/features/studio/components/help/StudioHelp";

export const metadata: Metadata = {
  title: "Help & support",
  robots: { index: false, follow: false },
};

export default function StudioHelpPage() {
  return <StudioHelp />;
}
