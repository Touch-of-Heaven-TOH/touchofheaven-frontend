"use client";

import {
  Ban,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  Mail,
  MessageSquareWarning,
  Phone,
  Play,
  Receipt,
  TriangleAlert,
  Undo2,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  CancelDialog,
  CheckInDialog,
  CompleteDialog,
  DecideRequestDialog,
  NoShowDialog,
  RefundDialog,
  RescheduleDialog,
  UndoCheckInDialog,
} from "@/features/studio/components/appointments/AppointmentActions";
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
  BALANCE_METHOD_LABEL,
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/features/studio/lib/format";
import type {
  AppointmentDetail as Detail,
  AppointmentDetailResponse,
  AppointmentStatus,
  ChangeRequest,
  TeamResponse,
  TimelineEntry,
} from "@/features/studio/lib/types";

type OpenDialog =
  | { kind: "checkIn" | "undoCheckIn" | "complete" | "noShow" | "reschedule" | "cancel" | "refund" }
  | { kind: "decide"; request: ChangeRequest; decision: "APPROVE" | "DECLINE" };

const HAIR_LENGTH: Record<string, string> = {
  VERY_SHORT: "Very short",
  SHORT: "Short",
  MEDIUM: "Medium",
  LONG: "Long",
  VERY_LONG: "Very long",
};

const REFUND_TONE = {
  REQUESTED: "warning",
  PROCESSING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
} as const;

