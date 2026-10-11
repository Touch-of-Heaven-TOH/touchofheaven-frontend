import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileScreen } from "@/features/app/profile/ProfileScreen";

type AccountPageProps = {
  params: Promise<{ section?: string[] }>;
};

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account, favourites and settings.",
  robots: { index: false, follow: false },
};

// Every /account/settings/* path has its own page.tsx, which Next.js
// resolves before this catch-all. Bookings moved to the Bookings tab;
// anything else unrecognised lands on the profile hub.
export default async function AccountPage({ params }: AccountPageProps) {
  const { section } = await params;
  if (section?.[0] === "appointments") redirect("/bookings");
  if (section?.length) redirect("/account");
  return <ProfileScreen />;
}
