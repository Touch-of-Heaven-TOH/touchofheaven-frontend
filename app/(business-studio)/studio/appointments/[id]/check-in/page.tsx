import type { Metadata } from "next";
import { CheckInFlow } from "@/features/studio/components/appointments/flow/CheckInFlow";

export const metadata: Metadata = {
  title: "Check in client",
  robots: { index: false, follow: false },
};

export default async function StudioCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CheckInFlow appointmentId={id} />;
}
