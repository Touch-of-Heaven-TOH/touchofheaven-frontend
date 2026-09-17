"use client";

import {
  BellRing,
  CalendarClock,
  CircleCheck,
  Clock,
  Hourglass,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import {
  ActionBar,
  AppointmentFlowFrame,
  ChoiceTile,
  ClientBookingCard,
  Notice,
  PaymentSummary,
  StepTimeline,
  lifecycleSteps,
} from "@/features/studio/components/appointments/flow/FlowParts";
import { Card, FormError, Pill, TextAreaField } from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { formatMoney, formatTime } from "@/features/studio/lib/format";
import { useNow } from "@/features/studio/lib/hooks";
import type { AppointmentDetail, AppointmentDetailResponse } from "@/features/studio/lib/types";

type Choice = "wait" | "arrived" | "noshow";

export function NoShowFlow({ appointmentId }: { appointmentId: string }) {
  return (
    <AppointmentFlowFrame
      appointmentId={appointmentId}
      title="Mark as no-show"
      backHref="/studio/appointments"
      backLabel="Bookings"
      badge={(appointment) => <LateBadge appointment={appointment} />}
    >
      {(appointment, apply) => <NoShowBody appointment={appointment} apply={apply} />}
    </AppointmentFlowFrame>
  );
}

function LateBadge({ appointment }: { appointment: AppointmentDetail }) {
  const now = useNow(15_000);
  if (appointment.status === "NO_SHOW") return <Pill tone="neutral">No-show</Pill>;
  if (!now || appointment.status !== "CONFIRMED") return null;
  const late = Math.floor((now - new Date(appointment.startAt).getTime()) / 60_000);
  if (late <= 0) return <Pill tone="info">Not started yet</Pill>;
  const hours = Math.floor(late / 60);
  return (
    <Pill tone="warning" icon={Clock}>
      Client late {hours > 0 ? `${hours} hr${hours === 1 ? "" : "s"} ${late % 60} min` : `${late} min`}
    </Pill>
  );
}

function NoShowBody({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { timezone } = useStudio();
  const notify = useToast();
  const now = useNow(15_000);
  const [choice, setChoice] = useState<Choice>("noshow");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = appointment.allowedActions;
  const graceEndsAt = new Date(
    new Date(appointment.startAt).getTime() + appointment.noShowGraceMinutes * 60_000,
  ).toISOString();
  const graceLeftMs = now ? new Date(graceEndsAt).getTime() - now : Number.POSITIVE_INFINITY;
  const deposit = appointment.pricing.depositPaidCents;

  if (appointment.status === "NO_SHOW") {
    return (
      <div className="grid gap-5">
        <ClientBookingCard appointment={appointment} />
        <Card>
          <Notice tone="info" icon={UserX} title="Marked as no-show">
            {appointment.lifecycle.noShowAt
              ? `Recorded at ${formatTime(appointment.lifecycle.noShowAt, timezone)}. `
              : ""}
            The time was released and the deposit was kept under your policy.
          </Notice>
        </Card>
        <ActionBar>
          <Link href="/studio/appointments" className="btn-secondary">
            Back to bookings
          </Link>
          <Link href={`/studio/appointments/${appointment.id}`} className="btn-primary">
            View appointment
          </Link>
        </ActionBar>
      </div>
    );
  }

  if (appointment.status !== "CONFIRMED") {
    return (
      <div className="grid gap-5">
        <ClientBookingCard appointment={appointment} />
        <Card>
          <Notice tone="warning" title="Only a confirmed appointment that hasn't checked in can be a no-show">
            {appointment.status === "ARRIVED" || appointment.status === "IN_PROGRESS"
              ? "This client has already checked in."
              : "This appointment is already closed."}
          </Notice>
          <div className="mt-4">
            <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
              Back to appointment
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const submit = async () => {
    if (note.trim().length < 3) {
      setError("Add a short internal note, for example who you tried to contact and when.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/appointments/${appointment.id}/no-show`,
        "POST",
        { note: note.trim() },
      );
      notify({ tone: "success", title: "Marked as no-show", description: "The time is free again." });
      apply(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  const graceMinutesLeft = Math.max(0, Math.ceil(graceLeftMs / 60_000));

  return (
    <div className="grid gap-5">
      <ClientBookingCard appointment={appointment} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          <Card title="Appointment status">
            <StepTimeline
              steps={[
                ...lifecycleSteps(appointment, timezone).slice(0, 2),
                {
                  label: "Scheduled start",
                  detail: formatTime(appointment.startAt, timezone),
                  state: "done",
                  icon: CalendarClock,
                },
                {
                  label: `Grace period ${appointment.noShowGraceMinutes} minutes`,
                  detail: `Until ${formatTime(graceEndsAt, timezone)}`,
                  state: graceLeftMs <= 0 ? "done" : "warning",
                  icon: Hourglass,
                  badge:
                    graceLeftMs > 0 && now ? <Pill tone="warning">{graceMinutesLeft} min left</Pill> : undefined,
                },
                {
                  label: "Check-in status",
                  detail: "Not checked in",
                  state: "danger",
                },
              ]}
            />
          </Card>

          <Card title="Recommended next steps">
            <div role="radiogroup" aria-label="Next step" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ChoiceTile
                name="no-show-choice"
                icon={Hourglass}
                title="Keep waiting"
                description="Leave the booking open for now"
                selected={choice === "wait"}
                onSelect={() => setChoice("wait")}
              />
              <ChoiceTile
                name="no-show-choice"
                icon={UserCheck}
                title="Client arrived"
                description="Check them in instead"
                selected={choice === "arrived"}
                onSelect={() => setChoice("arrived")}
              />
              <ChoiceTile
                name="no-show-choice"
                icon={UserX}
                title="Mark as no-show"
                description="Close the booking and free the time"
                selected={choice === "noshow"}
                onSelect={() => setChoice("noshow")}
              />
            </div>

            {choice === "noshow" ? (
              <div className="mt-5 grid gap-4">
                <TextAreaField
                  label="Internal note (required)"
                  hint="Kept in the appointment history. Not sent to the client."
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Called twice at 6:35 and 6:42 PM, no answer."
                />
                <div className="rounded-xl bg-[var(--color-surface-strong)] p-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">What will happen</p>
                  <ul className="mt-2 grid gap-2 text-sm text-[var(--color-text-muted)]">
                    {[
                      "The time slot is released on your calendar.",
                      deposit > 0
                        ? `The ${formatMoney(deposit)} deposit is kept, as your policy allows.`
                        : "No deposit was paid, so there is nothing to keep.",
                      "Pending reminders to the client are stopped.",
                      "The no-show is added to the client's record.",
                      "An audit event is recorded with your note.",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : choice === "arrived" ? (
              <div className="mt-5">
                <Notice title="Check the client in">
                  Record their arrival with their code or manually, then start the service.
                </Notice>
              </div>
            ) : (
              <div className="mt-5">
                <Notice icon={BellRing} title="Keep waiting">
                  Nothing changes. Come back here if the client still hasn&apos;t arrived.
                </Notice>
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-5 *:min-w-0">
          <PaymentSummary
            appointment={appointment}
            footer={
              deposit > 0 ? (
                <Notice tone="success" icon={ShieldCheck} title="Deposit received">
                  {formatMoney(deposit)} was paid through Touch of Heaven when the client booked.
                </Notice>
              ) : null
            }
          />
          <Card title="No-show policy" icon={ShieldCheck}>
            <p className="text-sm font-medium">{appointment.service.cancellationPolicy.label} policy</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{appointment.service.cancellationPolicy.description}</p>
            <ul className="mt-3 grid gap-1.5 text-sm text-[var(--color-text-muted)]">
              <li>• A no-show can be recorded {appointment.noShowGraceMinutes} minutes after the start time.</li>
              <li>• A client who doesn&apos;t arrive isn&apos;t refunded their deposit.</li>
            </ul>
          </Card>
        </div>
      </div>

      <FormError message={error} />
      <ActionBar
        note={
          choice === "noshow" && !actions.markNoShow && actions.noShowAvailableAt
            ? `You can mark a no-show from ${formatTime(actions.noShowAvailableAt, timezone)}, after the grace period.`
            : undefined
        }
      >
        <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
          Back to appointment
        </Link>
        {choice === "arrived" ? (
          <Link href={`/studio/appointments/${appointment.id}/check-in`} className="btn-primary">
            Check in client
          </Link>
        ) : choice === "wait" ? (
          <Link href="/studio/appointments" className="btn-primary">
            Keep waiting
          </Link>
        ) : (
          <Button
            variant="danger"
            loading={pending}
            disabled={!actions.markNoShow}
            leadingIcon={<UserX aria-hidden="true" className="size-4" />}
            onClick={() => void submit()}
          >
            Mark as no-show
          </Button>
        )}
      </ActionBar>
    </div>
  );
}
