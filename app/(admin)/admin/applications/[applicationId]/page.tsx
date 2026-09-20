import type { Metadata } from "next";
import { ApplicationReview } from "@/features/admin/applications/ApplicationReview";

export const metadata: Metadata = {
  title: "Review application",
  robots: { index: false, follow: false },
};

export default async function AdminApplicationReviewPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <ApplicationReview applicationId={applicationId} />;
}
