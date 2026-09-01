import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { studioContent } from "@/config/page-content";

const content = studioContent.appointmentDetail;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

type StudioAppointmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioAppointmentDetailPage({
  params,
}: StudioAppointmentDetailPageProps) {
  const { id } = await params;
  return (
    <RouteStatusPage
      content={{
        ...content,
        description: `${content.description} (appointment ${id})`,
      }}
      href="/studio/appointments"
    />
  );
}
