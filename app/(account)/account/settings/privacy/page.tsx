import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

const content = accountContent.privacy;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsPrivacyPage() {
  return <RouteStatusPage content={content} href="/account" />;
}
