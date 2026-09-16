import type { Metadata } from "next";
import { AppointmentDetail } from "@/features/studio/components/appointments/AppointmentDetail";

export const metadata: Metadata = {
  title: "Appointment",
  robots: { index: false, follow: false },
};

export default async function StudioAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentDetail appointmentId={id} />;
}
