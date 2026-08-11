import type { Metadata } from "next";
import { Suspense } from "react";
import { FileDisputeForm } from "@/features/resolution/components/FileDisputeForm";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open a Dispute",
  description: "File a case with the Resolution Center.",
  robots: { index: false, follow: false },
};

export default async function NewDisputePage() {
  await requireUser();
  return (
    // FileDisputeForm reads useSearchParams() (an optional
    // ?appointmentId= for deep-linking from a future bookings page) -
    // Next.js requires that behind a Suspense boundary.
    <Suspense>
      <FileDisputeForm />
    </Suspense>
  );
}
