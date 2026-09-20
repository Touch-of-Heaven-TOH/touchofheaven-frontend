import type { Metadata } from "next";
import { PolicySettings } from "@/features/studio/components/settings/PolicySettings";

export const metadata: Metadata = {
  title: "Policies",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PolicySettings />;
}
