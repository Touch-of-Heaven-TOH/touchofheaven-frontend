import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientOnboardingWizard } from "@/features/client-onboarding/ClientOnboardingWizard";
import {
  CLIENT_ONBOARDING_STEPS,
  stepFromSlug,
} from "@/features/client-onboarding/client-onboarding-steps";
import type { SafeUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client onboarding preview",
  description: "Preview the Touch of Heaven client onboarding flow.",
  robots: { index: false, follow: false },
};

const previewUser: SafeUser = {
  id: "preview-customer",
  email: "maya.johnson@example.com",
  firstName: "Maya",
  lastName: "Johnson",
  emailVerifiedAt: "2026-09-01T00:00:00.000Z",
  status: "ACTIVE",
  roles: ["CUSTOMER"],
  createdAt: "2026-09-01T00:00:00.000Z",
};

export default async function ClientOnboardingPreviewPage({
  params,
}: {
  params: Promise<{ step?: string[] }>;
}) {
  const { step } = await params;
  const slug = step?.[0];
  const currentStep = stepFromSlug(slug);

  if (!slug) {
    redirect("/preview/client-onboarding/welcome");
  }

  if (currentStep.slug !== slug) {
    redirect("/preview/client-onboarding/welcome");
  }

  return (
    <ClientOnboardingWizard
      basePath="/preview/client-onboarding"
      initialStepNumber={currentStep.number}
      mode="preview"
      user={previewUser}
    />
  );
}

export function generateStaticParams() {
  return CLIENT_ONBOARDING_STEPS.map((step) => ({
    step: [step.slug],
  }));
}
