import type { Metadata } from "next";
import { ProfileSettings } from "@/features/account/settings/ProfileSettings";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your name, photo and contact details.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfileSettings />;
}
