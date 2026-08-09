import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { studioContent } from "@/config/page-content";

const content = studioContent.clientDetail;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type StudioClientDetailPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function StudioClientDetailPage({
  params,
}: StudioClientDetailPageProps) {
  const { clientId } = await params;
  return (
    <RouteStatusPage
      content={{
        ...content,
        description: `${content.description} (client ${clientId})`,
      }}
      href="/studio/clients"
    />
  );
}
