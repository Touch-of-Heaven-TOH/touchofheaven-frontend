"use client";

import { CircleCheck, CircleCheckBig, Clock, CreditCard, MessageCircle, ReceiptText, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { RefundDialog } from "@/features/studio/components/appointments/AppointmentActions";
import {
  ActionBar,
  AppointmentFlowFrame,
  ClientBookingCard,
  CopyReference,
  StepTimeline,
  type TimelineStep,
} from "@/features/studio/components/appointments/flow/FlowParts";
import { Card, EmptyPanel, Pill } from "@/features/studio/components/ui/primitives";
import { useStudio } from "@/features/studio/lib/context";
import { formatDateTime, formatMoney } from "@/features/studio/lib/format";
import type { AppointmentDetail, AppointmentDetailResponse, Refund } from "@/features/studio/lib/types";

const REFUND_STATE: Record<Refund["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  REQUESTED: { label: "Requested", tone: "warning" },
  PROCESSING: { label: "Processing", tone: "warning" },
  SUCCEEDED: { label: "Refunded", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

const REASON_LABEL: Record<string, string> = {
  CLIENT_CANCELLATION: "Client cancellation",
  BUSINESS_CANCELLATION: "Cancelled by business",
  BUSINESS_GOODWILL: "Goodwill refund",
};

export function RefundFlow({ appointmentId }: { appointmentId: string }) {
  return (
    <AppointmentFlowFrame
      appointmentId={appointmentId}
      title="Refund"
      backHref="/studio/appointments"
      backLabel="Bookings"
      badge={(appointment) => {
        const latest = appointment.refunds[0];
        return latest ? <Pill tone={REFUND_STATE[latest.status].tone}>{REFUND_STATE[latest.status].label}</Pill> : null;
      }}
    >
      {(appointment, apply) => <RefundBody appointment={appointment} apply={apply} />}
    </AppointmentFlowFrame>
  );
}

function RefundBody({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { timezone } = useStudio();
  const [issuing, setIssuing] = useState(false);
  const refunds = appointment.refunds;
  const latest = refunds[0];
  const cancelled = appointment.status === "CANCELLED_BY_CUSTOMER" || appointment.status === "CANCELLED_BY_PROFESSIONAL";

  if (!latest) {
    return (
      <div className="grid gap-5">
        <ClientBookingCard appointment={appointment} />
        <EmptyPanel
          icon={<ReceiptText aria-hidden="true" className="size-6" />}
          title="No refunds on this booking"
          description={
            appointment.allowedActions.refund
              ? "Refunds go back to the client's original payment method."
              : "Nothing has been refunded, and there is no deposit left to refund."
          }
          action={
            appointment.allowedActions.refund ? (
              <Button onClick={() => setIssuing(true)}>Issue a refund</Button>
            ) : (
              <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
                Back to appointment
              </Link>
            )
          }
        />
        {issuing ? <RefundDialog appointment={appointment} onClose={() => setIssuing(false)} onDone={apply} /> : null}
      </div>
    );
  }

  const done = latest.status === "SUCCEEDED";
  const failed = latest.status === "FAILED" || latest.status === "CANCELLED";
  const HeroIcon = done ? CircleCheckBig : failed ? TriangleAlert : Clock;

  const steps: TimelineStep[] = [
    { label: "Refund approved", detail: formatDateTime(latest.createdAt, timezone), state: "done" },
    {
      label: "Sent to payment provider",
      detail: latest.status === "REQUESTED" ? "Waiting to send" : undefined,
      state: latest.status === "REQUESTED" ? "upcoming" : failed ? "danger" : "done",
    },
    done
      ? {
          label: "Refund completed",
          detail: latest.completedAt ? formatDateTime(latest.completedAt, timezone) : undefined,
          state: "done",
        }
      : failed
        ? { label: "Refund failed", detail: latest.failureMessage ?? "The payment provider declined the refund.", state: "danger" }
        : { label: "Awaiting bank processing", detail: "Usually 5–10 business days", state: "warning" },
  ];

  return (
    <div className="grid gap-5">
      <section
        className={`flex flex-col items-center gap-2 rounded-[var(--radius-panel)] border bg-[var(--color-surface)] px-5 py-7 text-center shadow-[var(--shadow-subtle)] ${
          done ? "border-[var(--color-success)]/40" : failed ? "border-[var(--color-danger)]/40" : "border-[var(--color-warning)]/40"
        }`}
      >
        <span
          aria-hidden="true"
          className={`grid size-16 place-items-center rounded-full ${
            done
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : failed
                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
          }`}
        >
          <HeroIcon strokeWidth={1.6} className="size-9" />
        </span>
        <h2 className="font-display text-2xl sm:text-3xl">
          {done ? "Refund issued" : failed ? "Refund didn't go through" : "Refund on its way"}
        </h2>
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          {done
            ? "The payment provider has confirmed the refund. Banks can take a few days to show it."
            : failed
              ? "Nothing was returned to the client. You can try again below."
              : "The refund is now being processed."}
        </p>
        <p className={`font-display text-4xl ${failed ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-success)]"}`}>
          {formatMoney(latest.amountCents, latest.currency)}
        </p>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          <ClientBookingCard appointment={appointment} />
          <Card title="Refund details" icon={CreditCard}>
            <dl className="grid gap-3 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-sm text-[var(--color-text-muted)]">Refund to</dt>
                <dd>Original payment method</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--color-text-muted)]">Status</dt>
                <dd>
                  <Pill tone={REFUND_STATE[latest.status].tone}>{REFUND_STATE[latest.status].label}</Pill>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--color-text-muted)]">Reason</dt>
                <dd>{REASON_LABEL[latest.reasonCategory] ?? latest.reasonCategory.replaceAll("_", " ").toLowerCase()}</dd>
                {latest.explanation ? <dd className="text-sm text-[var(--color-text-muted)]">“{latest.explanation}”</dd> : null}
              </div>
              <div className="min-w-0">
                <dt className="text-sm text-[var(--color-text-muted)]">Receipt reference</dt>
                <dd className="min-w-0 break-all">
                  <CopyReference value={latest.providerReference ?? latest.id.slice(0, 8).toUpperCase()} />
                </dd>
              </div>
            </dl>
          </Card>
          {cancelled ? (
            <Card title="Cancellation confirmed">
              <ul className="grid gap-2 text-sm">
                {["Appointment cancelled", "Time released on your calendar", "Reminders to the client stopped"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CircleCheck aria-hidden="true" className="size-5 text-[var(--color-success)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-5 *:min-w-0">
          <Card title="Refund timeline">
            <StepTimeline steps={steps} label="Refund status" />
          </Card>
          {refunds.length > 1 ? (
            <Card title="All refunds on this booking">
              <ul className="grid gap-3">
                {refunds.map((refund) => (
                  <li key={refund.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium">{formatMoney(refund.amountCents, refund.currency)}</span>
                      <span className="block text-xs text-[var(--color-text-muted)]">{formatDateTime(refund.createdAt, timezone)}</span>
                    </span>
                    <Pill tone={REFUND_STATE[refund.status].tone}>{REFUND_STATE[refund.status].label}</Pill>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card>
            <Link
              href={`/studio/appointments/${appointment.id}#history`}
              className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline"
            >
              View audit record →
            </Link>
          </Card>
        </div>
      </div>

      <ActionBar>
        <Link href="/studio/messages" className="btn-secondary">
          <MessageCircle aria-hidden="true" className="size-4" />
          Message client
        </Link>
        {appointment.allowedActions.refund ? (
          <Button variant="outline" onClick={() => setIssuing(true)}>
            {failed ? "Try the refund again" : "Issue another refund"}
          </Button>
        ) : null}
        <Link href="/studio/appointments" className="btn-primary">
          Back to bookings
        </Link>
      </ActionBar>
      {issuing ? <RefundDialog appointment={appointment} onClose={() => setIssuing(false)} onDone={apply} /> : null}
    </div>
  );
}