export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const studio = useStudio();
  const { mutate: globalMutate } = useSWRConfig();
  const key = `/api/v1/business/appointments/${appointmentId}`;
  const { data, error, isLoading, mutate } = useSWR<AppointmentDetailResponse>(key, studioFetcher);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [startPending, setStartPending] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const notify = useToast();

  const apply = (response: AppointmentDetailResponse) => {
    void mutate({ appointment: response.appointment }, { revalidate: false });
    void globalMutate(
      (cacheKey) =>
        typeof cacheKey === "string" &&
        cacheKey !== key &&
        (cacheKey.startsWith("/api/v1/business/appointments") ||
          cacheKey.startsWith("/api/v1/business/overview") ||
          cacheKey.startsWith("/api/v1/business/calendar")),
    );
  };

  if (isLoading && !data) {
    return (
      <div className="grid *:min-w-0 gap-5">
        <PageHeader title="Appointment" backHref="/studio/appointments" backLabel="Appointments" />
        <SkeletonRows label="Loading appointment" rows={3} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid *:min-w-0 gap-5">
        <PageHeader title="Appointment" backHref="/studio/appointments" backLabel="Appointments" />
        {errorCode(error) === "APPOINTMENT_NOT_FOUND" ? (
          <ErrorState
            title="Appointment not found"
            description="It may belong to another business, or it is not assigned to you."
          />
        ) : (
          <ErrorState description={errorMessage(error)} onRetry={() => void mutate()} />
        )}
      </div>
    );
  }

  if (!data) return null;
  const appointment = data.appointment;
  const actions = appointment.allowedActions;
  const tz = studio.timezone;
  const pendingRequest = appointment.changeRequests.find((request) => request.status === "PENDING");

  const startService = async () => {
    setStartPending(true);
    setStartError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(`${key}/start`, "POST");
      notify({ tone: "success", title: "Service started" });
      apply(response);
    } catch (caught) {
      setStartError(errorMessage(caught));
    } finally {
      setStartPending(false);
    }
  };

  const noShowPendingAt =
    appointment.status === "CONFIRMED" && !actions.markNoShow && actions.noShowAvailableAt
      ? actions.noShowAvailableAt
      : null;
  const hasAnyAction =
    actions.checkIn ||
    actions.startService ||
    actions.complete ||
    actions.reschedule ||
    actions.markNoShow ||
    actions.undoCheckIn ||
    actions.cancel ||
    actions.refund;

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        backHref="/studio/appointments"
        backLabel="Appointments"
        title={appointment.service.name}
        description={
          <>
            {formatDate(appointment.startAt, tz, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
            {formatTime(appointment.startAt, tz)} – {formatTime(appointment.endAt, tz)} ·{" "}
            {formatDuration(appointment.durationMins)}
          </>
        }
        actions={<StatusPill status={appointment.status} />}
      />

      {pendingRequest ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 sm:flex-row sm:items-center">
          <MessageSquareWarning aria-hidden="true" className="size-6 shrink-0 text-[var(--color-warning)]" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--color-text-primary)]">
              {pendingRequest.type === "RESCHEDULE"
                ? `Client asks to move this to ${
                    pendingRequest.requestedStartAt ? formatDateTime(pendingRequest.requestedStartAt, tz) : "another time"
                  }`
                : "Client asks to cancel this appointment"}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">“{pendingRequest.reason}”</p>
          </div>
          {actions.decideChangeRequests ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setDialog({ kind: "decide", request: pendingRequest, decision: "DECLINE" })}
              >
                Decline
              </Button>
              <Button onClick={() => setDialog({ kind: "decide", request: pendingRequest, decision: "APPROVE" })}>
                Approve
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasAnyAction || noShowPendingAt ? (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            {actions.checkIn ? (
              <Button leadingIcon={<ClipboardCheck aria-hidden="true" className="size-4" />} onClick={() => setDialog({ kind: "checkIn" })}>
                Check in
              </Button>
            ) : null}
            {actions.startService ? (
              <Button
                leadingIcon={<Play aria-hidden="true" className="size-4" />}
                loading={startPending}
                onClick={() => void startService()}
              >
                Start service
              </Button>
            ) : null}
            {actions.complete ? (
              <Button leadingIcon={<CheckCheck aria-hidden="true" className="size-4" />} onClick={() => setDialog({ kind: "complete" })}>
                Complete &amp; collect
              </Button>
            ) : null}
            {actions.reschedule ? (
              <Button
                variant="secondary"
                leadingIcon={<CalendarClock aria-hidden="true" className="size-4" />}
                onClick={() => setDialog({ kind: "reschedule" })}
              >
                Reschedule
              </Button>
            ) : null}
            {actions.undoCheckIn ? (
              <Button
                variant="secondary"
                leadingIcon={<Undo2 aria-hidden="true" className="size-4" />}
                onClick={() => setDialog({ kind: "undoCheckIn" })}
              >
                Undo check-in
              </Button>
            ) : null}
            {actions.markNoShow ? (
              <Button
                variant="secondary"
                leadingIcon={<UserX aria-hidden="true" className="size-4" />}
                onClick={() => setDialog({ kind: "noShow" })}
              >
                Mark no-show
              </Button>
            ) : null}
            {actions.refund ? (
              <Button
                variant="secondary"
                leadingIcon={<Receipt aria-hidden="true" className="size-4" />}
                onClick={() => setDialog({ kind: "refund" })}
              >
                Issue refund
              </Button>
            ) : null}
            {actions.cancel ? (
              <Button
                variant="ghost"
                className="!text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)]"
                leadingIcon={<Ban aria-hidden="true" className="size-4" />}
                onClick={() => setDialog({ kind: "cancel" })}
              >
                Cancel appointment
              </Button>
            ) : null}
          </div>
          {noShowPendingAt ? (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              You can mark a no-show from {formatTime(noShowPendingAt, tz)}, after the grace period.
            </p>
          ) : null}
          <div className="mt-2 empty:hidden">
            <FormError message={startError} />
          </div>
        </Card>
      ) : null}

      <div className="grid *:min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid *:min-w-0 content-start gap-4">
          <ClientCard appointment={appointment} canViewClients={studio.can("clients")} />
          {appointment.consultation ? <ConsultationCard appointment={appointment} /> : null}
          <NotesCard appointment={appointment} onSaved={apply} />
          <TimelineCard timeline={appointment.timeline} timezone={tz} />
        </div>
        <div className="grid *:min-w-0 content-start gap-4">
          <PaymentCard appointment={appointment} />
          {appointment.refunds.length > 0 ? (
            <Card title="Refunds">
              <ul className="grid *:min-w-0 gap-3">
                {appointment.refunds.map((refund) => (
                  <li key={refund.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-text-primary)]">{formatMoney(refund.amountCents)}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(refund.createdAt, tz)}
                        {refund.failureMessage ? ` · ${refund.failureMessage}` : ""}
                      </p>
                    </div>
                    <Pill tone={REFUND_TONE[refund.status]}>
                      {refund.status === "SUCCEEDED"
                        ? "Refunded"
                        : refund.status === "FAILED"
                          ? "Failed"
                          : refund.status === "CANCELLED"
                            ? "Cancelled"
                            : "Processing"}
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {actions.assign && studio.can("team") ? (
            <AssignmentCard appointment={appointment} onSaved={apply} />
          ) : appointment.teamMember ? (
            <Card title="Team member">
              <p className="text-sm font-semibold">{appointment.teamMember.name}</p>
            </Card>
          ) : null}
          <Card title="Details">
            <dl className="grid *:min-w-0 gap-2 text-sm">
              <Row label="Location" value={appointment.location.label} />
              <Row label="Cancellation policy" value={appointment.service.cancellationPolicy.label} />
              <Row label="Booked" value={formatDateTime(appointment.createdAt, tz)} />
              {appointment.originalStartAt ? (
                <Row label="Originally booked for" value={formatDateTime(appointment.originalStartAt, tz)} />
              ) : null}
              {appointment.lifecycle.cancellationReason ? (
                <Row label="Cancellation reason" value={appointment.lifecycle.cancellationReason} />
              ) : null}
            </dl>
          </Card>
          {appointment.review ? (
            <Card title="Client review">
              <p className="text-sm font-semibold text-[var(--color-gold)]" aria-label={`${appointment.review.rating} out of 5 stars`}>
                {"★".repeat(appointment.review.rating)}
                <span className="text-[var(--color-border)]">{"★".repeat(5 - appointment.review.rating)}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">{appointment.review.reviewBody}</p>
            </Card>
          ) : null}
        </div>
      </div>

      {dialog?.kind === "checkIn" ? <CheckInDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "undoCheckIn" ? <UndoCheckInDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "complete" ? <CompleteDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "noShow" ? <NoShowDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "reschedule" ? <RescheduleDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "cancel" ? <CancelDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "refund" ? <RefundDialog appointment={appointment} onClose={() => setDialog(null)} onDone={apply} /> : null}
      {dialog?.kind === "decide" ? (
        <DecideRequestDialog
          appointment={appointment}
          request={dialog.request}
          decision={dialog.decision}
          onClose={() => setDialog(null)}
          onDone={apply}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 text-right font-semibold break-words text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}

function ClientCard({ appointment, canViewClients }: { appointment: Detail; canViewClients: boolean }) {
  const { client } = appointment;
  return (
    <Card
      title="Client"
      action={
        canViewClients ? (
          <Link
            href={`/studio/clients/${client.id}`}
            className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
          >
            View profile
          </Link>
        ) : null
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={client.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-[var(--color-text-primary)]">{client.name}</p>
          {client.preferredName ? (
            <p className="truncate text-sm text-[var(--color-text-muted)]">Prefers “{client.preferredName}”</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {client.phone ? (
          <a href={`tel:${client.phone}`} className="btn-secondary !min-h-10">
            <Phone aria-hidden="true" className="size-4" />
            Call
          </a>
        ) : null}
        <a href={`mailto:${client.email}`} className="btn-secondary !min-h-10 min-w-0">
          <Mail aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">Email</span>
        </a>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Visits", client.stats.visits],
          ["Completed", client.stats.completed],
          ["No-shows", client.stats.noShows],
          ["Cancelled", client.stats.cancellations],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--color-surface-strong)] p-3">
            <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
            <dd className="text-lg font-semibold text-[var(--color-text-primary)]">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ConsultationCard({ appointment }: { appointment: Detail }) {
  const consultation = appointment.consultation!;
  return (
    <Card title="Consultation">
      {consultation.scalpSensitivity ? (
        <div className="mb-3 flex gap-3 rounded-xl border border-[var(--color-copper)]/30 bg-[var(--color-copper-soft)] p-3">
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-[var(--color-copper)]" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">Sensitive scalp</p>
            {consultation.tenderness ? (
              <p className="text-[var(--color-text-primary)]">{consultation.tenderness}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <dl className="grid *:min-w-0 gap-2 text-sm">
        {consultation.recipientType === "CHILD" && consultation.childName ? (
          <Row label="Service is for" value={`${consultation.childName} (child)`} />
        ) : null}
        <Row label="Current length" value={HAIR_LENGTH[consultation.currentHairLength] ?? consultation.currentHairLength} />
        <Row label="Current style" value={consultation.currentStyle} />
        <Row label="Reference photos" value={String(consultation.mediaCount)} />
      </dl>
    </Card>
  );
}

function PaymentCard({ appointment }: { appointment: Detail }) {
  const { pricing } = appointment;
  return (
    <Card title="Payment">
      <dl className="grid *:min-w-0 gap-2 text-sm">
        <Row label="Service" value={formatMoney(pricing.servicePriceCents)} />
        {appointment.service.variations.map((variation) => (
          <div key={variation.label} className="flex justify-between gap-4 pl-3 text-xs text-[var(--color-text-muted)]">
            <dt className="min-w-0 truncate">{variation.label}</dt>
            <dd className="shrink-0">
              {variation.priceDeltaCents >= 0 ? "+" : "−"}
              {formatMoney(Math.abs(variation.priceDeltaCents))}
            </dd>
          </div>
        ))}
        <Row label="Deposit paid" value={formatMoney(pricing.depositPaidCents)} />
        {pricing.balanceCollectedCents > 0 ? (
          <Row
            label={`Collected in person${
              pricing.balanceCollectionMethod ? ` (${BALANCE_METHOD_LABEL[pricing.balanceCollectionMethod]})` : ""
            }`}
            value={formatMoney(pricing.balanceCollectedCents)}
          />
        ) : null}
        {pricing.tipCents > 0 ? <Row label="Tip" value={formatMoney(pricing.tipCents)} /> : null}
        {pricing.refundedCents > 0 ? <Row label="Refunded" value={`−${formatMoney(pricing.refundedCents)}`} /> : null}
        {pricing.pendingRefundCents > 0 ? (
          <Row label="Refund processing" value={`−${formatMoney(pricing.pendingRefundCents)}`} />
        ) : null}
        <div className="my-1 border-t border-[var(--color-border)]" />
        <Row label="Balance due" value={formatMoney(pricing.balanceDueCents)} />
        <Row label="Total collected" value={formatMoney(pricing.netCollectedCents)} />
      </dl>
    </Card>
  );
}

function NotesCard({ appointment, onSaved }: { appointment: Detail; onSaved: (response: AppointmentDetailResponse) => void }) {
  const notify = useToast();
  const saved = appointment.notes.professionalNotes ?? "";
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = draft.trim() !== saved.trim();

  return (
    <Card title="Staff notes">
      {appointment.notes.completionNotes ? (
        <div className="mb-3 rounded-xl bg-[var(--color-sage-soft)] p-3 text-sm">
          <p className="text-xs font-semibold text-[var(--color-sage)] uppercase">What was done</p>
          <p className="mt-1 text-[var(--color-text-primary)]">{appointment.notes.completionNotes}</p>
        </div>
      ) : null}
      {appointment.allowedActions.editNotes ? (
        <div className="grid *:min-w-0 gap-2">
          <label htmlFor="staff-notes" className="sr-only">
            Staff notes
          </label>
          <textarea
            id="staff-notes"
            rows={3}
            maxLength={1000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Private to your team. Clients never see these notes."
            className="min-h-24 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm focus-ring"
          />
          <FormError message={error} />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {dirty ? (
              <Button variant="ghost" onClick={() => setDraft(saved)}>
                Discard
              </Button>
            ) : null}
            <Button
              variant="secondary"
              disabled={!dirty}
              loading={saving}
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  const response = await studioRequest<AppointmentDetailResponse>(
                    `/api/v1/business/appointments/${appointment.id}`,
                    "PATCH",
                    { professionalNotes: draft.trim() || null },
                  );
                  notify({ tone: "success", title: "Notes saved" });
                  onSaved(response);
                } catch (caught) {
                  setError(errorMessage(caught));
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save notes
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-primary)]">{saved || "No notes yet."}</p>
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
  QR_CODE: "QR code",
  SHORT_CODE: "client's code",
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
      return typeof detail.tipCents === "number" && detail.tipCents > 0
        ? `Tip ${formatMoney(detail.tipCents)}`
        : null;
    default:
      return typeof detail.reason === "string" ? detail.reason : null;
  }
}

function TimelineCard({ timeline, timezone }: { timeline: TimelineEntry[]; timezone: string }) {
  return (
    <Card title="History">
      <ol className="grid *:min-w-0 gap-0">
        {timeline.map((entry, index) => {
          const text = describe(entry, timezone);
          return (
            <li key={`${entry.event}-${entry.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
              {index < timeline.length - 1 ? (
                <span aria-hidden="true" className="absolute top-3 bottom-0 left-[5px] w-px bg-[var(--color-border)]" />
              ) : null}
              <span aria-hidden="true" className="relative mt-1.5 size-3 shrink-0 rounded-full border-2 border-[var(--color-brand)] bg-[var(--color-surface)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{entry.label}</p>
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
    </Card>
  );
}
