"use client";

import { CircleCheck, CircleCheckBig, Play, Receipt, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import {
  ActionBar,
  AppointmentFlowFrame,
  ClientBookingCard,
  Notice,
  PaymentSummary,
  StepTimeline,
  lifecycleSteps,
} from "@/features/studio/components/appointments/flow/FlowParts";
import { Card, FormError, Pill, SelectField, TextAreaField } from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  BALANCE_METHOD_LABEL,
  formatDate,
  formatMoney,
  formatTime,
  parseMoneyToCents,
} from "@/features/studio/lib/format";
import type {
  AppointmentDetail,
  AppointmentDetailResponse,
  BalanceCollectionMethod,
} from "@/features/studio/lib/types";

const TIP_PRESETS = [0, 15, 20] as const;

const CHECKLIST = [
  "Consultation reviewed with the client",
  "Service delivered as booked",
  "Final look checked and approved by the client",
  "Aftercare advice given",
];

export function CompleteFlow({ appointmentId }: { appointmentId: string }) {
  return (
    <AppointmentFlowFrame
      appointmentId={appointmentId}
      title={(appointment) => (appointment.status === "COMPLETED" ? "Appointment receipt" : "Complete appointment")}
      badge={(appointment) => <CheckedInBadge appointment={appointment} />}
    >
      {(appointment, apply) =>
        appointment.status === "COMPLETED" ? (
          <CompletedSummary appointment={appointment} />
        ) : (
          <CompleteBody appointment={appointment} apply={apply} />
        )
      }
    </AppointmentFlowFrame>
  );
}

function CheckedInBadge({ appointment }: { appointment: AppointmentDetail }) {
  const { timezone } = useStudio();
  if (appointment.status === "COMPLETED") return <Pill tone="success">Completed</Pill>;
  if (!appointment.lifecycle.checkInAt) return null;
  return <Pill tone="success">Checked in at {formatTime(appointment.lifecycle.checkInAt, timezone)}</Pill>;
}

