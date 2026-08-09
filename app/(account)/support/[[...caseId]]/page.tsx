import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

export const metadata: Metadata = {
  title: "Support",
  description: accountContent.support.description,
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return <RouteStatusPage content={accountContent.support} href="/account" />;
}
