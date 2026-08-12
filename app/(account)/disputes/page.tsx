import type { Metadata } from "next";
import { DisputesList } from "@/features/resolution/components/DisputesList";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Disputes",
  description: "Track cases you've opened with the Resolution Center.",
  robots: { index: false, follow: false },
};

export default async function DisputesPage() {
  await requireUser();
  return <DisputesList />;
}
