import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

export const metadata: Metadata = {
  title: "Bookings",
  description: accountContent.appointments.description,
  robots: { index: false, follow: false },
};

export default function BookingsPage() {
  return <RouteStatusPage content={accountContent.appointments} href="/book" />;
}
