import type { Metadata } from "next";
import { Store } from "lucide-react";
import { ComingSoon } from "@/features/studio/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Business profile",
  robots: { index: false, follow: false },
};

export default function StudioProfileSettingsPage() {
  return (
    <ComingSoon
      title="Business profile"
      icon={Store}
      description="How your business appears to clients in search, on the map and when they book."
      plannedItems={[
        "Edit your business name, description and handle.",
        "Upload your logo and cover photo.",
        "Set your specialties and the languages you speak.",
      ]}
      alternatives={[
        { label: "Business setup status", href: "/business/setup/status" },
        { label: "Services", href: "/studio/services" },
      ]}
    />
  );
}
