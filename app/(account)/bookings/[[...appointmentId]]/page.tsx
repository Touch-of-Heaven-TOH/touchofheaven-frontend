import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";
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

  // No segments: the real "My Bookings" list. A specific appointmentId
  // (detail view - reschedule, cancel, contact quick actions) stays the
  // placeholder for now; that's a separate, larger piece of work.
  if (!appointmentId?.length) {
    return <MyBookings />;
  }

  return <RouteStatusPage content={accountContent.appointments} href="/book" />;
}
