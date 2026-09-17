import type { Metadata } from "next";
import { CancelFlow } from "@/features/studio/components/appointments/flow/CancelFlow";

export const metadata: Metadata = {
  title: "Cancellation",
  robots: { index: false, follow: false },
};

export default async function StudioCancellationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CancelFlow appointmentId={id} />;
}
