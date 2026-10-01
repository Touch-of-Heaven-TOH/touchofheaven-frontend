import type { Metadata } from "next";
import { ClientHome } from "@/features/client-home/ClientHome";

export const metadata: Metadata = {
  title: "Home",
  description: "Your appointments, saved professionals and what's near you.",
  robots: { index: false, follow: false },
};

export default function ClientHomePage() {
  return <ClientHome />;
}
