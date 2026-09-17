"use client";

import {
  ArrowDown,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  MessageSquareQuote,
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
  PaymentSummary,
  relativeToNow,
} from "@/features/studio/components/appointments/flow/FlowParts";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  Card,
  FormError,
  Pill,
  SkeletonRows,
  TextAreaField,
  Toggle,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioFetcher, studioRequest, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  addDaysToKey,
  dateKeyIn,
  formatDate,
  formatDateTime,
  formatDuration,
  formatTime,
  keyToLabel,
} from "@/features/studio/lib/format";
import { useNow } from "@/features/studio/lib/hooks";
import type {
  AppointmentDetail,
  AppointmentDetailResponse,
  AppointmentOpenings,
  ChangeRequest,
  SlotCheck,
} from "@/features/studio/lib/types";

export function RescheduleFlow({ appointmentId }: { appointmentId: string }) {
  return (
    <AppointmentFlowFrame
      appointmentId={appointmentId}
      title={(appointment) => (pendingReschedule(appointment) ? "Reschedule request" : "Reschedule appointment")}
      badge={(appointment) =>
        pendingReschedule(appointment) ? <Pill tone="warning">Awaiting decision</Pill> : null
      }
    >
      {(appointment, apply) => <RescheduleBody appointment={appointment} apply={apply} />}
    </AppointmentFlowFrame>
  );
}

function pendingReschedule(appointment: AppointmentDetail) {
  return (
    appointment.changeRequests.find((request) => request.status === "PENDING" && request.type === "RESCHEDULE") ??
    null
  );
}

