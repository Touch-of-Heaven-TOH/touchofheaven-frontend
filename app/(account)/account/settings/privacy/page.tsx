import type { Metadata } from "next";
import { PrivacySettings } from "@/features/account/settings/PrivacySettings";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What you have agreed to, and a copy of your data.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PrivacySettings />;
}
