import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";
import { AppointmentDetails } from "@/features/bookings/components/AppointmentDetails";
import { MyBookings } from "@/features/bookings/components/MyBookings";

export const metadata: Metadata = {
  title: "Bookings",
  description: accountContent.appointments.description,
  robots: { index: false, follow: false },
};

type BookingsPageProps = {
  params: Promise<{ appointmentId?: string[] }>;
};

export default async function BookingsPage({ params }: BookingsPageProps) {
  const { appointmentId } = await params;

  if (!appointmentId?.length) {
    return <MyBookings />;
  }

  if (appointmentId.length === 1) {
    return <AppointmentDetails appointmentId={appointmentId[0]!} />;
  }

  return <RouteStatusPage content={accountContent.appointments} href="/book" />;
}
