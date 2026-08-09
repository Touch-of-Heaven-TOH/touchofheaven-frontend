import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

const content = adminContent.applicationDetail;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type AdminApplicationDetailPageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function AdminApplicationDetailPage({
  params,
}: AdminApplicationDetailPageProps) {
  const { applicationId } = await params;
  return (
    <RouteStatusPage
      content={{
        ...content,
        description: `${content.description} (application ${applicationId})`,
      }}
      href="/admin/applications"
    />
  );
}
