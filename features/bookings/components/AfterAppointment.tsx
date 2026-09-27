"use client";

import { Camera, CircleCheck, Star } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";

/**
 * The two things a client is asked once their appointment is finished:
 * how it went, and whether their photos may be shown.
 *
 * They are deliberately separate decisions on one card. A good review is
 * not permission to publish someone's face, and a client who is happy to
 * be photographed should not have to write a review to say so. Nothing
 * here is pre-ticked.
 */

const CONSENT_TYPES = [
  {
    value: "PORTFOLIO_ONLY",
    label: "On their portfolio",
    description: "Shown on this professional's own profile page.",
  },
  {
    value: "DISCOVER_FEED",
    label: "In the Discover feed",
    description: "May appear to other clients browsing for ideas.",
  },
  {
    value: "SOCIAL_MEDIA",
    label: "On their social media",
    description: "May be posted outside Touch of Heaven.",
  },
] as const;

type ConsentType = (typeof CONSENT_TYPES)[number]["value"];

type ConsentRecord = {
  id: string;
  appointmentId: string;
  consentType: ConsentType;
  isRevoked: boolean;
};

const fetcher = <T,>(path: string) => browserApiFetch<T>(path);

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message || fallback : fallback;
}

export function AfterAppointment({
  appointmentId,
  providerName,
}: {
  appointmentId: string;
  providerName: string;
}) {
  return (
    <section className="grid gap-4 rounded-[var(--radius-control)] border border-[var(--color-brand)]/30 bg-[var(--color-brand-soft)]/30 p-5">
      <header>
        <h2 className="font-serif text-2xl font-semibold">After your appointment</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Two separate things, and both are entirely up to you.
        </p>
      </header>
      <ReviewCard appointmentId={appointmentId} providerName={providerName} />
      <ConsentCard appointmentId={appointmentId} providerName={providerName} />
    </section>
  );
}

function ReviewCard({
  appointmentId,
  providerName,
}: {
  appointmentId: string;
  providerName: string;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit() {
    if (rating < 1 || body.trim().length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await browserApiFetch(`/api/v1/bookings/${appointmentId}/review`, {
        method: "POST",
        body: { rating, reviewBody: body.trim() },
      });
      setDone("Thank you — your review is now on their profile.");
    } catch (submitError) {
      setError(messageFor(submitError, "We couldn't save your review."));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-control)] bg-white p-4">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--color-success)]" />
        <p role="status" className="text-sm font-semibold text-[var(--color-success)]">
          {done}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-control)] bg-white p-4">
      <h3 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <Star aria-hidden="true" className="size-5 text-[var(--color-gold)]" />
        How was it?
      </h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Your review appears on {providerName}&apos;s profile with your first name.
      </p>

      <fieldset className="mt-3">
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-2 flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              aria-label={`${value} out of 5`}
              onClick={() => setRating(value)}
              className={`grid size-11 place-items-center rounded-full transition-colors ${
                value <= rating
                  ? "text-[var(--color-gold)]"
                  : "text-[var(--color-border)] hover:text-[var(--color-gold)]"
              }`}
            >
              <Star aria-hidden="true" className="size-7" fill={value <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        {/* Stated in words as well: a screen reader user should not have to
            count filled stars to know what is selected. */}
        <p role="status" className="mt-1 text-sm text-[var(--color-text-muted)]">
          {rating === 0 ? "No rating chosen yet." : `${rating} out of 5 selected.`}
        </p>
      </fieldset>

      <div className="mt-3 grid gap-1.5">
        <label htmlFor="review-body" className="text-sm font-medium">
          What should other clients know?
        </label>
        <textarea
          id="review-body"
          rows={3}
          value={body}
          maxLength={1000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="The parting was neat and it didn't feel tight at all."
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
        <p className="text-xs text-[var(--color-text-muted)]">{body.length}/1000</p>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-3"
        onClick={() => void submit()}
        loading={busy}
        disabled={rating < 1 || body.trim().length === 0}
      >
        Post review
      </Button>
    </div>
  );
}

function ConsentCard({
  appointmentId,
  providerName,
}: {
  appointmentId: string;
  providerName: string;
}) {
  const consents = useSWR<{ consents: ConsentRecord[] }>(
    "/api/v1/customer/portfolio-consents",
    fetcher,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<ConsentType, boolean> | null>(null);

  // What the client has already agreed to for this appointment. A revoked
  // record counts as "no" - taking permission back has to actually stick.
  const current: Record<ConsentType, boolean> = {
    PORTFOLIO_ONLY: false,
    DISCOVER_FEED: false,
    SOCIAL_MEDIA: false,
  };
  for (const record of consents.data?.consents ?? []) {
    if (record.appointmentId === appointmentId && !record.isRevoked) {
      current[record.consentType] = true;
    }
  }

  const chosen = draft ?? current;
  const changed = CONSENT_TYPES.some((type) => chosen[type.value] !== current[type.value]);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await browserApiFetch(`/api/v1/bookings/${appointmentId}/portfolio-consents`, {
        method: "POST",
        body: {
          consents: CONSENT_TYPES.map((type) => ({
            consentType: type.value,
            granted: chosen[type.value],
          })),
        },
      });
      setDraft(null);
      await consents.mutate();
      setSaved("Saved. You can change this at any time.");
    } catch (submitError) {
      setError(messageFor(submitError, "We couldn't save your choice."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-control)] bg-white p-4">
      <h3 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <Camera aria-hidden="true" className="size-5 text-[var(--color-brand)]" />
        May {providerName} show your photos?
      </h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Nothing is shown unless you say so here, and anything we do show is
        checked first. You can withdraw this later and the photo comes down.
      </p>

      <fieldset className="mt-3 grid gap-2">
        <legend className="sr-only">Where your photos may be shown</legend>
        {CONSENT_TYPES.map((type) => (
          <label
            key={type.value}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 hover:border-[var(--color-brand)]"
          >
            <input
              type="checkbox"
              checked={chosen[type.value]}
              disabled={consents.isLoading}
              onChange={(event) =>
                setDraft({ ...chosen, [type.value]: event.target.checked })
              }
              className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                {type.label}
              </span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                {type.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="mt-3 text-sm font-semibold text-[var(--color-success)]">
          {saved}
        </p>
      ) : null}

      <Button className="mt-3" onClick={() => void save()} loading={busy} disabled={!changed}>
        {CONSENT_TYPES.some((type) => current[type.value]) ? "Update what's allowed" : "Save my choice"}
      </Button>
    </div>
  );
}
