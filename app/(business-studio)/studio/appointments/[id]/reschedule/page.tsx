import type { Metadata } from "next";
import { RescheduleFlow } from "@/features/studio/components/appointments/flow/RescheduleFlow";

export const metadata: Metadata = {
  title: "Reschedule",
  robots: { index: false, follow: false },
};

export default async function StudioReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RescheduleFlow appointmentId={id} />;
}
