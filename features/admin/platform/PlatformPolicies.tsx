"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { AuditTrail } from "@/features/admin/platform/AuditTrail";
import { adminFetcher, adminRequest, errorMessage, isAuditKey } from "@/features/admin/lib/api";
import type { PlatformPolicy } from "@/features/admin/lib/admin-types";

/**
 * The settings that apply to everyone: what the platform takes, the floor
 * under every business's own booking rules, and the documents people
 * agree to.
 *
 * Nothing here saves without a reason attached. Six months later, "the fee
 * went to 15% on the 3rd" is readable off the audit table; why it went
 * there is the only part that can't be reconstructed, so it is required.
 */

type Draft = {
  platformFeePercent: string;
  minimumBookingValueCents: string;
  cancellationWindowHours: string;
  maxRefundDays: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  providerCodeOfConductUrl: string;
};

function toDraft(policy: PlatformPolicy): Draft {
  return {
    platformFeePercent: String(policy.platformFeePercent),
    minimumBookingValueCents: String(policy.minimumBookingValueCents),
    cancellationWindowHours: String(policy.cancellationWindowHours),
    maxRefundDays: String(policy.maxRefundDays),
    termsOfServiceUrl: policy.termsOfServiceUrl ?? "",
    privacyPolicyUrl: policy.privacyPolicyUrl ?? "",
    providerCodeOfConductUrl: policy.providerCodeOfConductUrl ?? "",
  };
}

