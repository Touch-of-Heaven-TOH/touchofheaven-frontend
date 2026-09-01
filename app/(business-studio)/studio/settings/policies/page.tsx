import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { studioContent } from "@/config/page-content";

const content = studioContent.settingsPolicies;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function StudioSettingsPoliciesPage() {
  return <RouteStatusPage content={content} href="/studio" />;
}
