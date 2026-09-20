"use client";

import { Check, Eye, EyeOff, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useToast } from "@/components/feedback/ToastProvider";
import { SettingsShell } from "@/features/account/settings/SettingsShell";
import {
  errorMessage,
  useBeautyProfile,
  type BeautyOption,
  type BeautyProfile,
} from "@/features/account/settings/api";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * What a provider needs to know before an appointment. Every option comes
 * from the API, so this form can never offer a value the backend rejects.
 *
 * Two of these fields are shared with a provider (allergies and notes) and
 * the rest are for matching and preparation; the form says which is which
 * next to the field rather than in a footnote.
 */

const TEXT_LIMIT = 1000;

type Draft = {
  hairType: string | null;
  hairLength: string | null;
  scalpSensitivity: string | null;
  skinTone: string | null;
  preferredStyles: string[];
  allergies: string;
  notes: string;
  shareWithProviders: boolean;
};

function toDraft(profile: BeautyProfile): Draft {
  return {
    hairType: profile.hairType,
    hairLength: profile.hairLength,
    scalpSensitivity: profile.scalpSensitivity,
    skinTone: profile.skinTone,
    preferredStyles: [...profile.preferredStyles],
    allergies: profile.allergies ?? "",
    notes: profile.notes ?? "",
    shareWithProviders: profile.shareWithProviders,
  };
}

