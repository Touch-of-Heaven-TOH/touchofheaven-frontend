import type { Metadata } from "next";
import { Suspense } from "react";
import { AppointmentsList } from "@/features/studio/components/appointments/AppointmentsList";
import { SkeletonRows } from "@/features/studio/components/ui/primitives";

export const metadata: Metadata = {
  title: "Appointments",
  robots: { index: false, follow: false },
};

export default function StudioAppointmentsPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading appointments" />}>
      <AppointmentsList />
    </Suspense>
  );
}