export function PlatformPolicies() {
  const { data, error, isLoading, mutate } = useSWR<{ policy: PlatformPolicy }>(
    "/api/v1/admin/platform/policies",
    adminFetcher,
  );

  const { mutate: mutateAudit } = useSWRConfig();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const policy = data?.policy;
  const form = draft ?? (policy ? toDraft(policy) : null);

  function set<K extends keyof Draft>(key: K, value: string) {
    if (!form) return;
    setDraft({ ...form, [key]: value });
    setSaved(null);
  }

  const feeChanged =
    policy !== undefined && form !== null && form.platformFeePercent !== String(policy.platformFeePercent);
  const dirty =
    policy !== undefined && form !== null
      ? JSON.stringify(form) !== JSON.stringify(toDraft(policy))
      : false;

  async function save() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminRequest("/api/v1/admin/platform/policies", "PATCH", {
        changeNote: changeNote.trim(),
        platformFeePercent: Number(form.platformFeePercent),
        minimumBookingValueCents: Number(form.minimumBookingValueCents),
        cancellationWindowHours: Number(form.cancellationWindowHours),
        maxRefundDays: Number(form.maxRefundDays),
        termsOfServiceUrl: form.termsOfServiceUrl.trim(),
        privacyPolicyUrl: form.privacyPolicyUrl.trim(),
        providerCodeOfConductUrl: form.providerCodeOfConductUrl.trim(),
      });
      setConfirming(false);
      setChangeNote("");
      setDraft(null);
      setSaved("Saved, and recorded in the audit log below.");
      await mutate();
      await mutateAudit(isAuditKey);
    } catch (requestError) {
      setSaveError(errorMessage(requestError, "We couldn't save those policies."));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Loading platform policies">
        <div className="h-24 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
        <div className="h-64 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
      </div>
    );
  }

  if (error || !policy || !form) {
    return (
      <div className="grid justify-items-start gap-3 rounded-md border border-[var(--color-border)] bg-white p-6">
        <p className="flex items-center gap-2 font-bold text-[var(--color-danger)]">
          <TriangleAlert aria-hidden="true" size={18} />
          {errorMessage(error, "We couldn't load the platform policies.")}
        </p>
        <Button onClick={() => void mutate()}>Try again</Button>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Administration"
        title="Platform policies"
        description="What the platform charges, the floor under every business's booking rules, and the documents everyone agrees to."
      />

      {saved ? (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--color-success-soft)] px-4 py-3 text-sm font-bold text-[var(--color-success)]"
        >
          <CircleCheck aria-hidden="true" size={18} />
          {saved}
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaveError(null);
          setConfirming(true);
        }}
        className="grid gap-4"
      >
        <AdminPanel title="Fees">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="platformFeePercent"
              label="Platform fee"
              suffix="%"
              value={form.platformFeePercent}
              onChange={(value) => set("platformFeePercent", value)}
              hint="Between 0 and 30. Taken from every booking."
            />
            <NumberField
              id="minimumBookingValueCents"
              label="Minimum booking value"
              suffix="cents"
              value={form.minimumBookingValueCents}
              onChange={(value) => set("minimumBookingValueCents", value)}
              hint={`Currently ${(Number(form.minimumBookingValueCents || 0) / 100).toFixed(2)}. Stored in cents, like every other amount here.`}
            />
          </div>
          {feeChanged ? (
            <p
              role="status"
              className="mt-3 flex items-start gap-2 rounded-md bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-bold text-[var(--color-warning)]"
            >
              <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              This changes what the platform takes from every future booking. Bookings already
              made keep the fee they were made under.
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Booking rules">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="cancellationWindowHours"
              label="Default cancellation window"
              suffix="hours"
              value={form.cancellationWindowHours}
              onChange={(value) => set("cancellationWindowHours", value)}
              hint="The default a new business starts with. Each one can set its own."
            />
            <NumberField
              id="maxRefundDays"
              label="Refunds accepted up to"
              suffix="days after"
              value={form.maxRefundDays}
              onChange={(value) => set("maxRefundDays", value)}
              hint="How long after an appointment a refund can still be issued."
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Legal documents">
          <div className="grid gap-4">
            <UrlField
              id="termsOfServiceUrl"
              label="Terms of service"
              value={form.termsOfServiceUrl}
              onChange={(value) => set("termsOfServiceUrl", value)}
            />
            <UrlField
              id="privacyPolicyUrl"
              label="Privacy policy"
              value={form.privacyPolicyUrl}
              onChange={(value) => set("privacyPolicyUrl", value)}
            />
            <UrlField
              id="providerCodeOfConductUrl"
              label="Provider code of conduct"
              value={form.providerCodeOfConductUrl}
              onChange={(value) => set("providerCodeOfConductUrl", value)}
              hint="Applies to every kind of provider on the platform, not only braiders."
            />
          </div>
        </AdminPanel>

        {saveError ? (
          <p
            role="alert"
            className="rounded-md bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--color-danger)]"
          >
            {saveError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty}>
            Save changes
          </Button>
          {dirty ? (
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setSaveError(null);
              }}
              className="min-h-11 text-sm font-bold text-[var(--color-text-muted)] hover:underline"
            >
              Discard
            </button>
          ) : (
            <span className="text-sm text-[var(--color-text-muted)]">
              Last changed {new Date(policy.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </form>

      <div className="mt-6">
        <AuditTrail
          event="PLATFORM_POLICY_UPDATED"
          title="Policy change history"
          emptyText="No policy changes recorded yet."
        />
      </div>

      <Modal
        open={confirming}
        onClose={() => (saving ? undefined : setConfirming(false))}
        title="Why are you changing this?"
      >
        <div className="grid gap-4">
          <p className="text-sm">
            These settings apply to everyone on the platform. The note below is stored against
            the change permanently, with your name and the time.
          </p>
          <div className="grid gap-1.5">
            <label htmlFor="change-note" className="text-sm font-bold">
              Reason for the change <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="change-note"
              required
              rows={3}
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="e.g. New payout terms agreed with the payment provider."
            />
            <p className="text-xs text-[var(--color-text-muted)]">At least a few words.</p>
          </div>

          {saveError ? (
            <p
              role="alert"
              className="rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-bold text-[var(--color-danger)]"
            >
              {saveError}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              loading={saving}
              disabled={changeNote.trim().length < 10}
            >
              Save and record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-[var(--color-text-primary)]">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-3">
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ""))}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {suffix ? (
          <span className="shrink-0 text-sm text-[var(--color-text-muted)]">{suffix}</span>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
}

function UrlField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-[var(--color-text-primary)]">
        {label}
      </label>
      <input
        id={id}
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://"
        className="min-h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-brand)]"
      />
      <p className="text-xs text-[var(--color-text-muted)]">
        {hint ?? "Leave empty if there isn't one yet."}
      </p>
    </div>
  );
}
