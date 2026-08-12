import type { Metadata } from "next";
import { NotificationPreferences } from "@/features/account/components/NotificationPreferences";
import { accountContent } from "@/config/page-content";

const content = accountContent.notifications;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsNotificationsPage() {
  return <NotificationPreferences />;
}
