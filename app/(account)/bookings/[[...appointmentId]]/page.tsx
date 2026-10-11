import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";
import { AppointmentScreen } from "@/features/app/bookings/AppointmentScreen";
import { BookingsScreen } from "@/features/app/bookings/BookingsScreen";

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
    return (
      <Suspense>
        <BookingsScreen />
      </Suspense>
    );
  }

  if (appointmentId.length === 1) {
    return (
      <Suspense>
        <AppointmentScreen id={appointmentId[0]!} />
      </Suspense>
    );
  }

  return <RouteStatusPage content={accountContent.appointments} href="/businesses" />;
}
