import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

const content = accountContent.paymentMethods;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AccountSettingsPaymentMethodsPage() {
  return <RouteStatusPage content={content} href="/account" />;
}
