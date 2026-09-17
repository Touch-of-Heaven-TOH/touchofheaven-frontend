import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/features/studio/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Notification settings",
  robots: { index: false, follow: false },
};

export default function StudioNotificationSettingsPage() {
  return (
    <ComingSoon
      title="Notifications"
      icon={Bell}
      description="Choose how you hear about new bookings, requests and payments."
      plannedItems={[
        "Turn email and text alerts on or off for each kind of event.",
        "Set quiet hours so alerts wait until the morning.",
        "Choose which team members receive booking alerts.",
      ]}
      alternatives={[{ label: "Account notification preferences", href: "/account/settings/notifications" }]}
    />
  );
}
