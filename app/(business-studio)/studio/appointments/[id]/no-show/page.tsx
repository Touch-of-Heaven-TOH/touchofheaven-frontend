import type { Metadata } from "next";
import { NoShowFlow } from "@/features/studio/components/appointments/flow/NoShowFlow";

export const metadata: Metadata = {
  title: "Mark as no-show",
  robots: { index: false, follow: false },
};

export default async function StudioNoShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoShowFlow appointmentId={id} />;
}
