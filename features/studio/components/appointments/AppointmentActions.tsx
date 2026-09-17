"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import { FormError, TextAreaField } from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, newIdempotencyKey, studioRequest } from "@/features/studio/lib/api";
import { formatMoney, parseMoneyToCents } from "@/features/studio/lib/format";
import type { AppointmentDetail, AppointmentDetailResponse } from "@/features/studio/lib/types";

/*
 * The two appointment actions that stay small dialogs. Check-in, reschedule,
 * cancellation, no-show and completion each have a full page under
 * features/studio/components/appointments/flow.
 */

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
