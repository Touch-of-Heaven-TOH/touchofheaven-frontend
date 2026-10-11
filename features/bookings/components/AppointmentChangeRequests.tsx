"use client";

import { Calendar, CircleAlert, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import { formatFcfa } from "@/lib/app/format";

export type PendingChangeRequest = {
  id: string;
  type: "RESCHEDULE" | "CANCELLATION";
  requestedStartAt: string | null;
  reason: string;
  createdAt: string;
};

type CancellationQuote = {
  estimatedRefundCents: number;
  depositPaidCents: number;
  hoursBeforeStart: number;
  policy: { label: string; description: string };
};

const money = formatFcfa;

function longDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const panel =
  "rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]";
const secondaryButton =
  "inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-white px-5 font-semibold text-[var(--color-brand)] disabled:opacity-50";

/**
 * Lets a client ask their business to move or cancel a booking. Both are
 * requests, not decisions: the business sees them in its Studio inbox and
 * approves or declines, which is where any refund is worked out.
 */
export function AppointmentChangeRequests({
  appointmentId,
  startAt,
  businessName,
  canRequestChange,
  pendingRequest,
  onRequested,
}: {
  appointmentId: string;
  startAt: string;
  businessName: string;
  canRequestChange: boolean;
  pendingRequest: PendingChangeRequest | null;
  onRequested: () => void;
}) {
  const [open, setOpen] = useState<"cancel" | "reschedule" | null>(null);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pendingRequest) {
    return (
      <div className={`${panel} border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)]`}>
        <p className="flex items-center gap-2 font-semibold">
          <Clock size={20} aria-hidden="true" />
          {pendingRequest.type === "RESCHEDULE" ? "New time requested" : "Cancellation requested"}
        </p>
        <p className="mt-2 text-sm">
          {pendingRequest.type === "RESCHEDULE" && pendingRequest.requestedStartAt
            ? `You asked for ${longDateTime(pendingRequest.requestedStartAt)}. `
            : ""}
          {businessName} will answer, and you will get an email either way.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">“{pendingRequest.reason}”</p>
      </div>
    );
  }

  if (!canRequestChange) return null;

  const openCancel = async () => {
    setOpen("cancel");
    setReason("");
    setError(null);
    setQuote(null);
    try {
      setQuote(
        await browserApiFetch<CancellationQuote>(
          `/api/v1/bookings/${appointmentId}/cancellation-quote`,
        ),
      );
    } catch {
      // The refund estimate is extra detail; the request still works without it.
      setQuote(null);
    }
  };

  const submit = async (type: "CANCELLATION" | "RESCHEDULE") => {
    if (reason.trim().length < 3) {
      setError("Tell them briefly why, so they can answer quickly.");
      return;
    }
    let requestedStartAt: string | undefined;
    if (type === "RESCHEDULE") {
      if (!date || !time) {
        setError("Choose the day and time you would prefer.");
        return;
      }
      const chosen = new Date(`${date}T${time}`);
      if (Number.isNaN(chosen.getTime()) || chosen.getTime() <= Date.now()) {
        setError("Choose a time in the future.");
        return;
      }
      requestedStartAt = chosen.toISOString();
    }

    setPending(true);
    setError(null);
    try {
      await browserApiFetch(`/api/v1/bookings/${appointmentId}/change-requests`, {
        method: "POST",
        body: { type, reason: reason.trim(), ...(requestedStartAt ? { requestedStartAt } : {}) },
      });
      setOpen(null);
      onRequested();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not send that request. Try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => { setOpen("reschedule"); setReason(""); setError(null); }} className={secondaryButton}>
          <Calendar size={20} aria-hidden="true" />
          Ask for a new time
        </button>
        <button type="button" onClick={() => void openCancel()} className={secondaryButton}>
          <XCircle size={20} aria-hidden="true" />
          Cancel booking
        </button>
      </div>

      {open ? (
        <div className={panel}>
          <h3 className="font-serif text-xl font-semibold">
            {open === "cancel" ? "Ask to cancel" : "Ask for a new time"}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {open === "cancel"
              ? `${businessName} decides on this request. Your appointment stays booked until they answer.`
              : `Your appointment on ${longDateTime(startAt)} stays booked until ${businessName} agrees to the new time.`}
          </p>

          {open === "cancel" && quote ? (
            <dl className="mt-4 grid gap-1 rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-muted)]">Deposit paid</dt>
                <dd className="font-semibold">{money(quote.depositPaidCents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-muted)]">Refund if they agree now</dt>
                <dd className="font-semibold text-[var(--color-success)]">
                  {money(quote.estimatedRefundCents)}
                </dd>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {quote.policy.label} policy: {quote.policy.description}
              </p>
            </dl>
          ) : null}

          {open === "reschedule" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Preferred day
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-h-12 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Preferred time
                <input
                  type="time"
                  step={900}
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="min-h-12 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 font-normal"
                />
              </label>
            </div>
          ) : null}

          <label className="mt-4 grid gap-1 text-sm font-semibold">
            Reason
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                open === "cancel"
                  ? "I have to travel that week."
                  : "Could we do the afternoon instead?"
              }
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 font-normal"
            />
          </label>

          {error ? (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)]">
              <CircleAlert size={18} aria-hidden="true" />
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(null)} className={secondaryButton}>
              Keep my booking
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void submit(open === "cancel" ? "CANCELLATION" : "RESCHEDULE")}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send request"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
