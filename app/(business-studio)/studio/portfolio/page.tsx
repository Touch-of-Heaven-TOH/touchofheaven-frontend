import type { Metadata } from "next";
import { Images } from "lucide-react";
import { ComingSoon } from "@/features/studio/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false, follow: false },
};

export default function StudioPortfolioPage() {
  return (
    <ComingSoon
      title="Portfolio"
      icon={Images}
      description="Show clients your best work, linked to the services they can book."
      plannedItems={[
        "Upload photos of finished styles with client consent recorded for each one.",
        "Add alternative text, captions and the service each photo shows.",
        "Choose a cover photo and reorder your work by dragging.",
        "Keep drafts private and archive older work without deleting it.",
      ]}
      alternatives={[
        { label: "Manage services", href: "/studio/services" },
        { label: "View completed bookings", href: "/studio/appointments/history" },
      ]}
    />
  );
}
