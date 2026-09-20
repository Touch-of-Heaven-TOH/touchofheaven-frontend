"use client";

import { CalendarClock, ShieldAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/shared/Input";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/components/feedback/ToastProvider";
import { SettingsShell } from "@/features/account/settings/SettingsShell";
import { errorMessage, useCustomerProfile } from "@/features/account/settings/api";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * Deleting an account is reversible for a grace period and irreversible
 * after it, so the flow says exactly what happens and when, asks the
 * client to type their own email, and then asks for the password the API
 * requires. Nothing is deleted the moment the button is pressed.
 */

type Step = "closed" | "confirm" | "scheduled";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DangerZoneSettings() {
  const { data, error, isLoading, mutate } = useCustomerProfile();
  const profile = data?.profile;
  const toast = useToast();

  const [step, setStep] = useState<Step>("closed");
  const [typedEmail, setTypedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading || (!profile && !error)) {
    return (
      <SettingsShell current="danger" title="Danger zone">
        <LoadingSkeleton label="Loading your account" lines={4} />
      </SettingsShell>
    );
  }

  if (error || !profile) {
    return (
      <SettingsShell current="danger" title="Danger zone">
        <ErrorState description="We couldn't load your account." onRetry={() => void mutate()} />
      </SettingsShell>
    );
  }

  const emailMatches = typedEmail.trim().toLowerCase() === profile.email.toLowerCase();

  async function scheduleDeletion() {
    if (!emailMatches) {
      setFormError("Type your email address exactly as it appears above.");
      return;
    }
    if (!password) {
      setFormError("Enter your password to confirm.");
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      await browserApiFetch("/api/v1/auth/account/delete", {
        method: "POST",
        body: { password },
      });
      await mutate();
      setPassword("");
      setTypedEmail("");
      setStep("scheduled");
      toast.success("Account deletion scheduled. Check your email for confirmation.");
    } catch (deleteError) {
      const message = errorMessage(deleteError, "We couldn't schedule the deletion.");
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletion() {
    setBusy(true);
    try {
      await browserApiFetch("/api/v1/auth/account/delete/cancel", { method: "POST" });
      await mutate();
      setStep("closed");
      toast.success("Deletion cancelled. Your account stays open.");
    } catch (cancelError) {
      toast.error(errorMessage(cancelError, "We couldn't cancel the deletion."));
    } finally {
      setBusy(false);
    }
  }

  const pending = profile.deletion;

  return (
    <SettingsShell
      current="danger"
      title="Danger zone"
      description="Closing your account for good. Read this before you start."
    >
      <div className="grid gap-5">
        {pending ? (
          <section
            role="status"
            className="rounded-[var(--radius-control)] border-2 border-[var(--color-danger)] bg-white p-5"
          >
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--color-danger)]">
              <CalendarClock aria-hidden="true" size={22} />
              Your account is scheduled for deletion
            </h2>
            <p className="mt-2 text-[var(--color-text-primary)]">
              Everything is removed on <strong>{formatDate(pending.scheduledFor)}</strong>. Until then
              you can still sign in, and you can stop this at any time.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Requested on {formatDate(pending.requestedAt)}.
            </p>
            <div className="mt-4">
              <Button type="button" onClick={() => void cancelDeletion()} loading={busy}>
                Cancel deletion
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-[var(--radius-control)] border-2 border-[var(--color-danger)] bg-white p-5">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--color-danger)]">
              <TriangleAlert aria-hidden="true" size={22} />
              Delete my account
            </h2>
            <p className="mt-2 text-[var(--color-text-primary)]">
              This removes your account, your bookings and everything saved on it. It cannot be undone
              once it goes through.
            </p>
            <ul className="mt-3 grid list-disc gap-1 pl-5 text-sm text-[var(--color-text-muted)]">
              <li>You have 14 days to change your mind, and we email you when it starts.</li>
              <li>Upcoming appointments are cancelled under each provider&apos;s policy.</li>
              <li>Records we must keep for tax or dispute reasons are kept without your name on them.</li>
            </ul>
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setStep("confirm");
                }}
              >
                Delete my account
              </Button>
            </div>
          </section>
        )}

        <section className="surface-panel flex items-start gap-3 p-5">
          <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={20} />
          <div>
            <h2 className="font-semibold text-[var(--color-text-primary)]">Want a break instead?</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              You don&apos;t have to delete anything to stop hearing from us. Turn off every message
              under Notifications, and withdraw marketing consent under Privacy. Your bookings and
              history stay where they are.
            </p>
          </div>
        </section>
      </div>

      <Modal
        open={step === "confirm"}
        onClose={() => setStep("closed")}
        title="Are you sure?"
      >
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            This will permanently delete your account, all your bookings, and your data. This cannot be
            undone. We&apos;ll email you a confirmation, and your account will be deleted in 14 days —
            you can cancel any time before then.
          </p>
          <Input
            label="Type your email address to confirm"
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
            autoComplete="off"
            placeholder={profile.email}
            helperText={`Exactly as shown: ${profile.email}`}
          />
          <Input
            label="Your password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            helperText="Confirms it's really you."
          />
          {formError ? (
            <p role="alert" className="text-sm font-semibold text-[var(--color-danger)]">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void scheduleDeletion()}
              loading={busy}
              disabled={!emailMatches || !password}
            >
              Schedule deletion
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep("closed")} disabled={busy}>
              Keep my account
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={step === "scheduled"}
        onClose={() => setStep("closed")}
        title="Account deletion scheduled"
      >
        <div className="grid gap-3 text-sm text-[var(--color-text-muted)]">
          <p>
            You will receive a confirmation email
            {pending ? ` and your account will be deleted on ${formatDate(pending.scheduledFor)}` : ""}.
          </p>
          <p>Change your mind? Come back here and cancel it any time before that date.</p>
          <div className="pt-1">
            <Button type="button" onClick={() => setStep("closed")}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsShell>
  );
}