function ChipGroup({
  legend,
  hint,
  options,
  value,
  onChange,
}: {
  legend: string;
  hint?: string;
  options: BeautyOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[var(--color-text-primary)]">{legend}</legend>
      {hint ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              // Tapping the selected chip again clears the answer.
              onClick={() => onChange(selected ? null : option.value)}
              className={[
                "inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border px-4 text-sm font-semibold transition",
                selected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]",
              ].join(" ")}
            >
              {selected ? <Check aria-hidden="true" size={15} /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function SwatchGroup({
  options,
  value,
  onChange,
}: {
  options: BeautyOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[var(--color-text-primary)]">Skin tone</legend>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Optional. Only used for services where tone matters, like makeup or facials.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(selected ? null : option.value)}
              className={[
                "grid size-12 place-items-center rounded-full ring-offset-2 transition",
                selected
                  ? "ring-2 ring-[var(--color-brand)]"
                  : "ring-1 ring-[var(--color-border)] hover:ring-[var(--color-brand)]",
              ].join(" ")}
              style={{ backgroundColor: option.swatch ?? "var(--color-brand-soft)" }}
            >
              {/* A tick, not just a ring, so the choice reads without relying on colour. */}
              {selected ? <Check aria-hidden="true" className="text-white drop-shadow" size={20} /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function BeautyProfileSettings() {
  const { data, error, isLoading, mutate } = useBeautyProfile();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const loadedAt = useRef<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const stamp = data.profile.updatedAt ?? "empty";
    if (loadedAt.current === stamp) return;
    loadedAt.current = stamp;
    setDraft(toDraft(data.profile));
  }, [data]);

  const dirty = useMemo(() => {
    if (!data || !draft) return false;
    return JSON.stringify(toDraft(data.profile)) !== JSON.stringify(draft);
  }, [data, draft]);

  if (isLoading || (!data && !error)) {
    return (
      <SettingsShell current="beauty-profile" title="Beauty profile">
        <LoadingSkeleton label="Loading your beauty profile" lines={6} />
      </SettingsShell>
    );
  }

  if (error || !data || !draft) {
    return (
      <SettingsShell current="beauty-profile" title="Beauty profile">
        <ErrorState
          description="We couldn't load your beauty profile."
          onRetry={() => void mutate()}
        />
      </SettingsShell>
    );
  }

  const { options } = data;

  function set<TKey extends keyof Draft>(key: TKey, value: Draft[TKey]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleStyle(style: string) {
    setDraft((current) => {
      if (!current) return current;
      const selected = current.preferredStyles.includes(style);
      return {
        ...current,
        preferredStyles: selected
          ? current.preferredStyles.filter((value) => value !== style)
          : [...current.preferredStyles, style],
      };
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      await browserApiFetch("/api/v1/customer/beauty-profile", {
        method: "PATCH",
        body: {
          hairType: draft.hairType,
          hairLength: draft.hairLength,
          scalpSensitivity: draft.scalpSensitivity,
          skinTone: draft.skinTone,
          preferredStyles: draft.preferredStyles,
          allergies: draft.allergies.trim(),
          notes: draft.notes.trim(),
          shareWithProviders: draft.shareWithProviders,
        },
      });
      await mutate();
      toast.success("Beauty profile saved.");
    } catch (saveError) {
      toast.error(errorMessage(saveError, "We couldn't save your beauty profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsShell
      current="beauty-profile"
      title="Beauty profile"
      description="Your beauty profile helps providers prepare for your appointment and recommend the right services."
    >
      <form className="grid gap-6" onSubmit={(event) => void save(event)}>
        <section className="surface-panel grid gap-6 p-5">
          <ChipGroup
            legend="Hair type"
            hint="Pick the closest match. Tap again to clear it."
            options={options.hairTypes}
            value={draft.hairType}
            onChange={(value) => set("hairType", value)}
          />
          <ChipGroup
            legend="Hair length"
            options={options.hairLengths}
            value={draft.hairLength}
            onChange={(value) => set("hairLength", value)}
          />
          <ChipGroup
            legend="Scalp sensitivity"
            hint="Tells a provider how much tension your scalp is comfortable with."
            options={options.scalpSensitivities}
            value={draft.scalpSensitivity}
            onChange={(value) => set("scalpSensitivity", value)}
          />
          <SwatchGroup
            options={options.skinTones}
            value={draft.skinTone}
            onChange={(value) => set("skinTone", value)}
          />
        </section>

        <section className="surface-panel p-5">
          <fieldset>
            <legend className="text-sm font-semibold text-[var(--color-text-primary)]">
              Styles you like
            </legend>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Used to suggest services. Pick as many as you like.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.styles.map((style) => {
                const selected = draft.preferredStyles.includes(style.value);
                return (
                  <button
                    key={style.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleStyle(style.value)}
                    className={[
                      "inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border px-4 text-sm font-semibold transition",
                      selected
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                        : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]",
                    ].join(" ")}
                  >
                    {selected ? <Check aria-hidden="true" size={15} /> : null}
                    {style.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="surface-panel grid gap-5 p-5">
          <div className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]">
            <Eye aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-brand)]" size={16} />
            <p>
              <strong>Shared with your provider</strong> before your appointment. Everything above is
              used for matching and preparation.
            </p>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Allergies</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              Products or ingredients that react with your skin or scalp.
            </span>
            <textarea
              value={draft.allergies}
              maxLength={TEXT_LIMIT}
              rows={3}
              onChange={(event) => set("allergies", event.target.value)}
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3 text-sm"
              placeholder="For example: reacts to sulphates and strong gels."
            />
            <span className="text-xs text-[var(--color-text-muted)]">
              {draft.allergies.length}/{TEXT_LIMIT}
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Anything else providers should know
            </span>
            <textarea
              value={draft.notes}
              maxLength={TEXT_LIMIT}
              rows={3}
              onChange={(event) => set("notes", event.target.value)}
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3 text-sm"
              placeholder="For example: prefers a low-tension install, tender at the edges."
            />
            <span className="text-xs text-[var(--color-text-muted)]">
              {draft.notes.length}/{TEXT_LIMIT}
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
            <input
              type="checkbox"
              checked={draft.shareWithProviders}
              onChange={(event) => set("shareWithProviders", event.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                {draft.shareWithProviders ? (
                  <Eye aria-hidden="true" size={16} />
                ) : (
                  <EyeOff aria-hidden="true" size={16} />
                )}
                Share this profile with providers I book
              </span>
              <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                Turn this off and your beauty profile stays private. You can still use it for
                recommendations.
              </span>
            </span>
          </label>
        </section>

        <p className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
          <Info aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
          Allergies and notes are stored encrypted, and only shown to a provider you have an
          appointment with.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save beauty profile
          </Button>
          {dirty ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => setDraft(toDraft(data.profile))}
              >
                Discard
              </Button>
              <span role="status" className="text-sm font-semibold text-[var(--color-warning)]">
                You have unsaved changes.
              </span>
            </>
          ) : data.profile.updatedAt ? (
            <span className="text-sm text-[var(--color-text-muted)]">
              Last saved {new Date(data.profile.updatedAt).toLocaleDateString()}.
            </span>
          ) : null}
        </div>
      </form>
    </SettingsShell>
  );
}
