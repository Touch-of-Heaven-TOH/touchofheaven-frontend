import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

const content = adminContent.braiderDetail;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type AdminBraiderDetailPageProps = {
  params: Promise<{ braiderId: string }>;
};

export default async function AdminBraiderDetailPage({
  params,
}: AdminBraiderDetailPageProps) {
  const { braiderId } = await params;
  return (
    <RouteStatusPage
      content={{
        ...content,
        description: `${content.description} (braider ${braiderId})`,
      }}
      href="/admin/braiders"
    />
  );
}
