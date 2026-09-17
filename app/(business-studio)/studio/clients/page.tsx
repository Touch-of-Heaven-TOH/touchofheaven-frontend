import type { Metadata } from "next";
import { ClientsDirectory } from "@/features/studio/components/clients/ClientsDirectory";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

export default function StudioClientsPage() {
  return <ClientsDirectory />;
}
