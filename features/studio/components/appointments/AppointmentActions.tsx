"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  FormError,
  SelectField,
  TextAreaField,
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
  BALANCE_METHOD_LABEL,
  dateKeyIn,
  formatDateTime,
  formatMoney,
  formatTime,
  parseMoneyToCents,
  zonedTimeToUtc,
} from "@/features/studio/lib/format";
import type {
  AppointmentDetail,
  AppointmentDetailResponse,
  BalanceCollectionMethod,
  CancellationQuoteResponse,
  ChangeRequest,
} from "@/features/studio/lib/types";

type ApplyResult = (response: AppointmentDetailResponse) => void;

type DialogProps = {
  appointment: AppointmentDetail;
  onClose: () => void;
  onDone: ApplyResult;
};

function usePendingAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };
  return { pending, error, setError, run };
}

function base(appointment: AppointmentDetail) {
  return `/api/v1/business/appointments/${appointment.id}`;
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
        checked
          ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
          : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-1 size-4 accent-[var(--color-brand)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
        {description ? (
          <span className="block text-xs text-[var(--color-text-muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function CheckInDialog({ appointment, onClose, onDone }: DialogProps) {
  const notify = useToast();
  const [method, setMethod] = useState<"SHORT_CODE" | "MANUAL">("SHORT_CODE");
  const [code, setCode] = useState("");
  const { pending, error, setError, run } = usePendingAction();

  const submit = () =>
    run(async () => {
      if (method === "SHORT_CODE" && !/^\d{6}$/.test(code.trim())) {
        setError("Enter the 6-digit code from the client's booking.");
        return;
      }
      const response = await studioRequest<AppointmentDetailResponse>(`${base(appointment)}/check-in`, "POST", {
        method,
        ...(method === "SHORT_CODE" ? { code: code.trim() } : {}),
      });
      notify({ tone: "success", title: `${appointment.client.name} is checked in` });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Check in client"
      description={`${appointment.client.name} · ${appointment.service.name}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={() => void submit()}>
            Check in
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-3">
        <RadioCard
          name="check-in-method"
          value="SHORT_CODE"
          checked={method === "SHORT_CODE"}
          onChange={() => setMethod("SHORT_CODE")}
          title="Client shows their code"
          description="The strongest proof of arrival if a no-show is ever disputed."
        />
        <RadioCard
          name="check-in-method"
          value="MANUAL"
          checked={method === "MANUAL"}
          onChange={() => setMethod("MANUAL")}
          title="Check in manually"
          description="Recorded as a manual check-in by you."
        />
        {method === "SHORT_CODE" ? (
          <Input
            label="Check-in code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center text-lg tracking-[0.4em]"
          />
        ) : null}
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

export function UndoCheckInDialog({ appointment, onClose, onDone }: DialogProps) {
  const notify = useToast();
  const [reason, setReason] = useState("");
  const { pending, error, setError, run } = usePendingAction();

  const submit = () =>
    run(async () => {
      if (reason.trim().length < 3) {
        setError("Say briefly why the check-in is being undone.");
        return;
      }
      const response = await studioRequest<AppointmentDetailResponse>(`${base(appointment)}/check-in`, "DELETE", {
        reason: reason.trim(),
      });
      notify({ tone: "success", title: "Check-in undone" });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Undo check-in"
      description="The appointment goes back to confirmed. The reason is kept in the appointment history."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep checked in
          </Button>
          <Button variant="danger" loading={pending} onClick={() => void submit()}>
            Undo check-in
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-3">
        <TextAreaField
          label="Reason"
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Checked in the wrong client"
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

const TIP_PRESETS = [0, 10, 15, 20] as const;

export function CompleteDialog({ appointment, onClose, onDone }: DialogProps) {
  const notify = useToast();
  const due = appointment.pricing.balanceDueCents;
  const [collected, setCollected] = useState((due / 100).toFixed(2));
  const [method, setMethod] = useState<BalanceCollectionMethod>("CASH");
  const [tipMode, setTipMode] = useState<string>("0");
  const [customTip, setCustomTip] = useState("");
  const [notes, setNotes] = useState("");
  const { pending, error, setError, run } = usePendingAction();

  const collectedCents = parseMoneyToCents(collected || "0");
  const tipCents =
    tipMode === "custom"
      ? parseMoneyToCents(customTip || "0")
      : Math.round((appointment.pricing.servicePriceCents * Number(tipMode)) / 100);

  const submit = () =>
    run(async () => {
      if (collectedCents === null || tipCents === null) {
        setError("Enter amounts as numbers, for example 45 or 45.50.");
        return;
      }
      if (collectedCents > due) {
        setError(`The balance due is ${formatMoney(due)}. Record anything extra as a tip.`);
        return;
      }
      const response = await studioRequest<AppointmentDetailResponse>(`${base(appointment)}/complete`, "POST", {
        tipCents,
        ...(due > 0 || collectedCents > 0
          ? { balanceCollection: { method, amountCents: collectedCents } }
          : {}),
        ...(notes.trim() ? { completionNotes: notes.trim() } : {}),
      });
      notify({
        tone: "success",
        title: "Appointment completed",
        description: `${formatMoney(collectedCents + tipCents)} collected today.`,
      });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Complete appointment"
      description={`${appointment.client.name} · ${appointment.service.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={() => void submit()}>
            Complete {collectedCents !== null && tipCents !== null ? `· ${formatMoney(collectedCents + tipCents)}` : ""}
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-4">
        <dl className="grid *:min-w-0 grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-strong)] p-3 text-sm">
          <dt className="text-[var(--color-text-muted)]">Service price</dt>
          <dd className="text-right font-semibold">{formatMoney(appointment.pricing.servicePriceCents)}</dd>
          <dt className="text-[var(--color-text-muted)]">Deposit already paid</dt>
          <dd className="text-right font-semibold">−{formatMoney(appointment.pricing.depositPaidCents)}</dd>
          <dt className="font-semibold text-[var(--color-text-primary)]">Balance due</dt>
          <dd className="text-right font-bold text-[var(--color-text-primary)]">{formatMoney(due)}</dd>
        </dl>

        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <Input
            label="Collected now"
            inputMode="decimal"
            value={collected}
            onChange={(event) => setCollected(event.target.value)}
            helperText="Paid in person, outside the app."
          />
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

        <fieldset className="grid *:min-w-0 gap-2">
          <legend className="text-sm font-semibold text-[var(--color-text-primary)]">Tip</legend>
          <div className="flex flex-wrap gap-2">
            {TIP_PRESETS.map((percent) => (
              <button
                key={percent}
                type="button"
                aria-pressed={tipMode === String(percent)}
                onClick={() => setTipMode(String(percent))}
                className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${
                  tipMode === String(percent)
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                    : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                }`}
              >
                {percent === 0 ? "No tip" : `${percent}%`}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={tipMode === "custom"}
              onClick={() => setTipMode("custom")}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${
                tipMode === "custom"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
              }`}
            >
              Custom
            </button>
          </div>
          {tipMode === "custom" ? (
            <Input
              label="Tip amount"
              inputMode="decimal"
              value={customTip}
              onChange={(event) => setCustomTip(event.target.value)}
              placeholder="0.00"
            />
          ) : tipCents ? (
            <p className="text-sm text-[var(--color-text-muted)]">Tip: {formatMoney(tipCents)}</p>
          ) : null}
        </fieldset>

        <TextAreaField
          label="What was done (optional)"
          value={notes}
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Knotless, waist length, 1B with honey blonde peekaboo"
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

export function NoShowDialog({ appointment, onClose, onDone }: DialogProps) {
  const notify = useToast();
  const [note, setNote] = useState("");
  const { pending, error, run } = usePendingAction();

  const submit = () =>
    run(async () => {
      const response = await studioRequest<AppointmentDetailResponse>(`${base(appointment)}/no-show`, "POST", {
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      notify({ tone: "success", title: "Marked as no-show" });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Mark as no-show"
      description={`The ${formatMoney(appointment.pricing.depositPaidCents)} deposit is kept, as your cancellation policy allows.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Go back
          </Button>
          <Button variant="danger" loading={pending} onClick={() => void submit()}>
            Mark no-show
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-3">
        <TextAreaField
          label="Note (optional)"
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Called twice, no answer"
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

export function RescheduleDialog({ appointment, onClose, onDone }: DialogProps) {
  const { timezone } = useStudio();
  const notify = useToast();
  const [date, setDate] = useState(() => dateKeyIn(new Date(appointment.startAt), timezone));
  const [time, setTime] = useState(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    return formatter.format(new Date(appointment.startAt));
  });
  const [reason, setReason] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);
  const { pending, error, setError, run } = usePendingAction();

  const submit = () =>
    run(async () => {
      if (!date || !time) {
        setError("Choose the new date and time.");
        return;
      }
      const startAt = zonedTimeToUtc(date, time, timezone);
      const response = await studioRequest<AppointmentDetailResponse>(`${base(appointment)}/reschedule`, "POST", {
        startAt: startAt.toISOString(),
        notifyClient,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      notify({
        tone: "success",
        title: "Appointment moved",
        description: `Now ${formatDateTime(startAt, timezone)}.`,
      });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Reschedule"
      description={`Currently ${formatDateTime(appointment.startAt, timezone)} · ${appointment.durationMins} min. Times in ${timezone}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={() => void submit()}>
            Move appointment
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-4">
        <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
          <Input label="New date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Input label="New time" type="time" step={900} value={time} onChange={(event) => setTime(event.target.value)} />
        </div>
        <TextAreaField
          label="Reason (optional)"
          hint={notifyClient ? "Included in the email to the client." : undefined}
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
        />
        <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={notifyClient}
            onChange={(event) => setNotifyClient(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Email the client about the new time
        </label>
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

export function CancelDialog({ appointment, onClose, onDone }: DialogProps) {
  const notify = useToast();
  const { data: quote, error: quoteError } = useSWR<CancellationQuoteResponse>(
    `${base(appointment)}/cancel`,
    studioFetcher,
  );
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [mode, setMode] = useState<"FULL" | "CUSTOM" | "NONE">("FULL");
  const [custom, setCustom] = useState("");
  const [reason, setReason] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);
  const { pending, error, setError, run } = usePendingAction();

  const refundable = quote?.business.maxRefundableCents ?? 0;
  const refundCents =
    mode === "FULL" ? refundable : mode === "NONE" ? 0 : parseMoneyToCents(custom || "0");

  const submit = () =>
    run(async () => {
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
      const response = await studioRequest<AppointmentDetailResponse & { refund: { amountCents: number } | null }>(
        `${base(appointment)}/cancel`,
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
        description: response.refund
          ? `${formatMoney(response.refund.amountCents)} is being refunded.`
          : "No refund was issued.",
      });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Cancel appointment"
      description={`${appointment.client.name} · ${appointment.service.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep appointment
          </Button>
          <Button variant="danger" loading={pending} disabled={!quote} onClick={() => void submit()}>
            Cancel appointment
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-4">
        {quoteError ? (
          <FormError message={errorMessage(quoteError)} />
        ) : !quote ? (
          <div role="status" className="h-20 animate-pulse rounded-xl bg-[var(--color-skeleton)]">
            <span className="sr-only">Calculating refund</span>
          </div>
        ) : (
          <>
            <p className="rounded-xl bg-[var(--color-surface-strong)] p-3 text-sm text-[var(--color-text-muted)]">
              The client paid a{" "}
              <strong className="text-[var(--color-text-primary)]">{formatMoney(quote.depositPaidCents)}</strong> deposit
              {quote.alreadyRefundedCents > 0
                ? `, of which ${formatMoney(quote.alreadyRefundedCents)} has already been refunded`
                : ""}
              . Because your business is cancelling, the client is entitled to a full refund.
            </p>
            {refundable > 0 ? (
              <fieldset className="grid *:min-w-0 gap-2">
                <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Refund</legend>
                <RadioCard
                  name="refund-mode"
                  value="FULL"
                  checked={mode === "FULL"}
                  onChange={() => setMode("FULL")}
                  title={`Full refund · ${formatMoney(refundable)}`}
                  description="Recommended. Sent back to the client's original payment method."
                />
                <RadioCard
                  name="refund-mode"
                  value="CUSTOM"
                  checked={mode === "CUSTOM"}
                  onChange={() => setMode("CUSTOM")}
                  title="Partial refund"
                />
                {mode === "CUSTOM" ? (
                  <Input
                    label="Refund amount"
                    inputMode="decimal"
                    value={custom}
                    onChange={(event) => setCustom(event.target.value)}
                    helperText={`Up to ${formatMoney(refundable)}.`}
                  />
                ) : null}
                <RadioCard
                  name="refund-mode"
                  value="NONE"
                  checked={mode === "NONE"}
                  onChange={() => setMode("NONE")}
                  title="No refund"
                  description="Only if you have agreed this with the client."
                />
              </fieldset>
            ) : null}
          </>
        )}
        <TextAreaField
          label="Reason for the client"
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Your stylist is unwell. We're sorry for the inconvenience."
        />
        <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={notifyClient}
            onChange={(event) => setNotifyClient(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Email the client
        </label>
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

export function RefundDialog({ appointment, onClose, onDone }: DialogProps) {
  const notify = useToast();
  const refundable =
    appointment.pricing.depositPaidCents -
    appointment.pricing.refundedCents -
    appointment.pricing.pendingRefundCents;
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [amount, setAmount] = useState((refundable / 100).toFixed(2));
  const [reason, setReason] = useState("");
  const { pending, error, setError, run } = usePendingAction();

  const submit = () =>
    run(async () => {
      const cents = parseMoneyToCents(amount);
      if (cents === null || cents <= 0) {
        setError("Enter a refund amount greater than zero.");
        return;
      }
      if (cents > refundable) {
        setError(`You can refund at most ${formatMoney(refundable)}.`);
        return;
      }
      if (reason.trim().length < 3) {
        setError("Add a short reason for the records.");
        return;
      }
      const response = await studioRequest<AppointmentDetailResponse>(`${base(appointment)}/refunds`, "POST", {
        amountCents: cents,
        reason: reason.trim(),
        idempotencyKey,
      });
      notify({ tone: "success", title: "Refund issued", description: `${formatMoney(cents)} is on its way.` });
      onDone(response);
      onClose();
    });

  return (
    <StudioDialog
      open
      onClose={onClose}
      title="Issue a refund"
      description={`Up to ${formatMoney(refundable)} of the deposit can be refunded.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={() => void submit()}>
            Refund
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-3">
        <Input label="Amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <TextAreaField
          label="Reason"
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}

export function DecideRequestDialog({
  appointment,
  request,
  decision,
  onClose,
  onDone,
}: DialogProps & { request: ChangeRequest; decision: "APPROVE" | "DECLINE" }) {
  const { timezone } = useStudio();
  const notify = useToast();
  const [note, setNote] = useState("");
  const { pending, error, run } = usePendingAction();
  const approving = decision === "APPROVE";

  const submit = () =>
    run(async () => {
      const response = await studioRequest<AppointmentDetailResponse>(
        `/api/v1/business/change-requests/${request.id}`,
        "POST",
        { decision, ...(note.trim() ? { note: note.trim() } : {}) },
      );
      notify({ tone: "success", title: approving ? "Request approved" : "Request declined" });
      onDone(response);
      onClose();
    });

  const summary =
    request.type === "RESCHEDULE" && request.requestedStartAt
      ? `Move to ${formatDateTime(request.requestedStartAt, timezone)}`
      : "Cancel the appointment";

  return (
    <StudioDialog
      open
      onClose={onClose}
      title={approving ? "Approve request" : "Decline request"}
      description={summary}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Go back
          </Button>
          <Button variant={approving ? "primary" : "danger"} loading={pending} onClick={() => void submit()}>
            {approving ? "Approve" : "Decline"}
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-3">
        <p className="rounded-xl bg-[var(--color-surface-strong)] p-3 text-sm text-[var(--color-text-muted)]">
          “{request.reason}”
        </p>
        {approving && request.type === "CANCELLATION" ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Any refund follows the {appointment.service.cancellationPolicy.label.toLowerCase()} policy the client
            booked under, judged at the time they asked ({formatTime(request.createdAt, timezone)}).
          </p>
        ) : null}
        <TextAreaField
          label="Message to the client (optional)"
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
