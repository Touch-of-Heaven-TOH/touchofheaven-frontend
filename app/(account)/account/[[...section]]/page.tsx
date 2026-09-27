import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHome } from "@/features/account/overview/AccountHome";

type AccountPageProps = {
  params: Promise<{ section?: string[] }>;
};

// Every /account/settings/* path has its own page.tsx, which Next.js
// resolves before this catch-all - so this only ever sees no segments
// (the account home), /appointments, or an unrecognized path.

export const metadata: Metadata = {
  title: "Account",
  description: "Your appointments, saved looks and anything that needs you.",
  robots: { index: false, follow: false },
};

export default async function AccountPage({ params }: AccountPageProps) {
  const segments = (await params).section;

  // Bookings have lived at /bookings since that page was built; this keeps
  // any old link working rather than showing a second, emptier version.
  if (segments?.[0] === "appointments") redirect("/bookings");

  // An unrecognized path lands on the account home rather than a 404 -
  // the same behaviour this route had before, now with a real page.
  return <AccountHome />;
}
