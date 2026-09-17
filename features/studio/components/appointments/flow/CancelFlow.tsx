"use client";

import {
  Ban,
  CircleCheck,
  CreditCard,
  MessageSquareQuote,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import {
  ActionBar,
  AppointmentFlowFrame,
  CopyReference,
  Notice,
  StepTimeline,
  type TimelineStep,
} from "@/features/studio/components/appointments/flow/FlowParts";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  Card,
  FormError,
  Pill,
  SelectField,
  SkeletonRows,
  StatusPill,
  TextAreaField,
  Toggle,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import {
  errorMessage,
  newIdempotencyKey,
  studioFetcher,
  studioRequest,
} from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatPercentBp,
  formatTime,
  parseMoneyToCents,
} from "@/features/studio/lib/format";
import type {
  AppointmentDetail,
  AppointmentDetailResponse,
  CancellationQuoteResponse,
  ChangeRequest,
  Refund,
} from "@/features/studio/lib/types";

const INTERNAL_REASONS = [
  "Client request within policy",
  "Client request outside policy",
  "Illness or emergency",
  "Schedule conflict",
  "Duplicate booking",
  "Other",
];

function pendingCancellation(appointment: AppointmentDetail) {
  return (
    appointment.changeRequests.find((request) => request.status === "PENDING" && request.type === "CANCELLATION") ??
    null
  );
}

export function CancelFlow({ appointmentId }: { appointmentId: string }) {
  return (
    <AppointmentFlowFrame
      appointmentId={appointmentId}
      title={(appointment) => (pendingCancellation(appointment) ? "Cancellation request" : "Cancel appointment")}
      badge={(appointment) =>
        pendingCancellation(appointment) ? <Pill tone="warning">Policy review</Pill> : <StatusPill status={appointment.status} />
      }
    >
      {(appointment, apply) => <CancelBody appointment={appointment} apply={apply} />}
    </AppointmentFlowFrame>
  );
}

