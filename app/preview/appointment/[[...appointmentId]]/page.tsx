import type { Metadata } from "next";
import { AppointmentDetails } from "@/features/bookings/components/AppointmentDetails";

type PreviewAppointmentPageProps = {
  params: Promise<{ appointmentId?: string[] }>;
};

export const metadata: Metadata = {
  title: "Appointment preview",
  robots: { index: false, follow: false },
};

export default async function PreviewAppointmentPage({
  params,
}: PreviewAppointmentPageProps) {
  const appointmentId = (await params).appointmentId?.[0] ?? "TOH-260905-1842";
  return <AppointmentDetails appointmentId={appointmentId} />;
}
