import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { studioContent } from "@/config/page-content";

const content = studioContent.serviceEdit;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type StudioServiceEditPageProps = {
  params: Promise<{ serviceId: string }>;
};

export default async function StudioServiceEditPage({
  params,
}: StudioServiceEditPageProps) {
  const { serviceId } = await params;
  return (
    <RouteStatusPage
      content={{
        ...content,
        description: `${content.description} (service ${serviceId})`,
      }}
      href="/studio/services"
    />
  );
}
