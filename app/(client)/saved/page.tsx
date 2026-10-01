import type { Metadata } from "next";
import { SavedProfessionals } from "@/features/client-home/SavedProfessionals";

export const metadata: Metadata = {
  title: "Saved professionals",
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedProfessionals />;
}
