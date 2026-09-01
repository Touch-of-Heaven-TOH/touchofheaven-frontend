import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { studioContent } from "@/config/page-content";

const content = studioContent.portfolio;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function StudioPortfolioPage() {
  return <RouteStatusPage content={content} href="/studio" />;
}
