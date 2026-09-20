"use client";

import { CalendarClock, CircleDollarSign, Eye, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { SettingsFrame } from "@/features/studio/components/settings/SettingsFrame";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { FormError, SkeletonRows, TextAreaField, Toggle } from "@/features/studio/components/ui/primitives";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";

/**
 * The business's own terms, with the card a client reads shown beside the
 * form as it is edited.
 *
 * Two of these settings change what the platform does: the refund policy
 * is the one refunds are computed from and the one new services inherit,
 * and the deposit is what a new service asks for. The rest are the terms
 * clients are held to, which is said plainly rather than implied.
 */

const TEXT_LIMIT = 1000;

type Policy = {
  defaultCancellationPolicyKey: string;
  cancellationHours: number;
  cancellationFeePercent: number;
  lateCancelFeePercent: number;
  noShowFeePercent: number;
  depositRequired: boolean;
  depositPercent: number;
  rescheduleHours: number;
  maxReschedulesPerBooking: number;
  customPolicyText: string | null;
  updatedAt: string | null;
  cancellationPolicy: { key: string; label: string; description: string };
};

type Payload = {
  policy: Policy;
  options: { cancellationPolicies: { key: string; label: string; description: string }[] };
};

function Slider({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[var(--color-text-primary)]" htmlFor={label}>
          {label}
        </label>
        <output className="font-serif text-xl font-semibold text-[var(--color-brand)]">{value}%</output>
      </div>
      <input
        id={label}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full accent-[var(--color-brand)]"
      />
      <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
    </div>
  );
}

/** Exactly what a client reads on the booking page. */
function PolicyPreview({ policy, businessName }: { policy: Policy; businessName: string }) {
  return (
    <aside className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
      <header className="flex items-center gap-2">
        <Eye aria-hidden="true" className="text-[var(--color-brand)]" size={17} />
        <h2 className="font-semibold text-[var(--color-text-primary)]">What clients see</h2>
      </header>

      <div>
        <h3 className="font-serif text-xl font-semibold">Booking terms for {businessName}</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Agreed to when a booking is confirmed.
        </p>
      </div>

      <div className="grid gap-3 text-sm">
        <div className="flex gap-2">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={16} />
          <p>
            <strong>Cancelling.</strong> {policy.cancellationPolicy.description} You ask for{" "}
            {policy.cancellationHours} hours&apos; notice
            {policy.cancellationFeePercent > 0
              ? `, and charge ${policy.cancellationFeePercent}% of the service if a booking is cancelled later than that`
              : ""}
            .
          </p>
        </div>

        <div className="flex gap-2">
          <CircleDollarSign aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={16} />
          <p>
            <strong>Deposit.</strong>{" "}
            {policy.depositRequired
              ? `A ${policy.depositPercent}% deposit confirms the appointment. The rest is paid at the appointment.`
              : `New services ask for a ${policy.depositPercent}% deposit unless the service says otherwise.`}
          </p>
        </div>

        <div className="flex gap-2">
          <CalendarClock aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={16} />
          <p>
            <strong>Changing a booking.</strong> {policy.rescheduleHours} hours&apos; notice to reschedule, up
            to {policy.maxReschedulesPerBooking}{" "}
            {policy.maxReschedulesPerBooking === 1 ? "time" : "times"} per booking.
          </p>
        </div>

        <div className="flex gap-2">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={16} />
          <p>
            <strong>Not turning up.</strong> A no-show is charged {policy.noShowFeePercent}% of the service,
            and a cancellation within two hours {policy.lateCancelFeePercent}%.
          </p>
        </div>

        {policy.customPolicyText ? (
          <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3">
            <p className="font-semibold text-[var(--color-text-primary)]">From {businessName}</p>
            <p className="mt-1 whitespace-pre-line text-[var(--color-text-muted)]">{policy.customPolicyText}</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function PolicySettings() {
  const studio = useStudio();
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR<Payload>("/api/v1/braiders/policies", studioFetcher);

  const [draft, setDraft] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadedAt = useRef<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const stamp = data.policy.updatedAt ?? "defaults";
    if (loadedAt.current === stamp) return;
    loadedAt.current = stamp;
    setDraft(data.policy);
  }, [data]);

  const dirty = useMemo(
    () => (data && draft ? JSON.stringify(data.policy) !== JSON.stringify(draft) : false),
    [data, draft],
  );

  if (isLoading || (!data && !error)) {
    return (
      <SettingsFrame current="policies" title="Policies">
        <SkeletonRows rows={6} label="Loading your policies" />
      </SettingsFrame>
    );
  }

  if (error || !data || !draft) {
    return (
      <SettingsFrame current="policies" title="Policies">
        <div className="grid justify-items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="font-semibold">We couldn&apos;t load your policies.</p>
          <Button onClick={() => void mutate()}>Try again</Button>
        </div>
      </SettingsFrame>
    );
  }

  function set<TKey extends keyof Policy>(key: TKey, value: Policy[TKey]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function choosePolicy(key: string) {
    const option = data?.options.cancellationPolicies.find((policy) => policy.key === key);
    setDraft((current) =>
      current
        ? {
            ...current,
            defaultCancellationPolicyKey: key,
            cancellationPolicy: option ?? current.cancellationPolicy,
          }
        : current,
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setFormError(null);
    setSaving(true);
    try {
      await studioRequest("/api/v1/braiders/policies", "PATCH", {
        defaultCancellationPolicyKey: draft.defaultCancellationPolicyKey,
        cancellationHours: draft.cancellationHours,
        cancellationFeePercent: draft.cancellationFeePercent,
        lateCancelFeePercent: draft.lateCancelFeePercent,
        noShowFeePercent: draft.noShowFeePercent,
        depositRequired: draft.depositRequired,
        depositPercent: draft.depositPercent,
        rescheduleHours: draft.rescheduleHours,
        maxReschedulesPerBooking: draft.maxReschedulesPerBooking,
        customPolicyText: draft.customPolicyText ?? "",
      });
      await mutate();
      toast({ tone: "success", title: "Policies saved." });
    } catch (saveError) {
      const message = errorMessage(saveError, "We couldn't save your policies.");
      setFormError(message);
      toast({ tone: "error", title: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsFrame
      current="policies"
      title="Policies"
      description="Your terms, and the card clients read before they book."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <form className="grid gap-5" onSubmit={(event) => void save(event)}>
          <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Cancelling and refunds</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                The policy below is what refunds are worked out from, and what a new service starts with.
              </p>
            </div>

            <fieldset className="grid gap-2">
              <legend className="sr-only">Refund policy</legend>
              {data.options.cancellationPolicies.map((option) => (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border p-3 ${
                    draft.defaultCancellationPolicyKey === option.key
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation-policy"
                    value={option.key}
                    checked={draft.defaultCancellationPolicyKey === option.key}
                    onChange={() => choosePolicy(option.key)}
                    className="mt-1 size-4 accent-[var(--color-brand)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">{option.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <Input
              label="Notice you ask for (hours)"
              inputMode="numeric"
              value={String(draft.cancellationHours)}
              onChange={(event) =>
                set("cancellationHours", Math.min(336, Number(event.target.value.replace(/[^0-9]/g, "") || 0)))
              }
              helperText="Shown to clients as the notice you expect."
            />
            <Slider
              label="Fee for cancelling late"
              hint="Charged when a client cancels after the notice above."
              value={draft.cancellationFeePercent}
              onChange={(value) => set("cancellationFeePercent", value)}
            />
            <Slider
              label="Fee within two hours"
              hint="For a cancellation right before the appointment."
              value={draft.lateCancelFeePercent}
              onChange={(value) => set("lateCancelFeePercent", value)}
            />
            <Slider
              label="No-show fee"
              hint="When a client doesn't arrive at all."
              value={draft.noShowFeePercent}
              onChange={(value) => set("noShowFeePercent", value)}
            />
            <p className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-xs text-[var(--color-text-primary)]">
              These three figures are your stated terms, shown to clients and used when a case is reviewed.
              Automatic refunds follow the policy above.
            </p>
          </section>

          <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Deposit</h2>
            <Toggle
              checked={draft.depositRequired}
              onChange={(checked) => set("depositRequired", checked)}
              label="Require a deposit to confirm a booking"
            />
            <Slider
              label="Deposit"
              hint="Between 0% and 50% of the service price. New services start with this."
              value={draft.depositPercent}
              onChange={(value) => set("depositPercent", Math.min(50, value))}
            />
          </section>

          <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Rescheduling</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Notice to reschedule (hours)"
                inputMode="numeric"
                value={String(draft.rescheduleHours)}
                onChange={(event) =>
                  set("rescheduleHours", Math.min(336, Number(event.target.value.replace(/[^0-9]/g, "") || 0)))
                }
              />
              <Input
                label="Reschedules allowed per booking"
                inputMode="numeric"
                value={String(draft.maxReschedulesPerBooking)}
                onChange={(event) =>
                  set(
                    "maxReschedulesPerBooking",
                    Math.min(3, Number(event.target.value.replace(/[^0-9]/g, "") || 0)),
                  )
                }
                helperText="Up to three."
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Reschedule requests still come to you to accept or decline; these are the limits clients are
              shown.
            </p>
          </section>

          <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Your own terms</h2>
            <TextAreaField
              label="Anything else clients agree to when booking"
              rows={5}
              maxLength={TEXT_LIMIT}
              value={draft.customPolicyText ?? ""}
              onChange={(event) => set("customPolicyText", event.target.value)}
              hint={`${(draft.customPolicyText ?? "").length}/${TEXT_LIMIT} · For example: come with hair washed and blow-dried.`}
            />
          </section>

          <FormError message={formError} />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save policies
            </Button>
            {dirty ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => setDraft(data.policy)}
                >
                  Discard
                </Button>
                <span role="status" className="text-sm font-semibold text-[var(--color-warning)]">
                  Unsaved changes — the preview shows them already.
                </span>
              </>
            ) : draft.updatedAt ? (
              <span className="text-sm text-[var(--color-text-muted)]">
                Last saved {new Date(draft.updatedAt).toLocaleDateString()}.
              </span>
            ) : null}
          </div>
        </form>

        <div className="xl:sticky xl:top-6">
          <PolicyPreview policy={draft} businessName={studio.businessName} />
        </div>
      </div>
    </SettingsFrame>
  );
}
