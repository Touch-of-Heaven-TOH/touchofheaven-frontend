"use client";

import {
  CircleCheck,
  CircleCheckBig,
  Hash,
  Play,
  QrCode,
  ScanLine,
  Undo2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { UndoCheckInDialog } from "@/features/studio/components/appointments/AppointmentActions";
import {
  ActionBar,
  AppointmentFlowFrame,
  ChoiceTile,
  ClientBookingCard,
  Notice,
  StepTimeline,
  lifecycleSteps,
  relativeToNow,
} from "@/features/studio/components/appointments/flow/FlowParts";
import { Card, FormError, Pill, StatusPill } from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorCode, errorMessage, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { formatTime } from "@/features/studio/lib/format";
import { useNow } from "@/features/studio/lib/hooks";
import type { AppointmentDetail, AppointmentDetailResponse } from "@/features/studio/lib/types";

type Method = "QR_CODE" | "SHORT_CODE" | "MANUAL";

const METHOD_LABEL: Record<Method, string> = {
  QR_CODE: "QR code",
  SHORT_CODE: "6-digit code",
  MANUAL: "Manual check-in",
};

export function CheckInFlow({ appointmentId }: { appointmentId: string }) {
  return (
    <AppointmentFlowFrame
      appointmentId={appointmentId}
      title="Check in client"
      badge={(appointment) => <StatusPill status={appointment.status} />}
    >
      {(appointment, apply) => <CheckInBody appointment={appointment} apply={apply} />}
    </AppointmentFlowFrame>
  );
}

function CheckInBody({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const { timezone } = useStudio();
  const now = useNow(30_000);
  const actions = appointment.allowedActions;
  const arrived = appointment.status === "ARRIVED" || appointment.status === "IN_PROGRESS";

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <div className="grid gap-5 *:min-w-0">
        <ClientBookingCard
          appointment={appointment}
          aside={
            now && appointment.status === "CONFIRMED" ? (
              <Pill tone={new Date(appointment.startAt).getTime() < now ? "warning" : "info"}>
                Starts {relativeToNow(appointment.startAt, now).text}
              </Pill>
            ) : null
          }
        />
        {actions.checkIn ? (
          <MethodPicker appointment={appointment} apply={apply} />
        ) : arrived ? (
          <CheckedInCard appointment={appointment} />
        ) : (
          <Card>
            <Notice tone="warning" title="This appointment can't be checked in">
              {appointment.status === "PENDING_PAYMENT"
                ? "The client hasn't paid the deposit yet, so the booking isn't confirmed."
                : appointment.status === "COMPLETED"
                  ? "It has already been completed."
                  : appointment.status === "NO_SHOW"
                    ? "It was marked as a no-show."
                    : appointment.status === "CONFIRMED"
                      ? "Your role can view this appointment but not change it."
                      : "It has been cancelled."}
            </Notice>
            <div className="mt-4">
              <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
                Back to appointment
              </Link>
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-5 *:min-w-0">
        <Card title="Appointment status">
          <StepTimeline steps={lifecycleSteps(appointment, timezone)} />
        </Card>
        {arrived ? <WhatsNext appointment={appointment} apply={apply} /> : null}
      </div>
    </div>
  );
}

function MethodPicker({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const notify = useToast();
  const [method, setMethod] = useState<Method>("SHORT_CODE");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (method === "SHORT_CODE" && !/^\d{6}$/.test(code)) {
      setError("Enter the 6 digits from the client's confirmation email.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/appointments/${appointment.id}/check-in`,
        "POST",
        { method, ...(method === "SHORT_CODE" ? { code } : {}) },
      );
      notify({ tone: "success", title: `${appointment.client.name} is checked in` });
      apply(response);
    } catch (caught) {
      setError(
        errorCode(caught) === "INVALID_CHECK_IN_CODE"
          ? "That code doesn't match this booking. Check the digits, or check the client in manually."
          : errorMessage(caught),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Card title="Choose check-in method">
      <div role="radiogroup" aria-label="Check-in method" className="grid grid-cols-3 gap-2 sm:gap-3">
        <ChoiceTile
          name="check-in-method"
          icon={QrCode}
          title="Scan QR"
          description="Scan the client's booking pass"
          disabled
          disabledReason="Coming soon"
          selected={false}
          onSelect={() => undefined}
        />
        <ChoiceTile
          name="check-in-method"
          icon={Hash}
          title="6-digit code"
          description="From their confirmation email"
          selected={method === "SHORT_CODE"}
          onSelect={() => setMethod("SHORT_CODE")}
        />
        <ChoiceTile
          name="check-in-method"
          icon={UserCheck}
          title="Manual"
          description="Recorded under your name"
          selected={method === "MANUAL"}
          onSelect={() => setMethod("MANUAL")}
        />
      </div>

      <div className="mt-5 grid gap-4">
        {method === "SHORT_CODE" ? (
          <div className="grid gap-2">
            <label htmlFor="check-in-code" className="text-sm font-medium text-[var(--color-text-primary)]">
              Client&apos;s check-in code
            </label>
            <input
              id="check-in-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
              placeholder="000000"
              aria-describedby="check-in-code-hint"
              className="min-h-14 w-full max-w-xs rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-center font-mono text-2xl tracking-[0.5em] focus-ring"
            />
            <p id="check-in-code-hint" className="text-xs text-[var(--color-text-muted)]">
              A matching code is the strongest proof of arrival if a no-show is ever disputed.
            </p>
          </div>
        ) : (
          <Notice icon={ScanLine} title="Manual check-in">
            Use this when the client can&apos;t find their code. It&apos;s recorded as checked in by you.
          </Notice>
        )}
        <FormError message={error} />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
        <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
          Cancel
        </Link>
        <Button
          loading={pending}
          leadingIcon={<CircleCheck aria-hidden="true" className="size-4" />}
          onClick={() => void submit()}
        >
          Check in with {METHOD_LABEL[method].toLowerCase()}
        </Button>
      </div>
    </Card>
  );
}

function CheckedInCard({ appointment }: { appointment: AppointmentDetail }) {
  const { timezone } = useStudio();
  const checkInAt = appointment.lifecycle.checkInAt;
  return (
    <section className="rounded-[var(--radius-panel)] border-2 border-[var(--color-success)]/50 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
          <CircleCheckBig strokeWidth={1.8} className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl text-[var(--color-text-primary)]">
            {appointment.status === "IN_PROGRESS" ? "Service in progress" : "Client checked in successfully"}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {checkInAt ? `Checked in at ${formatTime(checkInAt, timezone)}` : "Checked in"}
            {appointment.lifecycle.checkInMethod
              ? ` · ${METHOD_LABEL[appointment.lifecycle.checkInMethod]}`
              : ""}
            {appointment.lifecycle.serviceStartedAt
              ? ` · Service started ${formatTime(appointment.lifecycle.serviceStartedAt, timezone)}`
              : ""}
          </p>
        </div>
        <Pill tone={appointment.status === "IN_PROGRESS" ? "info" : "success"}>
          {appointment.status === "IN_PROGRESS" ? "In service" : "Checked in"}
        </Pill>
      </div>
    </section>
  );
}

function WhatsNext({
  appointment,
  apply,
}: {
  appointment: AppointmentDetail;
  apply: (response: AppointmentDetailResponse) => void;
}) {
  const router = useRouter();
  const notify = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const actions = appointment.allowedActions;

  const start = async () => {
    setPending(true);
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
      setPending(false);
    }
  };

  return (
    <>
      <Card title="What's next?">
        <div className="grid gap-3">
          {actions.startService ? (
            <Button
              className="w-full"
              loading={pending}
              leadingIcon={<Play aria-hidden="true" className="size-4" />}
              onClick={() => void start()}
            >
              Start service
            </Button>
          ) : null}
          {actions.complete ? (
            <Button
              className="w-full"
              leadingIcon={<CircleCheck aria-hidden="true" className="size-4" />}
              onClick={() => router.push(`/studio/appointments/${appointment.id}/complete`)}
            >
              Complete appointment
            </Button>
          ) : null}
          {actions.undoCheckIn ? (
            <Button
              variant="outline"
              className="w-full"
              leadingIcon={<Undo2 aria-hidden="true" className="size-4" />}
              onClick={() => setUndoing(true)}
            >
              Undo check-in
            </Button>
          ) : null}
          <FormError message={error} />
          {actions.undoCheckIn ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Undo needs a reason, which is kept in the appointment history.
            </p>
          ) : null}
        </div>
      </Card>
      {!actions.startService && !actions.complete && !actions.undoCheckIn ? (
        <ActionBar>
          <Link href={`/studio/appointments/${appointment.id}`} className="btn-secondary">
            Back to appointment
          </Link>
        </ActionBar>
      ) : null}
      {undoing ? (
        <UndoCheckInDialog appointment={appointment} onClose={() => setUndoing(false)} onDone={apply} />
      ) : null}
    </>
  );
}
