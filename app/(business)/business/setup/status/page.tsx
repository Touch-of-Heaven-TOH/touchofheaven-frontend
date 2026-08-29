import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { BusinessStatusPageClient } from "@/features/business-wizard/status/BusinessStatusPageClient";

export const metadata: Metadata = {
  title: "Business activation",
  robots: { index: false, follow: false },
};

export default async function BusinessSetupStatusPage() {
  const user = await requireUser();
  return <BusinessStatusPageClient userFirstName={user.firstName} />;
}
