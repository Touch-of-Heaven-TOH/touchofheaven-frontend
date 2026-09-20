import type { Metadata } from "next";
import { BeautyProfileSettings } from "@/features/account/settings/BeautyProfileSettings";

export const metadata: Metadata = {
  title: "Beauty profile",
  description: "Hair, scalp and skin details providers use to prepare.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BeautyProfileSettings />;
}
