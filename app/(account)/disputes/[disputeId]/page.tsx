import type { Metadata } from "next";
import { DisputeDetailView } from "@/features/resolution/components/DisputeDetailView";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Case Details",
  description: "Resolution Center case details.",
  robots: { index: false, follow: false },
};

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const user = await requireUser();
  const { disputeId } = await params;
  return <DisputeDetailView disputeId={disputeId} currentUserId={user.id} />;
}
