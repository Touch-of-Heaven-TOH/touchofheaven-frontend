"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HandleAvailabilityField } from "@/features/business-wizard/components/HandleAvailabilityField";
import { LogoUploadField } from "@/features/business-wizard/components/LogoUploadField";
import type {
  WizardApplication,
  WizardStep2Payload,
} from "@/features/business-wizard/useBusinessWizardDraft";

const DESCRIPTION_MAX = 300;

export function Step2BusinessDetails({
  application,
  userEmail,
  saveStep2,
  saving,
}: {
  application: WizardApplication;
  userEmail: string;
  saveStep2: (input: WizardStep2Payload) => Promise<WizardApplication>;
  saving: boolean;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(application.businessName ?? "");
  const [professionalName, setProfessionalName] = useState(
    application.professionalName ?? "",
  );
  const [businessPhone, setBusinessPhone] = useState(application.businessPhone ?? "");
  const [handle, setHandle] = useState(application.handle ?? "");
  const [businessDescription, setBusinessDescription] = useState(
    application.businessDescription ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(application.logoUrl);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Autosave a beat after the applicant stops typing any of these fields -
  // logo/handle save immediately on their own actions instead (see below).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void saveStep2({
        ...(businessName ? { businessName } : {}),
        ...(professionalName ? { professionalName } : {}),
        ...(businessPhone ? { businessPhone } : {}),
        ...(businessDescription ? { businessDescription } : {}),
      }).catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, professionalName, businessPhone, businessDescription]);

  async function handleLogoUploaded(publicUrl: string) {
    setLogoUrl(publicUrl);
    await saveStep2({ logoUrl: publicUrl }).catch(() => undefined);
  }

  async function handleContinue() {
    if (!businessName || !professionalName || !handle) {
      setError("Fill in your business name, display name, and handle to continue.");
      return;
    }
    setError(null);
    try {
      await saveStep2({ businessName, professionalName, handle, businessPhone, businessDescription });
      router.push("/business/setup/services");
    } catch {
      setError("We could not save that. Try again.");
    }
  }

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        Step 2 of 4
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
        Tell us about your business
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        This information helps clients recognise and trust your professional profile.
      </p>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-5">
            <LogoUploadField
              businessInitial={(businessName || "T").charAt(0).toUpperCase()}
              logoUrl={logoUrl}
              onUploaded={handleLogoUploaded}
            />

            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Public business name
              <input
                className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setBusinessName(event.target.value)}
                value={businessName}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Professional display name
              <input
                className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setProfessionalName(event.target.value)}
                value={professionalName}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Business phone
              <input
                className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setBusinessPhone(event.target.value)}
                type="tel"
                value={businessPhone}
              />
            </label>
          </div>

          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Business email
              <span className="flex min-h-12 items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-page)] px-3 text-base text-[var(--color-text-muted)]">
                {userEmail}
                <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-success)]">
                  <CheckCircle2 aria-hidden="true" size={14} />
                  Verified
                </span>
              </span>
            </label>

            <HandleAvailabilityField
              currentHandle={application.handle}
              onChange={setHandle}
              value={handle}
            />

            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Short business description
              <textarea
                className="min-h-24 resize-none rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--color-brand)]"
                maxLength={DESCRIPTION_MAX}
                onChange={(event) => setBusinessDescription(event.target.value)}
                value={businessDescription}
              />
              <span className="text-right text-xs text-[var(--color-text-muted)]">
                {businessDescription.length}/{DESCRIPTION_MAX}
              </span>
            </label>
          </div>
        </div>

        {businessName ? (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-brand-soft)] text-base font-bold text-[var(--color-brand-strong)]">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote R2 URL preview thumbnail
                  <img alt="" className="size-full object-cover" src={logoUrl} />
                ) : (
                  businessName.charAt(0).toUpperCase()
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {businessName}
                </p>
                {application.businessCategory ? (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {application.businessCategory.replaceAll("_", " ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
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
          onClick={() => router.push("/business/setup/type")}
          type="button"
        >
          Back
        </button>
        <button
          className="btn-primary"
          disabled={saving}
          onClick={handleContinue}
          type="button"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </section>
  );
}
