import type { Metadata } from "next";
import { ClientProfile } from "@/features/studio/components/clients/ClientProfile";

export const metadata: Metadata = {
  title: "Client",
  robots: { index: false, follow: false },
};

export default async function StudioClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return <ClientProfile clientId={clientId} />;
}
