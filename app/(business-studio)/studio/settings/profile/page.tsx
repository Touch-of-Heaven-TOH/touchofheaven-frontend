import type { Metadata } from "next";
import { BusinessProfileSettings } from "@/features/studio/components/settings/BusinessProfileSettings";

export const metadata: Metadata = {
  title: "Business profile",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BusinessProfileSettings />;
}
