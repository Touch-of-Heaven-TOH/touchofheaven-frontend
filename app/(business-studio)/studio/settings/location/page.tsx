import type { Metadata } from "next";
import { LocationSettings } from "@/features/studio/components/settings/LocationSettings";

export const metadata: Metadata = {
  title: "Location & travel zones",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LocationSettings />;
}
