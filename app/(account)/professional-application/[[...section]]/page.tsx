import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

export const metadata: Metadata = {
  title: "Professional application",
  description: accountContent.application.description,
  robots: { index: false, follow: false },
};

export default function ProfessionalApplicationPage() {
  return (
    <RouteStatusPage content={accountContent.application} href="/account" />
  );
}
