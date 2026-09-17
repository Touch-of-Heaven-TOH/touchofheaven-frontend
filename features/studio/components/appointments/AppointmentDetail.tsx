"use client";

import {
  Ban,
  BellRing,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Phone,
  Play,
  ReceiptText,
  Scissors,
  Star,
  TriangleAlert,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  CopyReference,
  Notice,
  PaymentSummary,
  StepTimeline,
  lifecycleSteps,
  relativeToNow,
  useAppointment,
} from "@/features/studio/components/appointments/flow/FlowParts";
import {
  Avatar,
  Card,
  FormError,
  PageHeader,
  Pill,
  SelectField,
  SkeletonRows,
  StatusPill,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorCode, errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  APPOINTMENT_STATUS,
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/features/studio/lib/format";
import { useNow } from "@/features/studio/lib/hooks";
import type {
  AppointmentDetail as Detail,
  AppointmentDetailResponse,
  AppointmentStatus,
  TeamResponse,
  TimelineEntry,
} from "@/features/studio/lib/types";

const HAIR_LENGTH: Record<string, string> = {
  VERY_SHORT: "Very short",
  SHORT: "Short",
  MEDIUM: "Medium",
  LONG: "Long",
  VERY_LONG: "Very long",
};

export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const studio = useStudio();
  const { data, error, isLoading, mutate, apply } = useAppointment(appointmentId);

  if (isLoading && !data) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Appointment details" backHref="/studio/appointments" backLabel="Bookings" />
        <SkeletonRows label="Loading appointment" rows={3} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Appointment details" backHref="/studio/appointments" backLabel="Bookings" />
        {errorCode(error) === "APPOINTMENT_NOT_FOUND" ? (
          <ErrorState
            title="Appointment not found"
            description="It may belong to another business, or it is not assigned to you."
          />
        ) : (
          <ErrorState description={error ? errorMessage(error) : "Something went wrong."} onRetry={() => void mutate()} />
        )}
      </div>
    );
  }

  const appointment = data.appointment;
  const tz = studio.timezone;
  const pendingRequest = appointment.changeRequests.find((request) => request.status === "PENDING");

  return (
    <div className="grid gap-5 *:min-w-0">
      <PageHeader
        backHref="/studio/appointments"
        backLabel="Bookings"
        title="Appointment details"
        badge={<StatusPill status={appointment.status} />}
        description={<StartsLine appointment={appointment} />}
      />

      {pendingRequest ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 sm:flex-row sm:items-center">
          <MessageSquareWarning aria-hidden="true" className="size-6 shrink-0 text-[var(--color-warning)]" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--color-text-primary)]">
              {pendingRequest.type === "RESCHEDULE"
                ? `${appointment.client.name} asks to move this to ${
                    pendingRequest.requestedStartAt ? formatDateTime(pendingRequest.requestedStartAt, tz) : "another time"
                  }`
                : `${appointment.client.name} asks to cancel this appointment`}
            </p>
            <p className="truncate text-sm text-[var(--color-text-muted)]">“{pendingRequest.reason}”</p>
          </div>
          <Link
            href={`/studio/appointments/${appointment.id}/${pendingRequest.type === "RESCHEDULE" ? "reschedule" : "cancel"}`}
            className="btn-primary shrink-0"
          >
            Review request
          </Link>
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        <div className="grid gap-5 *:min-w-0">
          <ClientCard appointment={appointment} canViewClients={studio.can("clients")} />
          <ServiceCard appointment={appointment} />
          {appointment.consultation ? <ConsultationCard appointment={appointment} /> : null}
          <NotesCard appointment={appointment} onSaved={apply} />
          <div className="hidden xl:block">
            <HistoryCard timeline={appointment.timeline} timezone={tz} />
          </div>
        </div>

        <div className="grid gap-5 *:min-w-0">
          <ActionsCard appointment={appointment} apply={apply} />
          <Card title="Appointment status">
            <StepTimeline steps={lifecycleSteps(appointment, tz)} />
          </Card>
          <PaymentSummary
            appointment={appointment}
            footer={
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {appointment.status === "COMPLETED" ? (
                  <Link href={`/studio/appointments/${appointment.id}/complete`} className="inline-flex min-h-10 items-center gap-1.5 font-medium text-[var(--color-brand)] hover:underline">
                    <ReceiptText aria-hidden="true" className="size-4" />
                    View receipt
                  </Link>
                ) : null}
                {appointment.refunds.length > 0 ? (
                  <Link href={`/studio/appointments/${appointment.id}/refund`} className="inline-flex min-h-10 items-center gap-1.5 font-medium text-[var(--color-brand)] hover:underline">
                    <ReceiptText aria-hidden="true" className="size-4" />
                    {appointment.refunds.length === 1 ? "View refund" : `View ${appointment.refunds.length} refunds`}
                  </Link>
                ) : null}
              </div>
            }
          />
          {appointment.allowedActions.assign && studio.can("team") ? (
            <AssignmentCard appointment={appointment} onSaved={apply} />
          ) : appointment.teamMember ? (
            <Card title="Team member">
              <div className="flex items-center gap-3">
                <Avatar name={appointment.teamMember.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{appointment.teamMember.name}</p>
                  {appointment.teamMember.jobTitle ? (
                    <p className="text-sm text-[var(--color-text-muted)]">{appointment.teamMember.jobTitle}</p>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}
          {appointment.review ? (
            <Card title="Client review" icon={Star}>
              <p className="text-lg text-[var(--color-gold)]" aria-label={`${appointment.review.rating} out of 5 stars`}>
                {"★".repeat(appointment.review.rating)}
                <span className="text-[var(--color-border-strong,#ddd0cc)]">{"★".repeat(5 - appointment.review.rating)}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">{appointment.review.reviewBody}</p>
            </Card>
          ) : null}
        </div>

        <div className="xl:hidden">
          <HistoryCard timeline={appointment.timeline} timezone={tz} />
        </div>
      </div>
    </div>
  );
}

function StartsLine({ appointment }: { appointment: Detail }) {
  const { timezone } = useStudio();
  const now = useNow(30_000);
  const upcoming = appointment.status === "CONFIRMED" || appointment.status === "PENDING_PAYMENT";
  const relative = now ? relativeToNow(appointment.startAt, now) : null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {upcoming && relative ? (
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            relative.minutes < 0 ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"
          }`}
        >
          <BellRing aria-hidden="true" className="size-4" />
          {relative.minutes < 0 ? `Started ${relative.text}` : `Starts ${relative.text}`}
        </span>
      ) : null}
      {upcoming && relative ? <span aria-hidden="true">•</span> : null}
      <span>{formatDate(appointment.startAt, timezone, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
      <span aria-hidden="true">•</span>
      <span>
        {formatTime(appointment.startAt, timezone)} – {formatTime(appointment.endAt, timezone)}
      </span>
    </span>
  );
}

/** The one or two things to do next, by status, as full pages. */
function ActionsCard({ appointment, apply }: { appointment: Detail; apply: (response: AppointmentDetailResponse) => void }) {
  const { timezone } = useStudio();
  const notify = useToast();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actions = appointment.allowedActions;
  const base = `/studio/appointments/${appointment.id}`;

  const startService = async () => {
    setStarting(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(`/api/v1/business/appointments/${appointment.id}/start`, "POST");
      notify({ tone: "success", title: "Service started" });
      apply(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setStarting(false);
    }
  };

  const noShowPendingAt =
    appointment.status === "CONFIRMED" && !actions.markNoShow && actions.noShowAvailableAt ? actions.noShowAvailableAt : null;
  const anything =
    actions.checkIn ||
    actions.startService ||
    actions.complete ||
    actions.reschedule ||
    actions.cancel ||
    actions.markNoShow ||
    actions.refund;

  if (!anything) {
    const closed: Partial<Record<AppointmentStatus, string>> = {
      COMPLETED: "This appointment is complete.",
      NO_SHOW: "The client didn't arrive. The booking is closed.",
      CANCELLED_BY_CUSTOMER: "The client cancelled this booking.",
      CANCELLED_BY_PROFESSIONAL: "Your business cancelled this booking.",
      DISPUTED: "This booking is under dispute. Our support team will be in touch.",
    };
    return (
      <Card title="Actions">
        <p className="text-sm text-[var(--color-text-muted)]">
          {closed[appointment.status] ?? "Your role can view this appointment but not change it."}
        </p>
      </Card>
    );
  }

  return (
    <Card title="Actions">
      <div className="grid gap-3">
        {actions.checkIn ? (
          <Link href={`${base}/check-in`} className="btn-primary min-h-12 w-full text-base">
            <ClipboardCheck aria-hidden="true" className="size-5" />
            Check in client
          </Link>
        ) : actions.startService ? (
          <Button className="min-h-12 w-full text-base" loading={starting} leadingIcon={<Play aria-hidden="true" className="size-5" />} onClick={() => void startService()}>
            Start service
          </Button>
        ) : actions.complete ? (
          <Link href={`${base}/complete`} className="btn-primary min-h-12 w-full text-base">
            <CircleCheck aria-hidden="true" className="size-5" />
            Complete appointment
          </Link>
        ) : null}

        {actions.reschedule || actions.cancel ? (
          <div className="grid grid-cols-2 gap-2">
            {actions.reschedule ? (
              <Link href={`${base}/reschedule`} className="btn-secondary !border-[var(--color-brand)] !text-[var(--color-brand)]">
                <CalendarClock aria-hidden="true" className="size-4" />
                Reschedule
              </Link>
            ) : (
              <span />
            )}
            {actions.cancel ? (
              <Link href={`${base}/cancel`} className="btn-secondary !text-[var(--color-danger)]">
                <Ban aria-hidden="true" className="size-4" />
                Cancel
              </Link>
            ) : null}
          </div>
        ) : null}

        {actions.startService ? (
          <Link href={`${base}/check-in`} className="text-center text-sm font-medium text-[var(--color-brand)] hover:underline">
            Undo check-in
          </Link>
        ) : null}
        {actions.markNoShow ? (
          <Link href={`${base}/no-show`} className="btn-secondary">
            <UserX aria-hidden="true" className="size-4" />
            Mark as no-show
          </Link>
        ) : null}
        {actions.refund ? (
          <Link href={`${base}/refund`} className="btn-secondary">
            <ReceiptText aria-hidden="true" className="size-4" />
            Refunds
          </Link>
        ) : null}
        <FormError message={error} />
        {noShowPendingAt ? (
          <p className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
            <Clock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            You can mark a no-show from {formatTime(noShowPendingAt, timezone)}, after the {appointment.noShowGraceMinutes}-minute
            grace period.
          </p>
        ) : null}
        {actions.checkIn ? (
          <p className="flex items-start gap-2 rounded-lg bg-[var(--color-info-soft,#e6eff9)] p-3 text-xs text-[var(--color-text-primary)]">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-info,#2f5e9a)]" />
            Checking in records the client&apos;s arrival time and updates the appointment status.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function ClientCard({ appointment, canViewClients }: { appointment: Detail; canViewClients: boolean }) {
  const { client } = appointment;
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar name={client.name} size="xl" />
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-[var(--color-text-primary)]">{client.name}</p>
            {client.preferredName ? (
              <p className="truncate text-sm text-[var(--color-text-muted)]">Prefers “{client.preferredName}”</p>
            ) : null}
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="flex min-h-8 items-center gap-2 text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand)]">
                <Phone aria-hidden="true" className="size-4 text-[var(--color-text-muted)]" />
                {client.phone}
              </a>
            ) : null}
            <a href={`mailto:${client.email}`} className="flex min-h-8 min-w-0 items-center gap-2 text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand)]">
              <Mail aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-muted)]" />
              <span className="truncate">{client.email}</span>
            </a>
          </div>
        </div>
        <div className="grid gap-2 sm:justify-items-end">
          <Link href="/studio/messages" className="btn-secondary !border-[var(--color-brand)] !text-[var(--color-brand)]">
            <MessageCircle aria-hidden="true" className="size-4" />
            Message client
          </Link>
          {canViewClients ? (
            <Link href={`/studio/clients/${client.id}`} className="text-sm font-medium text-[var(--color-brand)] hover:underline">
              View client profile
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Booking reference</p>
          <CopyReference value={appointment.reference} />
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {[
            ["Visits", client.stats.visits],
            ["Completed", client.stats.completed],
            ["No-shows", client.stats.noShows],
            ["Cancelled", client.stats.cancellations],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="text-[var(--color-text-muted)]">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

function ServiceCard({ appointment }: { appointment: Detail }) {
  const { timezone } = useStudio();
  return (
    <Card title="Service" icon={Scissors}>
      <p className="font-display text-xl">{appointment.service.name}</p>
      <p className="text-sm text-[var(--color-text-muted)]">
        {formatMoney(appointment.pricing.servicePriceCents)} • {formatDuration(appointment.durationMins)}
      </p>
      {appointment.service.variations.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {appointment.service.variations.map((variation) => (
            <Pill key={variation.label} tone="neutral">
              {variation.label}
            </Pill>
          ))}
        </div>
      ) : null}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
          <div className="min-w-0">
            <dt className="text-[var(--color-text-muted)]">Location</dt>
            <dd className="truncate">{appointment.location.label}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
          <div className="min-w-0">
            <dt className="text-[var(--color-text-muted)]">Booked</dt>
            <dd>{formatDateTime(appointment.createdAt, timezone)}</dd>
          </div>
        </div>
        {appointment.originalStartAt ? (
          <div className="flex gap-2 sm:col-span-2">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
            <div className="min-w-0">
              <dt className="text-[var(--color-text-muted)]">Originally booked for</dt>
              <dd>
                {formatDateTime(appointment.originalStartAt, timezone)} · rescheduled {appointment.rescheduleCount}×
              </dd>
            </div>
          </div>
        ) : null}
        {appointment.lifecycle.cancellationReason ? (
          <div className="flex gap-2 sm:col-span-2">
            <Ban aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--color-danger)]" />
            <div className="min-w-0">
              <dt className="text-[var(--color-text-muted)]">Cancellation reason</dt>
              <dd>{appointment.lifecycle.cancellationReason}</dd>
            </div>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        {appointment.service.cancellationPolicy.label} policy · {appointment.service.cancellationPolicy.description}
      </p>
    </Card>
  );
}

function ConsultationCard({ appointment }: { appointment: Detail }) {
  const consultation = appointment.consultation!;
  return (
    <Card title="Consultation shared" icon={MessageCircle}>
      {consultation.scalpSensitivity ? (
        <div className="mb-3">
          <Notice tone="warning" icon={TriangleAlert} title="Sensitive scalp">
            {consultation.tenderness}
          </Notice>
        </div>
      ) : null}
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {consultation.recipientType === "CHILD" && consultation.childName ? (
          <div>
            <dt className="text-[var(--color-text-muted)]">Service is for</dt>
            <dd>{consultation.childName} (child)</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[var(--color-text-muted)]">Current length</dt>
          <dd>{HAIR_LENGTH[consultation.currentHairLength] ?? consultation.currentHairLength}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-muted)]">Current style</dt>
          <dd>{consultation.currentStyle}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-muted)]">Reference photos</dt>
          <dd>{consultation.mediaCount}</dd>
        </div>
      </dl>
    </Card>
  );
}

function NotesCard({ appointment, onSaved }: { appointment: Detail; onSaved: (response: AppointmentDetailResponse) => void }) {
  const notify = useToast();
  const saved = appointment.notes.professionalNotes ?? "";
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(`/api/v1/business/appointments/${appointment.id}`, "PATCH", {
        professionalNotes: draft.trim() || null,
      });
      notify({ tone: "success", title: "Notes saved" });
      onSaved(response);
      setEditing(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Notes (private)"
      action={
        appointment.allowedActions.editNotes && !editing ? (
          <button
            type="button"
            onClick={() => {
              setDraft(saved);
              setEditing(true);
            }}
            className="min-h-10 rounded-lg px-2 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            {saved ? "Edit notes" : "Add notes"}
          </button>
        ) : null
      }
    >
      {appointment.notes.completionNotes ? (
        <div className="mb-3 rounded-xl bg-[var(--color-success-soft)] p-3 text-sm">
          <p className="text-xs font-medium text-[var(--color-success)] uppercase">What was done</p>
          <p className="mt-1 text-[var(--color-text-primary)]">{appointment.notes.completionNotes}</p>
        </div>
      ) : null}
      {editing ? (
        <div className="grid gap-2">
          <label htmlFor="staff-notes" className="sr-only">
            Private notes
          </label>
          <textarea
            id="staff-notes"
            rows={4}
            maxLength={1000}
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Private to your team. Clients never see these notes."
            className="min-h-28 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm focus-ring"
          />
          <FormError message={error} />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={draft.trim() === saved.trim()} onClick={() => void save()}>
              Save notes
            </Button>
          </div>
        </div>
      ) : (
        <p className={`text-sm whitespace-pre-line ${saved ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
          {saved || "No notes yet. Clients never see these."}
        </p>
      )}
    </Card>
  );
}

function AssignmentCard({ appointment, onSaved }: { appointment: Detail; onSaved: (response: AppointmentDetailResponse) => void }) {
  const notify = useToast();
  const { data } = useSWR<TeamResponse>("/api/v1/business/team", studioFetcher);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const active = data?.members.filter((member) => member.status === "ACTIVE") ?? [];

  if (data && active.length === 0) {
    return (
      <Card title="Team member">
        <p className="text-sm text-[var(--color-text-muted)]">
          You work solo for now. Invite team members from the Team page to assign appointments.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Team member">
      <SelectField
        label="Assigned to"
        value={appointment.teamMember?.id ?? ""}
        disabled={!data || saving}
        onChange={async (event) => {
          const teamMemberId = event.target.value || null;
          setSaving(true);
          setError(null);
          try {
            const response = await studioRequest<AppointmentDetailResponse>(
              `/api/v1/business/appointments/${appointment.id}`,
              "PATCH",
              { teamMemberId },
            );
            notify({ tone: "success", title: "Assignment updated" });
            onSaved(response);
          } catch (caught) {
            setError(errorMessage(caught));
          } finally {
            setSaving(false);
          }
        }}
      >
        <option value="">Owner (unassigned)</option>
        {active.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName}
            {member.jobTitle ? ` · ${member.jobTitle}` : ""}
          </option>
        ))}
      </SelectField>
      <div className="mt-2">
        <FormError message={error} />
      </div>
    </Card>
  );
}

