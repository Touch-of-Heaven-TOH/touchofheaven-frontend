import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

const content = adminContent.disputeDetail;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type AdminDisputeDetailPageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function AdminDisputeDetailPage({
  params,
}: AdminDisputeDetailPageProps) {
  const { caseId } = await params;
  return (
    <RouteStatusPage
      content={{ ...content, description: `${content.description} (case ${caseId})` }}
      href="/admin/disputes"
    />
  );
}
