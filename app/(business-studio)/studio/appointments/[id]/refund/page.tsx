import type { Metadata } from "next";
import { RefundFlow } from "@/features/studio/components/appointments/flow/RefundFlow";

export const metadata: Metadata = {
  title: "Refund",
  robots: { index: false, follow: false },
};

export default async function StudioRefundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RefundFlow appointmentId={id} />;
}
