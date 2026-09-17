import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { ComingSoon } from "@/features/studio/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Location",
  robots: { index: false, follow: false },
};

export default function StudioLocationSettingsPage() {
  return (
    <ComingSoon
      title="Location & travel zones"
      icon={MapPin}
      description="Where you work, and how far you travel for mobile appointments."
      plannedItems={[
        "Edit your salon or studio address on the live map.",
        "Choose when a private studio address is revealed to clients.",
        "Draw the travel zone for mobile appointments.",
      ]}
      alternatives={[
        { label: "Availability", href: "/studio/settings/availability" },
        { label: "See your business on the map", href: "/map" },
      ]}
    />
  );
}