function SummaryStrip({ appointment, statusLabel }: { appointment: AppointmentDetail; statusLabel?: string }) {
  const { timezone } = useStudio();
  return (
    <Card padded={false}>
      <dl className="grid divide-y divide-[var(--color-border)] sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
        <div className="flex min-w-0 items-center gap-3 p-4 sm:p-5">
          <Avatar name={appointment.client.name} size="md" />
          <div className="min-w-0">
            <dt className="sr-only">Client</dt>
            <dd className="truncate font-display text-lg">{appointment.client.name}</dd>
            {appointment.client.phone ? (
              <dd className="truncate text-sm text-[var(--color-text-muted)]">{appointment.client.phone}</dd>
            ) : null}
            <dd className="truncate text-sm text-[var(--color-text-muted)]">{appointment.client.email}</dd>
          </div>
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <dt className="text-xs text-[var(--color-text-muted)]">Service</dt>
          <dd className="truncate font-medium">{appointment.service.name}</dd>
          <dd className="text-sm text-[var(--color-text-muted)]">
            {formatDuration(appointment.durationMins)}
            {appointment.teamMember ? ` · ${appointment.teamMember.name}` : ""}
          </dd>
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <dt className="text-xs text-[var(--color-text-muted)]">Booking</dt>
          <dd>
            <CopyReference value={appointment.reference} />
          </dd>
          <dd className="text-sm text-[var(--color-text-muted)]">
            {formatDate(appointment.startAt, timezone, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
            {formatTime(appointment.startAt, timezone)}
          </dd>
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <dt className="text-xs text-[var(--color-text-muted)]">Status</dt>
          <dd className="mt-1">
            {statusLabel ? <Pill tone="danger">{statusLabel}</Pill> : <StatusPill status={appointment.status} />}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function RefundLine({ label, value, tone = "default", strong = false }: { label: string; value: string; tone?: "default" | "success" | "muted"; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        tone === "success" ? "-mx-3 rounded-lg bg-[var(--color-success-soft)] px-3 py-2" : ""
      }`}
    >
      <dt className={tone === "success" ? "font-medium text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}>{label}</dt>
      <dd
        className={`text-right whitespace-nowrap ${
          tone === "success" ? "font-display text-xl text-[var(--color-success)]" : tone === "muted" ? "text-[var(--color-text-muted)]" : "font-medium"
        } ${strong ? "font-display text-xl" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function CancelBody({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { data: quote, error } = useSWR<CancellationQuoteResponse>(
    `/api/v1/business/appointments/${appointment.id}/cancel`,
    studioFetcher,
  );
  const request = pendingCancellation(appointment);

  if (error) return <FormError message={errorMessage(error)} />;
  if (!quote) return <SkeletonRows label="Calculating the refund" rows={3} />;

  if (request && quote.clientRequest) {
    return <ClientRequestReview appointment={appointment} request={request} quote={quote} apply={apply} />;
  }
  return <BusinessCancel appointment={appointment} quote={quote} apply={apply} />;
}

function ClientRequestReview({
  appointment,
  request,
  quote,
  apply,
}: {
  appointment: AppointmentDetail;
  request: ChangeRequest;
  quote: CancellationQuoteResponse;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { timezone } = useStudio();
  const router = useRouter();
  const notify = useToast();
  const clientQuote = quote.clientRequest!.quote;
  const [internalReason, setInternalReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [message, setMessage] = useState("");
  const [declining, setDeclining] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refund = clientQuote.policyRefundCents;
  const kept = Math.max(0, clientQuote.maxRefundableCents - refund);
  const hours = clientQuote.hoursBeforeStart;
  const eligibility =
    clientQuote.maxRefundableCents === 0
      ? { tone: "neutral" as const, label: "Nothing to refund" }
      : clientQuote.refundBasisPoints >= 10_000
        ? { tone: "success" as const, label: "Full refund eligible" }
        : clientQuote.refundBasisPoints > 0
          ? { tone: "warning" as const, label: "Partial refund" }
          : { tone: "danger" as const, label: "Not refund eligible" };

  const approve = async () => {
    if (!internalReason) {
      setActionError("Choose an internal reason for your records.");
      return;
    }
    setPending(true);
    setActionError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/change-requests/${request.id}`,
        "POST",
        {
          decision: "APPROVE",
          internalReason,
          ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {}),
          ...(message.trim() ? { note: message.trim() } : {}),
        },
      );
      notify({
        tone: "success",
        title: "Cancellation approved",
        description: refund > 0 ? `${formatMoney(refund)} is being refunded.` : "No refund was due under the policy.",
      });
      apply(response);
      router.push(
        refund > 0 ? `/studio/appointments/${appointment.id}/refund` : `/studio/appointments/${appointment.id}`,
      );
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  const steps: TimelineStep[] = [
    { label: "Booked", detail: formatDateTime(appointment.createdAt, timezone), state: "done" },
    appointment.pricing.depositPaidCents > 0
      ? { label: `Deposit paid ${formatMoney(appointment.pricing.depositPaidCents)}`, state: "done" }
      : { label: "No deposit paid", state: "upcoming" },
    { label: "Cancellation requested", detail: formatDateTime(request.createdAt, timezone), state: "warning" },
    { label: "Appointment", detail: formatDateTime(appointment.startAt, timezone), state: "upcoming" },
  ];

  return (
    <div className="grid gap-5">
      <SummaryStrip appointment={appointment} statusLabel="Cancellation requested" />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          <Card title="Cancellation reason" icon={MessageSquareQuote}>
            <p className="text-[15px]">“{request.reason}”</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Requested {formatDateTime(request.createdAt, timezone)}
            </p>
          </Card>
          <Card title="Appointment timeline">
            <StepTimeline steps={steps} />
          </Card>
          <Card title="Your records">
            <div className="grid gap-4">
              <SelectField
                label="Internal reason (required)"
                value={internalReason}
                onChange={(event) => setInternalReason(event.target.value)}
              >
                <option value="">Choose a reason</option>
                {INTERNAL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </SelectField>
              <TextAreaField
                label="Internal note (optional)"
                hint="Recorded in the audit log. Never shown to the client."
                value={internalNote}
                maxLength={500}
                onChange={(event) => setInternalNote(event.target.value)}
              />
              <TextAreaField
                label="Message to the client (optional)"
                hint="Included in the email confirming the cancellation."
                value={message}
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-5 *:min-w-0">
          <Card title="Policy eligibility" icon={ShieldCheck} action={<Pill tone={eligibility.tone}>{eligibility.label}</Pill>}>
            <Notice
              tone={eligibility.tone === "success" ? "success" : eligibility.tone === "danger" ? "danger" : "warning"}
              title={
                hours >= 0
                  ? `Asked ${hours} hour${hours === 1 ? "" : "s"} before the appointment`
                  : "Asked after the appointment start time"
              }
            >
              Under this policy the client gets {formatPercentBp(clientQuote.refundBasisPoints)} of the deposit back.
            </Notice>
            <p className="mt-3 text-sm font-medium">{clientQuote.policy.label} policy</p>
            <p className="text-sm text-[var(--color-text-muted)]">{clientQuote.policy.description}</p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              The policy is judged at the moment the client asked, not when you approve.
            </p>
          </Card>

          <Card title="Refund summary">
            <dl className="grid gap-2.5 text-[15px]">
              <RefundLine label="Original total" value={formatMoney(appointment.pricing.servicePriceCents)} />
              <RefundLine label="Deposit paid" value={formatMoney(quote.depositPaidCents)} />
              {quote.alreadyRefundedCents > 0 ? (
                <RefundLine label="Already refunded" value={formatMoney(quote.alreadyRefundedCents)} tone="muted" />
              ) : null}
              <RefundLine label="Refund amount" value={formatMoney(refund)} tone="success" />
              <RefundLine label="Kept by you" value={formatMoney(kept)} />
              <RefundLine
                label="Remaining balance"
                value={appointment.pricing.balanceDueCents > 0 ? `${formatMoney(appointment.pricing.balanceDueCents)} (voided)` : "—"}
                tone="muted"
              />
            </dl>
          </Card>

          <Card title="Refund method" icon={CreditCard}>
            <p className="text-[15px]">Original payment method</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Refunds usually reach the client in 5–10 business days, depending on their bank.
            </p>
          </Card>
        </div>
      </div>

      <Notice tone="warning" icon={TriangleAlert} title="Approving frees this time on your calendar">
        You can offer it to someone on your{" "}
        <Link href="/studio/waitlist" className="font-medium text-[var(--color-brand)] underline">
          waitlist
        </Link>
        .
      </Notice>
      <FormError message={actionError} />
      <ActionBar>
        <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
          Back
        </Link>
        {appointment.allowedActions.decideChangeRequests ? (
          <>
            <Button variant="outline" leadingIcon={<X aria-hidden="true" className="size-4" />} onClick={() => setDeclining(true)}>
              Keep booking
            </Button>
            <Button loading={pending} leadingIcon={<CircleCheck aria-hidden="true" className="size-4" />} onClick={() => void approve()}>
              {refund > 0 ? `Approve cancellation & ${formatMoney(refund)} refund` : "Approve cancellation"}
            </Button>
          </>
        ) : null}
      </ActionBar>

      {declining ? (
        <KeepBookingDialog
          request={request}
          onClose={() => setDeclining(false)}
          onDone={(response) => {
            setDeclining(false);
            apply(response);
            router.push(`/studio/appointments/${appointment.id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function KeepBookingDialog({
  request,
  onClose,
  onDone,
}: {
  request: ChangeRequest;
  onClose: () => void;
  onDone: (response: AppointmentDetailResponse) => void;
}) {
  const notify = useToast();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (note.trim().length < 3) {
      setError("Tell the client why the booking is staying.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/change-requests/${request.id}`,
        "POST",
        { decision: "DECLINE", note: note.trim() },
      );
      notify({ tone: "success", title: "Booking kept", description: "The client has been emailed." });
      onDone(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Decline with reason"
      description="The appointment stays booked and the client is told why."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Go back
          </Button>
          <Button loading={pending} onClick={() => void submit()}>
            Keep booking
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <TextAreaField
          label="Reason for the client"
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Your deposit secures this time. Let's find a new date instead."
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

function BusinessCancel({
  appointment,
  quote,
  apply,
}: {
  appointment: AppointmentDetail;
  quote: CancellationQuoteResponse;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const router = useRouter();
  const notify = useToast();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const refundable = quote.business.maxRefundableCents;
  const [mode, setMode] = useState<"FULL" | "CUSTOM" | "NONE">(refundable > 0 ? "FULL" : "NONE");
  const [custom, setCustom] = useState("");
  const [reason, setReason] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refundCents = mode === "FULL" ? refundable : mode === "NONE" ? 0 : parseMoneyToCents(custom || "0");

  if (!quote.canCancel || !appointment.allowedActions.cancel) {
    return (
      <div className="grid gap-5">
        <SummaryStrip appointment={appointment} />
        <Card>
          <Notice tone="warning" title="This appointment can't be cancelled">
            {quote.canCancel
              ? "Your role can view this appointment but not cancel it."
              : appointment.status === "IN_PROGRESS"
                ? "The service is already in progress. Complete it instead."
                : "It is already closed."}
          </Notice>
          <div className="mt-4 flex flex-wrap gap-2">
            {appointment.refunds.length > 0 ? (
              <Link href={`/studio/appointments/${appointment.id}/refund`} className="btn-primary">
                View refund
              </Link>
            ) : null}
            <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
              Back to appointment
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const submit = async () => {
    if (reason.trim().length < 3) {
      setError("Give the client a short reason.");
      return;
    }
    if (refundCents === null) {
      setError("Enter the refund as a number, for example 20 or 20.50.");
      return;
    }
    if (refundCents > refundable) {
      setError(`You can refund at most ${formatMoney(refundable)}.`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse & { refund: Refund | null }>(
        `/api/v1/business/appointments/${appointment.id}/cancel`,
        "POST",
        {
          reason: reason.trim(),
          refundMode: mode,
          ...(mode === "CUSTOM" ? { refundAmountCents: refundCents } : {}),
          idempotencyKey,
          notifyClient,
        },
      );
      notify({
        tone: "success",
        title: "Appointment cancelled",
        description: response.refund ? `${formatMoney(response.refund.amountCents)} is being refunded.` : "No refund was issued.",
      });
      apply(response);
      router.push(
        response.refund ? `/studio/appointments/${appointment.id}/refund` : `/studio/appointments/${appointment.id}`,
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  const option = (value: typeof mode, title: string, description: string) => (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 ${
        mode === value ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]/40" : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
      }`}
    >
      <input
        type="radio"
        name="refund-mode"
        checked={mode === value}
        onChange={() => setMode(value)}
        className="mt-1 size-4 accent-[var(--color-brand)]"
      />
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-sm text-[var(--color-text-muted)]">{description}</span>
      </span>
    </label>
  );

  return (
    <div className="grid gap-5">
      <SummaryStrip appointment={appointment} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          {refundable > 0 ? (
            <Card title="Refund">
              <p className="mb-3 text-sm text-[var(--color-text-muted)]">
                Because your business is cancelling, the client is entitled to their full deposit back.
              </p>
              <fieldset className="grid gap-2">
                <legend className="sr-only">Refund amount</legend>
                {option("FULL", `Full refund · ${formatMoney(refundable)}`, "Recommended. Sent to the client's original payment method.")}
                {option("CUSTOM", "Partial refund", "Only if you've agreed a different amount with the client.")}
                {mode === "CUSTOM" ? (
                  <div className="grid max-w-xs gap-1.5 pl-1">
                    <label htmlFor="custom-refund" className="text-sm font-medium">
                      Refund amount
                    </label>
                    <input
                      id="custom-refund"
                      inputMode="decimal"
                      value={custom}
                      onChange={(event) => setCustom(event.target.value)}
                      placeholder="0.00"
                      className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-ring"
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">Up to {formatMoney(refundable)}</p>
                  </div>
                ) : null}
                {option("NONE", "No refund", "Only if you've agreed this with the client.")}
              </fieldset>
            </Card>
          ) : (
            <Notice title="Nothing to refund">No money was paid through Touch of Heaven for this booking.</Notice>
          )}
          <Card title="Message">
            <div className="grid gap-4">
              <TextAreaField
                label="Reason for the client (required)"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Your stylist is unwell. We're sorry for the inconvenience."
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">Email the client</span>
                <Toggle checked={notifyClient} onChange={setNotifyClient} label="Email the client" />
              </div>
            </div>
          </Card>
        </div>
        <div className="grid gap-5 *:min-w-0">
          <Card title="Refund summary">
            <dl className="grid gap-2.5 text-[15px]">
              <RefundLine label="Original total" value={formatMoney(appointment.pricing.servicePriceCents)} />
              <RefundLine label="Deposit paid" value={formatMoney(quote.depositPaidCents)} />
              {quote.alreadyRefundedCents > 0 ? (
                <RefundLine label="Already refunded" value={formatMoney(quote.alreadyRefundedCents)} tone="muted" />
              ) : null}
              <RefundLine label="Refund amount" value={refundCents === null ? "—" : formatMoney(refundCents)} tone="success" />
              <RefundLine
                label="Remaining balance"
                value={appointment.pricing.balanceDueCents > 0 ? `${formatMoney(appointment.pricing.balanceDueCents)} (voided)` : "—"}
                tone="muted"
              />
            </dl>
          </Card>
          <Notice tone="warning" icon={TriangleAlert} title="Cancelling frees this time on your calendar">
            Reminders to the client are stopped. This can&apos;t be undone.
          </Notice>
        </div>
      </div>
      <FormError message={error} />
      <ActionBar>
        <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
          Keep appointment
        </Link>
        <Button variant="danger" loading={pending} leadingIcon={<Ban aria-hidden="true" className="size-4" />} onClick={() => void submit()}>
          {refundCents && refundCents > 0 ? `Cancel & refund ${formatMoney(refundCents)}` : "Cancel appointment"}
        </Button>
      </ActionBar>
    </div>
  );
}