function CompleteBody({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { timezone } = useStudio();
  const notify = useToast();
  const due = appointment.pricing.balanceDueCents;
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const [notes, setNotes] = useState("");
  const [collected, setCollected] = useState((due / 100).toFixed(2));
  const [method, setMethod] = useState<BalanceCollectionMethod>("CASH");
  const [tipMode, setTipMode] = useState<string>("0");
  const [customTip, setCustomTip] = useState("");
  const [pending, setPending] = useState<"collect" | "skip" | "start" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = appointment.allowedActions;
  const collectedCents = parseMoneyToCents(collected || "0");
  const tipCents =
    tipMode === "custom"
      ? parseMoneyToCents(customTip || "0")
      : Math.round((appointment.pricing.servicePriceCents * Number(tipMode)) / 100);
  const allChecked = checked.every(Boolean);

  const complete = async (collect: boolean) => {
    if (collect && (collectedCents === null || tipCents === null)) {
      setError("Enter amounts as numbers, for example 45 or 45.50.");
      return;
    }
    if (collect && collectedCents !== null && collectedCents > due) {
      setError(`The balance due is ${formatMoney(due)}. Record anything extra as a tip.`);
      return;
    }
    setPending(collect ? "collect" : "skip");
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/appointments/${appointment.id}/complete`,
        "POST",
        {
          tipCents: collect ? (tipCents ?? 0) : 0,
          ...(collect && (due > 0 || (collectedCents ?? 0) > 0)
            ? { balanceCollection: { method, amountCents: collectedCents ?? 0 } }
            : {}),
          ...(notes.trim() ? { completionNotes: notes.trim() } : {}),
        },
      );
      notify({
        tone: "success",
        title: "Appointment completed",
        description: collect
          ? `${formatMoney((collectedCents ?? 0) + (tipCents ?? 0))} recorded today.`
          : due > 0
            ? `${formatMoney(due)} is still due from the client.`
            : undefined,
      });
      apply(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const startService = async () => {
    setPending("start");
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/appointments/${appointment.id}/start`,
        "POST",
      );
      notify({ tone: "success", title: "Service started" });
      apply(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  if (!actions.complete && !actions.startService) {
    return (
      <div className="grid gap-5">
        <ClientBookingCard appointment={appointment} />
        <Card>
          <Notice tone="warning" title="This appointment can't be completed yet">
            {appointment.status === "CONFIRMED"
              ? "Check the client in and start the service first."
              : appointment.status === "PENDING_PAYMENT"
                ? "The booking isn't confirmed. The client hasn't paid the deposit."
                : appointment.status === "ARRIVED" || appointment.status === "IN_PROGRESS"
                  ? "Your role can view this appointment but not change it."
                  : "It is closed."}
          </Notice>
          <div className="mt-4 flex flex-wrap gap-2">
            {appointment.allowedActions.checkIn ? (
              <Link href={`/studio/appointments/${appointment.id}/check-in`} className="btn-primary">
                Check in client
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

  const tipButton = (value: string, label: string, sub?: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={tipMode === value}
      onClick={() => setTipMode(value)}
      className={`grid min-h-14 place-items-center rounded-xl border px-2 py-1.5 text-center text-sm ${
        tipMode === value
          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
      }`}
    >
      <span className="font-medium">{label}</span>
      {sub ? <span className={`text-xs ${tipMode === value ? "text-white/85" : "text-[var(--color-text-muted)]"}`}>{sub}</span> : null}
    </button>
  );

  const receiptTotal =
    appointment.pricing.depositPaidCents + (collectedCents ?? 0) + (tipCents ?? 0);

  return (
    <div className="grid gap-5">
      <ClientBookingCard appointment={appointment} />

      {actions.startService ? (
        <Notice tone="info" icon={Play} title="The client is checked in but the service hasn't started">
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span>Start the service to record when it began, then complete it here.</span>
            <Button loading={pending === "start"} onClick={() => void startService()}>
              Start service
            </Button>
          </div>
        </Notice>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          <Card title="Service completed">
            <fieldset>
              <legend className="sr-only">Completion checklist</legend>
              <ul className="grid gap-1">
                {CHECKLIST.map((item, index) => (
                  <li key={item}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-[15px] hover:bg-[var(--color-brand-soft)]/40">
                      <input
                        type="checkbox"
                        checked={checked[index]}
                        onChange={(event) =>
                          setChecked((current) => current.map((value, i) => (i === index ? event.target.checked : value)))
                        }
                        className="size-5 shrink-0 accent-[var(--color-brand)]"
                      />
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              A checklist for you and your team. It isn&apos;t saved or shown to the client.
            </p>
            <div className="mt-4">
              <TextAreaField
                label="Final notes"
                hint="Private to your team. Saved on the appointment."
                value={notes}
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Knotless, waist length, 1B with honey blonde peekaboo"
              />
            </div>
          </Card>

          <Card title="Collect the balance" icon={Receipt}>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="collected-amount" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Amount collected
                  </label>
                  <input
                    id="collected-amount"
                    inputMode="decimal"
                    value={collected}
                    onChange={(event) => setCollected(event.target.value)}
                    className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-ring"
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">Balance due {formatMoney(due)}</p>
                </div>
                <SelectField
                  label="Paid by"
                  value={method}
                  onChange={(event) => setMethod(event.target.value as BalanceCollectionMethod)}
                >
                  {(Object.keys(BALANCE_METHOD_LABEL) as BalanceCollectionMethod[]).map((key) => (
                    <option key={key} value={key}>
                      {BALANCE_METHOD_LABEL[key]}
                    </option>
                  ))}
                </SelectField>
              </div>
              <Notice title="Paid in person">
                Record money taken at the studio (cash, card terminal, mobile money). Charging a saved card isn&apos;t
                available yet.
              </Notice>

              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium text-[var(--color-text-primary)]">Add tip</legend>
                <div className="grid grid-cols-4 gap-2">
                  {TIP_PRESETS.map((percent) =>
                    tipButton(
                      String(percent),
                      percent === 0 ? "$0" : `${percent}%`,
                      percent === 0
                        ? "No tip"
                        : formatMoney(Math.round((appointment.pricing.servicePriceCents * percent) / 100)),
                    ),
                  )}
                  {tipButton("custom", "Custom")}
                </div>
                {tipMode === "custom" ? (
                  <div className="grid max-w-xs gap-1.5">
                    <label htmlFor="custom-tip" className="text-sm font-medium">
                      Tip amount
                    </label>
                    <input
                      id="custom-tip"
                      inputMode="decimal"
                      value={customTip}
                      onChange={(event) => setCustomTip(event.target.value)}
                      placeholder="0.00"
                      className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-ring"
                    />
                  </div>
                ) : null}
              </fieldset>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 *:min-w-0">
          <Card title="Appointment timeline">
            <StepTimeline
              steps={[
                ...lifecycleSteps(appointment, timezone).filter((step) => step.label !== "Completed"),
                {
                  label: allChecked ? "Service ready to close" : "Ready to close",
                  state: allChecked ? "current" : "upcoming",
                  detail: allChecked ? "Checklist done" : `${checked.filter(Boolean).length} of ${CHECKLIST.length} checks done`,
                },
              ]}
            />
          </Card>
          <PaymentSummary appointment={appointment} />
          <Card title="Receipt preview">
            <dl className="grid gap-2 text-sm">
              {[
                ["Client", appointment.client.name],
                ["Date", `${formatDate(appointment.startAt, timezone, { month: "short", day: "numeric", year: "numeric" })} · ${formatTime(appointment.startAt, timezone)}`],
                ["Service", appointment.service.name],
                ["Deposit paid", formatMoney(appointment.pricing.depositPaidCents)],
                ["Balance paid", collectedCents === null ? "—" : formatMoney(collectedCents)],
                ["Tip", tipCents === null ? "—" : formatMoney(tipCents)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-muted)]">{label}</dt>
                  <dd className="min-w-0 truncate text-right text-[var(--color-text-primary)]">{value}</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between gap-4 border-t border-[var(--color-border)] pt-2">
                <dt className="font-medium">Total paid</dt>
                <dd className="font-display text-xl">{formatMoney(receiptTotal)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {allChecked && actions.complete ? (
        <Notice tone="success" icon={Sparkles} title="You're all set to complete this appointment!" />
      ) : null}
      <FormError message={error} />
      {actions.complete ? (
        <ActionBar note="Completing closes the appointment. The client can then leave a review from their bookings.">
          <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
            Save as in progress
          </Link>
          <Button variant="outline" loading={pending === "skip"} onClick={() => void complete(false)}>
            Complete without collecting
          </Button>
          <Button
            loading={pending === "collect"}
            leadingIcon={<CircleCheck aria-hidden="true" className="size-4" />}
            onClick={() => void complete(true)}
          >
            {collectedCents !== null && tipCents !== null && collectedCents + tipCents > 0
              ? `Record ${formatMoney(collectedCents + tipCents)} & complete`
              : "Complete appointment"}
          </Button>
        </ActionBar>
      ) : null}
    </div>
  );
}

function CompletedSummary({ appointment }: { appointment: AppointmentDetail }) {
  const { timezone } = useStudio();
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
      <div className="grid gap-5 *:min-w-0">
        <section className="rounded-[var(--radius-panel)] border-2 border-[var(--color-success)]/50 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
              <CircleCheckBig strokeWidth={1.8} className="size-7" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl">Appointment completed</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {appointment.lifecycle.completedAt
                  ? `Closed ${formatDate(appointment.lifecycle.completedAt, timezone)} at ${formatTime(appointment.lifecycle.completedAt, timezone)}`
                  : "Closed"}
              </p>
            </div>
          </div>
          {appointment.notes.completionNotes ? (
            <p className="mt-4 rounded-xl bg-[var(--color-surface-strong)] p-3 text-sm">{appointment.notes.completionNotes}</p>
          ) : null}
        </section>
        <ClientBookingCard appointment={appointment} />
      </div>
      <div className="grid gap-5 *:min-w-0">
        <PaymentSummary
          appointment={appointment}
          title="Receipt"
          footer={
            <div className="flex items-baseline justify-between gap-4 rounded-xl bg-[var(--color-surface-strong)] px-4 py-3">
              <span className="font-medium">Total paid</span>
              <span className="font-display text-2xl">
                {formatMoney(
                  appointment.pricing.depositPaidCents +
                    appointment.pricing.balanceCollectedCents +
                    appointment.pricing.tipCents -
                    appointment.pricing.refundedCents,
                )}
              </span>
            </div>
          }
        />
        <ActionBar>
          <Link href="/studio/appointments" className="btn-secondary">
            Back to bookings
          </Link>
          <Link href={`/studio/appointments/${appointment.id}`} className="btn-primary">
            View appointment
          </Link>
        </ActionBar>
      </div>
    </div>
  );
}
