import type { Metadata } from "next";
import { StudioNotificationSettings } from "@/features/studio/components/settings/StudioNotificationSettings";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <StudioNotificationSettings />;
}
