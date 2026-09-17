import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingHistory } from "@/features/studio/components/appointments/BookingHistory";
import { SkeletonRows } from "@/features/studio/components/ui/primitives";

export const metadata: Metadata = {
  title: "Booking history",
  robots: { index: false, follow: false },
};

export default function StudioBookingHistoryPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading booking history" />}>
      <BookingHistory />
    </Suspense>
  );
}
