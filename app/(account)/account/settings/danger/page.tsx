import type { Metadata } from "next";
import { DangerZoneSettings } from "@/features/account/settings/DangerZoneSettings";

export const metadata: Metadata = {
  title: "Danger zone",
  description: "Delete your Touch of Heaven account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DangerZoneSettings />;
}
