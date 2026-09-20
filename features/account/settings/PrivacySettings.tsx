"use client";

import { Download, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/components/feedback/ToastProvider";
import { SettingsShell } from "@/features/account/settings/SettingsShell";
import {
  errorMessage,
  useBeautyProfile,
  useConsents,
  type ConsentRecord,
} from "@/features/account/settings/api";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * The permissions a client has actually given, each one backed by a
 * ConsentRecord the platform keeps. Every switch here changes something
 * real; a choice the platform doesn't yet act on would be worse than no
 * switch at all.
 *
 * Each toggle saves the moment it is flipped - there is nothing to "apply"
 * later - and shows when it was last changed.
 */

type ConsentToggle = {
  type: string;
  label: string;
  description: string;
  /** What happens with no record yet. */
  defaultGranted: boolean;
};

const CONSENT_TOGGLES: ConsentToggle[] = [
  {
    type: "MARKETING_COMMUNICATION",
    label: "Marketing communications",
    description:
      "Offers, new providers near you and seasonal campaigns. Which channels they arrive on is set under Notifications.",
    defaultGranted: false,
  },
  {
    type: "AI_HAIRSTYLE_PROCESSING",
    label: "AI Studio may process my photos",
    description: "Needed to preview a hairstyle on your own photo in AI Studio.",
    defaultGranted: false,
  },
  {
    type: "CONSULTATION_PHOTO_PROCESSING",
    label: "Providers may view photos I send for a consultation",
    description: "Photos you attach to a consultation, so a provider can quote accurately.",
    defaultGranted: false,
  },
  {
    type: "PHOTO_PROMOTIONAL_USE",
    label: "My finished looks may be used in promotion",
    description:
      "Lets a provider or the platform feature a photo of your finished look. Separate from the consent asked for each appointment.",
    defaultGranted: false,
  },
];

/** The newest record for a type; the API returns the history newest first. */
function latestFor(records: ConsentRecord[] | undefined, type: string) {
  return records?.find((record) => record.consentType === type) ?? null;
}

function Toggle({
  checked,
  busy,
  label,
  onChange,
}: {
  checked: boolean;
  busy: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={onChange}
      className={[
        "relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-60",
        checked ? "bg-[var(--color-brand)]" : "bg-[var(--color-skeleton)]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 grid size-6 place-items-center rounded-full bg-white shadow transition-all",
          checked ? "left-7" : "left-1",
        ].join(" ")}
      >
        {busy ? <Loader2 aria-hidden="true" className="animate-spin text-[var(--color-brand)]" size={13} /> : null}
      </span>
    </button>
  );
}

export function PrivacySettings() {
  const consents = useConsents();
  const beauty = useBeautyProfile();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);

  const loading = consents.isLoading || beauty.isLoading;

  async function setConsent(toggle: ConsentToggle, granted: boolean) {
    setPending(toggle.type);
    try {
      await browserApiFetch("/api/v1/customer/consents", {
        method: "POST",
        body: {
          consentType: toggle.type,
          decision: granted ? "GRANTED" : "WITHDRAWN",
        },
      });
      await consents.mutate();
      toast.success(granted ? `${toggle.label}: on.` : `${toggle.label}: off.`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save that choice."));
    } finally {
      setPending(null);
    }
  }

  async function setBeautySharing(share: boolean) {
    setPending("beauty");
    try {
      await browserApiFetch("/api/v1/customer/beauty-profile", {
        method: "PATCH",
        body: { shareWithProviders: share },
      });
      await beauty.mutate();
      toast.success(share ? "Providers can see your beauty profile." : "Your beauty profile is private.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save that choice."));
    } finally {
      setPending(null);
    }
  }

  async function downloadData() {
    setDownloading(true);
    try {
      const summary = await browserApiFetch<unknown>("/api/v1/customer/account-summary");
      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Your data is downloading.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't prepare your data."));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SettingsShell
      current="privacy"
      title="Privacy"
      description="What you've agreed to, and a copy of everything the platform holds about you."
    >
      {consents.error ? (
        <ErrorState
          description="We couldn't load your privacy choices."
          onRetry={() => void consents.mutate()}
        />
      ) : loading ? (
        <LoadingSkeleton label="Loading your privacy choices" lines={5} />
      ) : (
        <div className="grid gap-5">
          <section className="surface-panel divide-y divide-[var(--color-border)] p-0">
            {CONSENT_TOGGLES.map((toggle) => {
              const record = latestFor(consents.data?.consents, toggle.type);
              const granted = record ? record.decision === "GRANTED" : toggle.defaultGranted;
              return (
                <div key={toggle.type} className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text-primary)]">{toggle.label}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{toggle.description}</p>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {record
                        ? `${granted ? "Given" : "Withdrawn"} on ${new Date(record.occurredAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`
                        : "Not set yet"}
                    </p>
                  </div>
                  <Toggle
                    checked={granted}
                    busy={pending === toggle.type}
                    label={toggle.label}
                    onChange={() => void setConsent(toggle, !granted)}
                  />
                </div>
              );
            })}

            <div className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  Providers may see my beauty profile
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Your hair, scalp and skin details, plus allergies and notes, shown to a provider you
                  have an appointment with.
                </p>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {beauty.data?.profile.updatedAt
                    ? `Last changed ${new Date(beauty.data.profile.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`
                    : "Not set yet"}
                </p>
              </div>
              <Toggle
                checked={beauty.data?.profile.shareWithProviders ?? true}
                busy={pending === "beauty"}
                label="Providers may see my beauty profile"
                onChange={() => void setBeautySharing(!(beauty.data?.profile.shareWithProviders ?? true))}
              />
            </div>
          </section>

          <section className="surface-panel flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <h2 className="font-semibold text-[var(--color-text-primary)]">Your data</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                A JSON file of your account, bookings, addresses and consents.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void downloadData()}
                loading={downloading}
                leadingIcon={<Download size={16} aria-hidden="true" />}
              >
                Download my data
              </Button>
              <Button type="button" variant="secondary" onClick={() => setExplainerOpen(true)}>
                How we use your data
              </Button>
            </div>
          </section>
        </div>
      )}

      <Modal open={explainerOpen} onClose={() => setExplainerOpen(false)} title="How we use your data">
        <div className="grid gap-3 text-sm text-[var(--color-text-muted)]">
          <p className="flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-brand)]" size={16} />
            In plain terms, with no legal wording.
          </p>
          <ul className="grid list-disc gap-2 pl-5">
            <li>
              <strong className="text-[var(--color-text-primary)]">To book you in.</strong> Your name,
              phone number and appointment details go to the provider you booked, so they know who is
              coming and what for.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">To take payment.</strong> Deposits
              go through the payment provider. Card numbers never reach us.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">To show you what&apos;s near you.</strong>{" "}
              Your location is used for the search you asked for, and isn&apos;t stored with your account.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">To keep records straight.</strong>{" "}
              Bookings, refunds and disputes are kept so both sides can point at what happened.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Only with your say-so.</strong>{" "}
              Marketing, AI photo previews and promotional use of your photos each need the switch above
              turned on, and you can turn any of them off at any time.
            </li>
          </ul>
          <p>
            Your allergies and personal notes are stored encrypted, and reach only a provider you have an
            appointment with.
          </p>
          <div className="pt-2">
            <Button type="button" onClick={() => setExplainerOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsShell>
  );
}
