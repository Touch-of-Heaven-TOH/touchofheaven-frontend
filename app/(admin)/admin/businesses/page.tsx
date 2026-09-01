import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

const content = adminContent.braiders;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AdminBraidersPage() {
  return <RouteStatusPage content={content} href="/admin" />;
}