function RescheduleBody({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { timezone } = useStudio();
  const router = useRouter();
  const notify = useToast();
  const now = useNow(60_000);
  const request = pendingReschedule(appointment);
  const actions = appointment.allowedActions;

  const initialStart = request?.requestedStartAt ?? appointment.startAt;
  const [dateKey, setDateKey] = useState(() => dateKeyIn(new Date(initialStart), timezone));
  const [selected, setSelected] = useState<string | null>(request?.requestedStartAt ?? null);
  const [reason, setReason] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);
  const [declining, setDeclining] = useState(false);
  const [pending, setPending] = useState<"approve" | "move" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: openings, error: openingsError } = useSWR<AppointmentOpenings>(
    withQuery(`/api/v1/business/appointments/${appointment.id}/openings`, { date: dateKey }),
    studioFetcher,
  );
  const { data: check } = useSWR<SlotCheck>(
    selected ? withQuery(`/api/v1/business/appointments/${appointment.id}/slot-check`, { startAt: selected }) : null,
    studioFetcher,
  );

  // The client may have asked for a time that isn't on the booking grid
  // (e.g. 2:00 PM when openings start at :15/:45); still show it as a choice,
  // and let the conflict check below say whether it works.
  const requestedOnThisDay =
    request?.requestedStartAt && dateKeyIn(new Date(request.requestedStartAt), timezone) === dateKey
      ? request.requestedStartAt
      : null;
  const slots = openings
    ? requestedOnThisDay && !openings.slots.some((slot) => slot.startAt === requestedOnThisDay)
      ? [
          {
            startAt: requestedOnThisDay,
            endAt: new Date(new Date(requestedOnThisDay).getTime() + openings.durationMins * 60_000).toISOString(),
            isCurrent: false,
          },
          ...openings.slots,
        ].sort((a, b) => a.startAt.localeCompare(b.startAt))
      : openings.slots
    : [];

  const canChange = actions.reschedule || actions.decideChangeRequests;
  const choseRequested = Boolean(request?.requestedStartAt && selected === request.requestedStartAt);
  const today = now ? dateKeyIn(new Date(now), timezone) : null;

  if (!canChange) {
    return (
      <Card>
        <Notice tone="warning" title="This appointment can't be rescheduled">
          {appointment.status === "ARRIVED" || appointment.status === "IN_PROGRESS"
            ? "The client is already checked in."
            : appointment.status === "CONFIRMED" || appointment.status === "PENDING_PAYMENT"
              ? "Your role can view this appointment but not change it."
              : "It is closed."}
        </Notice>
        <div className="mt-4">
          <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
            Back to appointment
          </Link>
        </div>
      </Card>
    );
  }

  const approve = async (changeRequest: ChangeRequest) => {
    setPending("approve");
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/change-requests/${changeRequest.id}`,
        "POST",
        { decision: "APPROVE" },
      );
      notify({
        tone: "success",
        title: "Reschedule approved",
        description: `${appointment.client.name} is now booked for ${formatDateTime(response.appointment.startAt, timezone)}.`,
      });
      apply(response);
      router.push(`/studio/appointments/${appointment.id}`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const move = async () => {
    if (!selected) {
      setError("Choose a new time first.");
      return;
    }
    setPending("move");
    setError(null);
    try {
      let response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/appointments/${appointment.id}/reschedule`,
        "POST",
        {
          startAt: selected,
          // With an open request, the decline below tells the client instead,
          // so they get one email that explains both the "no" and the new time.
          notifyClient: request ? false : notifyClient,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      );
      if (request) {
        response = await studioRequest<AppointmentDetailResponse>(
          `/api/v1/business/change-requests/${request.id}`,
          "POST",
          {
            decision: "DECLINE",
            note: `The time you asked for wasn't available, so we've moved your appointment to ${formatDateTime(selected, timezone)}.${
              reason.trim() ? ` ${reason.trim()}` : ""
            }`.slice(0, 500),
          },
        );
      }
      notify({
        tone: "success",
        title: "Appointment moved",
        description: `Now ${formatDateTime(selected, timezone)}.`,
      });
      apply(response);
      router.push(`/studio/appointments/${appointment.id}`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="grid gap-5">
      {request ? (
        <p className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
          <span>Request received {now ? relativeToNow(request.createdAt, now).text : formatDateTime(request.createdAt, timezone)}</span>
          <span className="inline-flex items-center gap-1">
            Booking <CopyReference value={appointment.reference} />
          </span>
        </p>
      ) : null}

      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <TimeCard
          label="Original appointment"
          appointment={appointment}
          startAt={appointment.startAt}
          tone="neutral"
        />
        <div aria-hidden="true" className="grid place-items-center text-[var(--color-brand)]">
          <ArrowDown className="size-6 lg:hidden" />
          <ArrowRight className="hidden size-6 lg:block" />
        </div>
        <TimeCard
          label={request ? "Requested change" : "New time"}
          appointment={appointment}
          startAt={request ? request.requestedStartAt : selected}
          tone="brand"
        />
      </div>

      {request ? (
        <Card title="Client's reason" icon={MessageSquareQuote}>
          <p className="text-[15px] text-[var(--color-text-primary)]">“{request.reason}”</p>
        </Card>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          <Card
            title="Select a new time"
            icon={CalendarClock}
            action={<span className="text-xs text-[var(--color-text-muted)]">Times in {timezone.replaceAll("_", " ")}</span>}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous day"
                disabled={today !== null && dateKey <= today}
                onClick={() => setDateKey((key) => addDaysToKey(key, -1))}
                className="grid size-11 place-items-center rounded-lg border border-[var(--color-border)] hover:border-[var(--color-brand)] disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
              </button>
              <label className="relative min-w-0 flex-1 text-center">
                <span className="block font-display text-lg">
                  {keyToLabel(dateKey, { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <input
                  type="date"
                  value={dateKey}
                  min={today ?? undefined}
                  onChange={(event) => event.target.value && setDateKey(event.target.value)}
                  aria-label="Pick a date"
                  className="mx-auto mt-1 block min-h-9 rounded-lg border border-[var(--color-border)] px-2 text-sm focus-ring"
                />
              </label>
              <button
                type="button"
                aria-label="Next day"
                onClick={() => setDateKey((key) => addDaysToKey(key, 1))}
                className="grid size-11 place-items-center rounded-lg border border-[var(--color-border)] hover:border-[var(--color-brand)]"
              >
                <ChevronRight aria-hidden="true" className="size-5" />
              </button>
            </div>

            {openingsError ? (
              <FormError message={errorMessage(openingsError)} />
            ) : !openings ? (
              <SkeletonRows label="Loading open times" rows={2} />
            ) : !openings.workingDay && slots.length === 0 ? (
              <Notice title="You don't work this day">
                There are no working hours set for {keyToLabel(dateKey, { weekday: "long" })}. Pick another day, or change
                your hours under Availability.
              </Notice>
            ) : slots.length === 0 ? (
              <Notice tone="warning" title="Fully booked">
                No {formatDuration(openings.durationMins)} opening is left on this day. Try another day.
              </Notice>
            ) : (
              <div role="radiogroup" aria-label="Open times" className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">
                {slots.map((slot) => {
                  const active = selected === slot.startAt;
                  const isRequested = request?.requestedStartAt === slot.startAt;
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelected(slot.startAt)}
                      className={`relative grid gap-0.5 rounded-xl border-2 p-3 text-left ${
                        active
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]/50"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
                      }`}
                    >
                      {active ? (
                        <span aria-hidden="true" className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-[var(--color-brand)] text-white">
                          <Check strokeWidth={3} className="size-3" />
                        </span>
                      ) : null}
                      <span className="text-sm font-medium whitespace-nowrap">{formatTime(slot.startAt, timezone)}</span>
                      <span className="text-xs whitespace-nowrap text-[var(--color-text-muted)]">
                        to {formatTime(slot.endAt, timezone)}
                      </span>
                      <span className={`text-xs ${slot.isCurrent ? "text-[var(--color-text-muted)]" : isRequested ? "text-[var(--color-brand)]" : "text-[var(--color-success)]"}`}>
                        {slot.isCurrent ? "Current time" : isRequested ? "Client's pick" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {!request ? (
            <Card title="Message">
              <div className="grid gap-4">
                <TextAreaField
                  label="Reason (optional)"
                  hint={notifyClient ? "Included in the email to the client." : "Kept in the appointment history."}
                  value={reason}
                  maxLength={400}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Your stylist is running a course that morning."
                />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[var(--color-text-primary)]">Email the client about the new time</span>
                  <Toggle checked={notifyClient} onChange={setNotifyClient} label="Email the client about the new time" />
                </div>
              </div>
            </Card>
          ) : !choseRequested && selected ? (
            <Card title="Note to the client">
              <TextAreaField
                label="Add a message (optional)"
                hint="Sent with the new time, in the same email."
                value={reason}
                maxLength={300}
                onChange={(event) => setReason(event.target.value)}
              />
            </Card>
          ) : null}
        </div>

        <div className="grid gap-5 *:min-w-0">
          <Card title="Reschedule checks">
            {!selected ? (
              <p className="text-sm text-[var(--color-text-muted)]">Choose a time to check it against your calendar.</p>
            ) : !check ? (
              <SkeletonRows label="Checking the time" rows={1} />
            ) : (
              <ul className="grid gap-3 text-sm">
                <CheckRow ok={check.available} label={check.available ? "No conflicts" : "Conflict"} detail={check.conflict?.message} />
                <CheckRow
                  ok={check.withinWorkingHours}
                  label={check.withinWorkingHours ? "Within working hours" : "Outside working hours"}
                  warnOnly
                />
                <CheckRow ok label="No reschedule fee" detail="The deposit moves with the booking." />
                {appointment.rescheduleCount > 0 ? (
                  <CheckRow
                    ok={false}
                    warnOnly
                    label={`Rescheduled ${appointment.rescheduleCount} time${appointment.rescheduleCount === 1 ? "" : "s"} before`}
                  />
                ) : null}
              </ul>
            )}
          </Card>
          <Card title="What happens next">
            <ol className="grid gap-2 text-sm text-[var(--color-text-muted)]">
              <li>1. The appointment moves and the old time is freed.</li>
              <li>2. Reminders are rescheduled for the new time.</li>
              <li>3. {request || notifyClient ? "The client gets an email with the decision." : "The client isn't emailed."}</li>
            </ol>
          </Card>
          <PaymentSummary appointment={appointment} />
        </div>
      </div>

      <FormError message={error} />
      <ActionBar
        note={
          request
            ? "Approving confirms the client's time. Choosing another time moves the booking and tells the client why."
            : undefined
        }
      >
        {request && actions.decideChangeRequests ? (
          <Button variant="outline" leadingIcon={<X aria-hidden="true" className="size-4" />} onClick={() => setDeclining(true)}>
            Decline change
          </Button>
        ) : (
          <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
            Keep current time
          </Link>
        )}
        {request && choseRequested && actions.decideChangeRequests ? (
          <Button
            loading={pending === "approve"}
            disabled={check ? !check.available : true}
            leadingIcon={<CircleCheck aria-hidden="true" className="size-4" />}
            onClick={() => void approve(request)}
          >
            Approve reschedule
          </Button>
        ) : actions.reschedule ? (
          <Button
            loading={pending === "move"}
            disabled={!selected || (check ? !check.available : true)}
            leadingIcon={<CalendarClock aria-hidden="true" className="size-4" />}
            onClick={() => void move()}
          >
            {selected ? `Move to ${formatDate(selected, timezone)} · ${formatTime(selected, timezone)}` : "Choose a time"}
          </Button>
        ) : null}
      </ActionBar>

      {declining && request ? (
        <DeclineRequestDialog
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

function TimeCard({
  label,
  appointment,
  startAt,
  tone,
}: {
  label: string;
  appointment: AppointmentDetail;
  startAt: string | null;
  tone: "neutral" | "brand";
}) {
  const { timezone } = useStudio();
  const end = startAt ? new Date(new Date(startAt).getTime() + appointment.durationMins * 60_000) : null;
  return (
    <section
      className={`min-w-0 rounded-[var(--radius-panel)] border p-4 shadow-[var(--shadow-subtle)] sm:p-5 ${
        tone === "brand"
          ? "border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)]/30"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p className={`text-xs font-medium tracking-wide uppercase ${tone === "brand" ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"}`}>
        {label}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={appointment.client.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg">{appointment.client.name}</p>
          <p className="truncate text-sm text-[var(--color-text-muted)]">
            {appointment.service.name}
            {appointment.teamMember ? ` · ${appointment.teamMember.name}` : ""}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--color-text-muted)]">Date</dt>
          <dd className="font-medium">{startAt ? formatDate(startAt, timezone, { weekday: "short", month: "short", day: "numeric" }) : "To be chosen"}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-muted)]">Time</dt>
          <dd className="font-medium">
            {startAt && end ? `${formatTime(startAt, timezone)} – ${formatTime(end, timezone)}` : "To be scheduled"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[var(--color-text-muted)]">Location</dt>
          <dd className="truncate font-medium">{appointment.location.label}</dd>
        </div>
      </dl>
    </section>
  );
}

function CheckRow({
  ok,
  label,
  detail,
  warnOnly = false,
}: {
  ok: boolean;
  label: string;
  detail?: string;
  warnOnly?: boolean;
}) {
  return (
    <li className="flex gap-2.5">
      {ok ? (
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--color-success)]" />
      ) : (
        <CircleAlert
          aria-hidden="true"
          className={`mt-0.5 size-5 shrink-0 ${warnOnly ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}`}
        />
      )}
      <div className="min-w-0">
        <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
        {detail ? <p className="text-[var(--color-text-muted)]">{detail}</p> : null}
      </div>
    </li>
  );
}

function DeclineRequestDialog({
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
    setPending(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/change-requests/${request.id}`,
        "POST",
        { decision: "DECLINE", ...(note.trim() ? { note: note.trim() } : {}) },
      );
      notify({ tone: "success", title: "Request declined", description: "The original time stays booked." });
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
      title="Decline change"
      description="The client keeps their original appointment."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Go back
          </Button>
          <Button variant="danger" loading={pending} onClick={() => void submit()}>
            Decline change
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <TextAreaField
          label="Message to the client (optional)"
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Sorry, we're fully booked that day."
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
