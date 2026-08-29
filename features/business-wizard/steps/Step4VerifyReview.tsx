"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { DocumentUploadCard } from "@/features/business-wizard/components/DocumentUploadCard";
import type { WizardApplication } from "@/features/business-wizard/useBusinessWizardDraft";

export function Step4VerifyReview({
  application,
  submit,
  reload,
  saving,
}: {
  application: WizardApplication;
  submit: (input: {
    confirmAccurate: boolean;
    agreeToProfessionalAgreement: boolean;
  }) => Promise<{ message: string; status: string }>;
  reload: () => void;
  saving: boolean;
}) {
  const router = useRouter();
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [agreeToAgreement, setAgreeToAgreement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGovernmentId = application.documents.some(
    (doc) => doc.documentType === "GOVERNMENT_ID",
  );
  const hasLicense = application.documents.some(
    (doc) => doc.documentType === "PROFESSIONAL_LICENSE",
  );

  async function handleSubmit() {
    if (!confirmAccurate || !agreeToAgreement) {
      setError("Confirm both checkboxes to submit.");
      return;
    }
    if (!hasGovernmentId) {
      setError("Upload a government-issued ID to continue.");
      return;
    }
    setError(null);
    try {
      await submit({ confirmAccurate, agreeToProfessionalAgreement: agreeToAgreement });
      router.push("/business/setup/status");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : "We could not submit that. Try again.",
      );
    }
  }

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        Step 4 of 4
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
        Verify and review your business
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Confirm your information and provide the documents needed to publish your profile.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Lock aria-hidden="true" className="text-[var(--color-copper)]" size={18} />
            Identity verification
            <span className="ml-auto rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-danger)]">
              Required
            </span>
          </span>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Used privately to confirm the business owner.
          </p>

          <div className="mt-4 divide-y divide-[var(--color-border)]">
            <DocumentUploadCard
              documentType="GOVERNMENT_ID"
              label="Government-issued ID"
              onUploaded={reload}
              uploaded={hasGovernmentId}
            />
            <DocumentUploadCard
              documentType="PROFESSIONAL_LICENSE"
              label="Professional licence or certificate"
              onUploaded={reload}
              uploaded={hasLicense}
            />
          </div>

          <p className="mt-4 flex items-start gap-2 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
            Documents are encrypted and never shown publicly.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Application summary
          </h2>
          <dl className="mt-4 grid gap-4">
            <SummaryRow
              editHref="/business/setup/type"
              label="Business type"
              value={`${(application.businessCategory ?? "").replaceAll("_", " ")} · ${
                application.workMode === "TEAM" ? "Team" : "Independent"
              }`}
            />
            <SummaryRow
              editHref="/business/setup/details"
              label="Business profile"
              value={application.businessName ?? "-"}
            />
            <SummaryRow
              editHref="/business/setup/services"
              label="Location"
              value={
                application.address
                  ? `${application.address.locality}${
                      application.hideAddressUntilConfirmed ? " · Address protected" : ""
                    }`
                  : "-"
              }
            />
            <SummaryRow
              editHref="/business/setup/services"
              label="First service"
              value={
                application.draftServices[0]
                  ? `${application.draftServices[0].name} · $${(
                      application.draftServices[0].basePriceCents / 100
                    ).toFixed(0)}`
                  : "-"
              }
            />
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-[var(--color-border)] bg-white p-6">
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-primary)]">
          <input
            checked={confirmAccurate}
            className="mt-1 size-4"
            onChange={(event) => setConfirmAccurate(event.target.checked)}
            type="checkbox"
          />
          I confirm that the information provided is accurate.
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-primary)]">
          <input
            checked={agreeToAgreement}
            className="mt-1 size-4"
            onChange={(event) => setAgreeToAgreement(event.target.checked)}
            type="checkbox"
          />
          I agree to the{" "}
          <Link className="font-semibold text-[var(--color-brand)]" href="/legal/terms-of-service">
            Professional Agreement
          </Link>{" "}
          and verification policy.
        </label>
        <p className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
          Submitting sends your profile to Touch of Heaven for review. You can continue preparing
          your workspace while it is pending.
        </p>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex justify-between border-t border-[var(--color-border)] pt-6">
        <button
          className="btn-secondary"
          onClick={() => router.push("/business/setup/services")}
          type="button"
        >
          Back
        </button>
        <button className="btn-primary" disabled={saving} onClick={handleSubmit} type="button">
          {saving ? "Submitting..." : "Submit for review"}
        </button>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  editHref,
}: {
  label: string;
  value: string;
  editHref: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </dt>
        <dd className="text-sm text-[var(--color-text-primary)]">{value}</dd>
      </div>
      <Link className="text-xs font-semibold text-[var(--color-brand)]" href={editHref}>
        Edit
      </Link>
    </div>
  );
}
