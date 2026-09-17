import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingRequests } from "@/features/studio/components/appointments/BookingRequests";
import { SkeletonRows } from "@/features/studio/components/ui/primitives";

export const metadata: Metadata = {
  title: "Booking requests",
  robots: { index: false, follow: false },
};

export default function StudioBookingRequestsPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading booking requests" />}>
      <BookingRequests />
    </Suspense>
  );
}
