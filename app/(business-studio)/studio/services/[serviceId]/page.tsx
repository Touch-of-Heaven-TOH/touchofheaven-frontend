import type { Metadata } from "next";
import { ServiceEditor } from "@/features/studio/components/services/ServiceEditor";

export const metadata: Metadata = {
  title: "Edit service",
  robots: { index: false, follow: false },
};

export default async function StudioEditServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  return <ServiceEditor serviceId={serviceId} />;
}
