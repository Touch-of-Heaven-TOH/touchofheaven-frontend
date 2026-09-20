import type { Metadata } from "next";
import { SettingsLanding } from "@/features/account/settings/SettingsLanding";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your details, privacy and how Touch of Heaven contacts you.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SettingsLanding />;
}
