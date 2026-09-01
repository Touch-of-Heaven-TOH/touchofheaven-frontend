import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientOnboardingWizard } from "@/features/client-onboarding/ClientOnboardingWizard";
import { requireRole } from "@/lib/auth/session";
import { CLIENT_ONBOARDING_STEPS, stepFromSlug } from "@/features/client-onboarding/client-onboarding-steps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client onboarding",
  description: "Set up your Touch of Heaven client profile.",
  robots: { index: false, follow: false },
};

export default async function ClientOnboardingPage({
  params,
}: {
  params: Promise<{ step?: string[] }>;
}) {
  const user = await requireRole("CUSTOMER", "/access-denied");
  const { step } = await params;
  const slug = step?.[0];
  const currentStep = stepFromSlug(slug);

  if (slug && currentStep.slug !== slug) {
    redirect("/client-onboarding/welcome");
  }

  return <ClientOnboardingWizard initialStepNumber={currentStep.number} user={user} />;
}

export function generateStaticParams() {
  return CLIENT_ONBOARDING_STEPS.map((step) => ({
    step: [step.slug],
  }));
}
