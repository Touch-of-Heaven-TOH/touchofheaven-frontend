import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

const content = adminContent.braiderDetail;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type AdminBusinessDetailPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function AdminBusinessDetailPage({
  params,
}: AdminBusinessDetailPageProps) {
  const { businessId } = await params;
  return (
    <RouteStatusPage
      content={{
        ...content,
        description: `${content.description} (business ${businessId})`,
      }}
      href="/admin/businesses"
    />
  );
}
