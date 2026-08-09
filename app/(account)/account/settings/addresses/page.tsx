import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

const content = accountContent.addresses;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsAddressesPage() {
  return <RouteStatusPage content={content} href="/account" />;
}
