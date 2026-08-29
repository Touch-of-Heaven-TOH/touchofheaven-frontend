import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { WizardPageClient } from "@/features/business-wizard/WizardPageClient";

export const metadata: Metadata = {
  title: "Set up your business",
  robots: { index: false, follow: false },
};

export default async function BusinessSetupPage({
  params,
}: {
  params: Promise<{ step?: string[] }>;
}) {
  const user = await requireUser();
  const { step } = await params;
  const slug = step?.[0];

  return <WizardPageClient slug={slug} userEmail={user.email} userFirstName={user.firstName} />;
}