const CHECK_IN_METHOD: Record<string, string> = {
  QR_CODE: "with a QR code",
  SHORT_CODE: "with the client's code",
  MANUAL: "manually",
};

function describe(entry: TimelineEntry, timezone: string): string | null {
  const detail = entry.detail;
  const asTime = (value: unknown) =>
    typeof value === "string" && !Number.isNaN(Date.parse(value)) ? formatDateTime(value, timezone) : null;
  switch (entry.event) {
    case "APPOINTMENT_RESCHEDULED": {
      const from = asTime(detail.from);
      const to = asTime(detail.to);
      return from && to ? `${from} → ${to}` : null;
    }
    case "APPOINTMENT_STATUS_CHANGED":
      return typeof detail.to === "string" && detail.to in APPOINTMENT_STATUS
        ? `Now ${APPOINTMENT_STATUS[detail.to as AppointmentStatus].label.toLowerCase()}`
        : null;
    case "APPOINTMENT_CHECKED_IN":
      return typeof detail.method === "string" ? `Checked in ${CHECK_IN_METHOD[detail.method] ?? ""}` : null;
    case "APPOINTMENT_REFUND_ISSUED":
      return typeof detail.amountCents === "number" ? formatMoney(detail.amountCents) : null;
    case "APPOINTMENT_COMPLETED":
      return typeof detail.tipCents === "number" && detail.tipCents > 0 ? `Tip ${formatMoney(detail.tipCents)}` : null;
    case "APPOINTMENT_CHANGE_REQUEST_DECIDED":
      return typeof detail.decision === "string" ? (detail.decision === "APPROVE" ? "Approved" : "Declined") : null;
    default:
      return typeof detail.reason === "string" ? detail.reason : null;
  }
}

function HistoryCard({ timeline, timezone }: { timeline: TimelineEntry[]; timezone: string }) {
  return (
    <section id="history" className="scroll-mt-24">
      <Card title="Activity log">
        {timeline.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No changes recorded yet.</p>
        ) : (
          <ol className="grid">
            {timeline.map((entry, index) => {
              const text = describe(entry, timezone);
              return (
                <li key={`${entry.event}-${entry.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < timeline.length - 1 ? (
                    <span aria-hidden="true" className="absolute top-3 bottom-0 left-[5px] w-px bg-[var(--color-border)]" />
                  ) : null}
                  <span aria-hidden="true" className="relative mt-1.5 size-3 shrink-0 rounded-full border-2 border-[var(--color-brand)] bg-[var(--color-surface)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{entry.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDateTime(entry.at, timezone)}
                      {entry.actor ? ` · ${entry.actor}` : ""}
                    </p>
                    {text ? <p className="mt-0.5 text-sm break-words text-[var(--color-text-primary)]">{text}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </section>
  );
}
