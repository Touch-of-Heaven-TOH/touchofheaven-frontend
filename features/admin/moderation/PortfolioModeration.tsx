"use client";

import { CircleCheck, Clock3, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { adminFetcher, adminRequest, errorMessage, withQuery } from "@/features/admin/lib/api";

/**
 * Deciding whether a client's photo may be published.
 *
 * Every photo here is of a real person, uploaded by their provider under a
 * consent they gave on one finished appointment. So the row carries the
 * grounds a decision is actually made on - whose appointment, which
 * service, and whether that consent still stands - and a refusal has to be
 * written out, because the provider is shown the reason and has to be able
 * to act on it.
 */

type ModerationStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

type QueueItem = {
  id: string;
  altText: string;
  moderationStatus: ModerationStatus;
  rejectionReason: string | null;
  imageUrl: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  clientName: string;
  consentType: string;
  consentRevoked: boolean;
  appointmentId: string;
  createdAt: string;
};

type QueueResponse = {
  items: QueueItem[];
  counts: { pending: number; approved: number; rejected: number };
};

const TABS: { value: ModerationStatus; label: string; countKey: keyof QueueResponse["counts"] }[] = [
  { value: "PENDING_REVIEW", label: "Waiting on review", countKey: "pending" },
  { value: "APPROVED", label: "Published", countKey: "approved" },
  { value: "REJECTED", label: "Refused", countKey: "rejected" },
];

const STATUS_STYLE: Record<ModerationStatus, string> = {
  PENDING_REVIEW: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  APPROVED: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  REJECTED: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const STATUS_LABEL: Record<ModerationStatus, string> = {
  PENDING_REVIEW: "Waiting on review",
  APPROVED: "Published",
  REJECTED: "Refused",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PortfolioModeration() {
  const [status, setStatus] = useState<ModerationStatus>("PENDING_REVIEW");
  const path = withQuery("/api/v1/admin/portfolio-media", { status, limit: "50" });
  const { data, error, isLoading, mutate } = useSWR<QueueResponse>(path, adminFetcher);

  const [deciding, setDeciding] = useState<QueueItem | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const items = data?.items ?? [];
  const counts = data?.counts;

  async function approve(item: QueueItem) {
    setBusy(true);
    setActionError(null);
    try {
      const response = await adminRequest<{ message: string }>(
        `/api/v1/admin/portfolio-media/${item.id}/approve`,
        "POST",
        {},
      );
      setResult(response.message);
      await mutate();
    } catch (submitError) {
      setActionError(errorMessage(submitError, "We couldn't approve that photo."));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!deciding || reason.trim().length < 10) return;
    setBusy(true);
    setActionError(null);
    try {
      const response = await adminRequest<{ message: string }>(
        `/api/v1/admin/portfolio-media/${deciding.id}/reject`,
        "POST",
        { reason: reason.trim() },
      );
      setResult(response.message);
      setDeciding(null);
      setReason("");
      await mutate();
    } catch (submitError) {
      setActionError(errorMessage(submitError, "We couldn't refuse that photo."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <AdminPageHeader
        eyebrow="Moderation"
        title="Portfolio photos"
        description="Photos providers want on their public profile. Each one is of a client who agreed to it on a finished appointment — check the photo shows only that client before you publish it."
      />

      {result ? (
        <p
          role="status"
          className="rounded-md bg-[var(--color-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]"
        >
          {result}
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-md bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]"
        >
          {actionError}
        </p>
      ) : null}

      <div role="tablist" aria-label="Filter photos by review state" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const selected = tab.value === status;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setStatus(tab.value);
                setResult(null);
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-bold ${
                selected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)]"
              }`}
            >
              {tab.label}
              {counts ? (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    selected ? "bg-white/20" : "bg-[var(--color-surface-strong)]"
                  }`}
                >
                  {counts[tab.countKey]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {counts ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          {counts.pending === 0
            ? "Nothing is waiting on review."
            : `${counts.pending} photo${counts.pending === 1 ? "" : "s"} waiting on review.`}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading photos">
          <div className="h-40 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-40 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
        </div>
      ) : error ? (
        <AdminPanel>
          <div className="grid justify-items-start gap-3">
            <p className="font-semibold text-[var(--color-danger)]">
              {errorMessage(error, "We couldn't load the moderation queue.")}
            </p>
            <Button onClick={() => void mutate()}>Try again</Button>
          </div>
        </AdminPanel>
      ) : items.length === 0 ? (
        <AdminPanel>
          <div className="grid justify-items-center gap-2 py-8 text-center">
            <CircleCheck aria-hidden="true" className="size-8 text-[var(--color-success)]" />
            <p className="font-semibold text-[var(--color-text-primary)]">
              {status === "PENDING_REVIEW"
                ? "Nothing waiting on review"
                : status === "APPROVED"
                  ? "Nothing published yet"
                  : "Nothing refused"}
            </p>
            <p className="max-w-md text-sm text-[var(--color-text-muted)]">
              {status === "PENDING_REVIEW"
                ? "Photos appear here as soon as a provider uploads one against a client's consent."
                : "Switch to “Waiting on review” to work through the queue."}
            </p>
          </div>
        </AdminPanel>
      ) : (
        <ul role="list" className="grid gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <AdminPanel>
                <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[var(--color-surface-strong)]">
                    {/* Portfolio media lives in object storage on hosts that
                        are not listed in next.config. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={item.altText}
                      src={item.imageUrl}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>

                  <div className="grid min-w-0 content-start gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[item.moderationStatus]}`}
                      >
                        {item.moderationStatus === "APPROVED" ? (
                          <CircleCheck aria-hidden="true" className="size-3.5" />
                        ) : item.moderationStatus === "REJECTED" ? (
                          <TriangleAlert aria-hidden="true" className="size-3.5" />
                        ) : (
                          <Clock3 aria-hidden="true" className="size-3.5" />
                        )}
                        {STATUS_LABEL[item.moderationStatus]}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        uploaded {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="font-semibold break-words text-[var(--color-text-primary)]">
                      {item.altText}
                    </p>

                    <dl className="grid gap-1 text-sm text-[var(--color-text-muted)] sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="inline font-semibold">Provider: </dt>
                        <dd className="inline break-words">{item.providerName}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="inline font-semibold">Client: </dt>
                        <dd className="inline break-words">{item.clientName}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="inline font-semibold">Service: </dt>
                        <dd className="inline break-words">{item.serviceName}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="inline font-semibold">Consent: </dt>
                        <dd className="inline break-words">
                          {item.consentType.toLowerCase().replace(/_/g, " ")}
                        </dd>
                      </div>
                    </dl>

                    {item.consentRevoked ? (
                      <p className="flex items-start gap-2 rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-danger)]">
                        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>
                          This client has withdrawn their agreement. This photo cannot be
                          published.
                        </span>
                      </p>
                    ) : null}

                    {item.moderationStatus === "REJECTED" && item.rejectionReason ? (
                      <p className="rounded-md bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                        <span className="font-semibold">Reason given: </span>
                        {item.rejectionReason}
                      </p>
                    ) : null}

                    {item.moderationStatus === "PENDING_REVIEW" ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Button
                          onClick={() => void approve(item)}
                          loading={busy}
                          disabled={item.consentRevoked}
                          leadingIcon={<CircleCheck aria-hidden="true" className="size-4" />}
                        >
                          Publish it
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setDeciding(item);
                            setReason("");
                            setActionError(null);
                          }}
                        >
                          Refuse…
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </AdminPanel>
            </li>
          ))}
        </ul>
      )}

      {deciding ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/50"
            onClick={() => (busy ? undefined : setDeciding(null))}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="refuse-title"
            className="relative w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2
                  id="refuse-title"
                  className="font-serif text-xl font-semibold text-[var(--color-text-primary)]"
                >
                  Refuse this photo
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {deciding.providerName} is shown exactly what you write here, so say what
                  they need to change.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDeciding(null)}
                className="grid size-11 shrink-0 place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-strong)]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-1.5">
              <label htmlFor="refuse-reason" className="text-sm font-semibold">
                Why is it being refused?
              </label>
              <textarea
                id="refuse-reason"
                rows={4}
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Another client is recognisable in the mirror behind. Please crop or retake."
                className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                {reason.trim().length < 10
                  ? "At least 10 characters — a reason the provider can act on."
                  : `${reason.length}/500`}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => setDeciding(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => void reject()}
                loading={busy}
                disabled={reason.trim().length < 10}
              >
                Refuse the photo
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
