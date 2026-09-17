import type { Metadata } from "next";
import { CompleteFlow } from "@/features/studio/components/appointments/flow/CompleteFlow";

export const metadata: Metadata = {
  title: "Complete appointment",
  robots: { index: false, follow: false },
};

export default async function StudioCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompleteFlow appointmentId={id} />;
}
