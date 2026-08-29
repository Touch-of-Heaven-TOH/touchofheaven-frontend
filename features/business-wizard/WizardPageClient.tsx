"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { BusinessWizardShell } from "@/features/business-wizard/BusinessWizardShell";
import { Step1BusinessType } from "@/features/business-wizard/steps/Step1BusinessType";
import { Step2BusinessDetails } from "@/features/business-wizard/steps/Step2BusinessDetails";
import { Step3ServicesLocation } from "@/features/business-wizard/steps/Step3ServicesLocation";
import { Step4VerifyReview } from "@/features/business-wizard/steps/Step4VerifyReview";
import { useBusinessWizardDraft } from "@/features/business-wizard/useBusinessWizardDraft";
import { wizardStepFromSlug } from "@/features/business-wizard/wizard-steps";

export function WizardPageClient({
  slug,
  userFirstName,
  userEmail,
}: {
  slug: string | undefined;
  userFirstName: string;
  userEmail: string;
}) {
  const {
    application,
    status,
    error,
    saving,
    saveStep1,
    saveStep2,
    saveStep3,
    submit,
    reload,
  } = useBusinessWizardDraft();
  const currentStep = wizardStepFromSlug(slug);

  if (status === "loading") {
    return (
      <BusinessWizardShell currentStep={currentStep} userFirstName={userFirstName}>
        <LoadingState />
      </BusinessWizardShell>
    );
  }

  if (status === "error" || !application) {
    return (
      <BusinessWizardShell currentStep={currentStep} userFirstName={userFirstName}>
        <p className="rounded-md bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger)]">
          {error ?? "We could not load your application."}
        </p>
        <button className="btn-secondary mt-4" onClick={() => void reload()} type="button">
          Try again
        </button>
      </BusinessWizardShell>
    );
  }

  return (
    <BusinessWizardShell currentStep={currentStep} userFirstName={userFirstName}>
      {currentStep === 1 ? (
        <Step1BusinessType application={application} saveStep1={saveStep1} saving={saving} />
      ) : currentStep === 2 ? (
        <Step2BusinessDetails
          application={application}
          saveStep2={saveStep2}
          saving={saving}
          userEmail={userEmail}
        />
      ) : currentStep === 3 ? (
        <Step3ServicesLocation application={application} saveStep3={saveStep3} saving={saving} />
      ) : (
        <Step4VerifyReview
          application={application}
          reload={reload}
          saving={saving}
          submit={submit}
        />
      )}
    </BusinessWizardShell>
  );
}

// A cold dev-server compile or a slow database round trip can make this
// take longer than a normal page load - without a visible sign of
// progress, that reads as broken rather than slow. The extra message
// after 6s is a deliberate reassurance, not a real timeout.
function LoadingState() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <LoaderCircle
        aria-hidden="true"
        className="animate-spin text-[var(--color-brand)]"
        size={28}
      />
      <p className="text-sm text-[var(--color-text-muted)]">Loading your application...</p>
      {slow ? (
        <p className="max-w-xs text-xs text-[var(--color-text-muted)]">
          Still working - this can take a little longer the first time.
        </p>
      ) : null}
    </div>
  );
}
