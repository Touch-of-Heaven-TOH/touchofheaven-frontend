"use client";

import { useRouter } from "next/navigation";
import { Flower2, Grid2x2, Palette, Scissors, Sparkles, User, Users } from "lucide-react";
import { useState } from "react";
import type {
  WizardApplication,
  WizardStep1Payload,
} from "@/features/business-wizard/useBusinessWizardDraft";

const CATEGORIES: {
  value: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
}[] = [
  {
    value: "HAIR_BRAIDING",
    label: "Hair & Braiding",
    description: "Braiders, hairstylists and locticians",
    icon: Sparkles,
  },
  { value: "NAILS", label: "Nails", description: "Nail technicians and nail studios", icon: Palette },
  { value: "BARBERING", label: "Barbering", description: "Barbers and barbershops", icon: Scissors },
  {
    value: "SPA_WELLNESS",
    label: "Spa & Wellness",
    description: "Spa, massage and wellness professionals",
    icon: Flower2,
  },
  {
    value: "MULTI_SERVICE",
    label: "Multi-service Business",
    description: "One business offering several categories",
    icon: Grid2x2,
  },
];

const WORK_MODES: {
  value: string;
  label: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    value: "INDEPENDENT",
    label: "Independent professional",
    description: "I work by myself and manage my own client appointments.",
    icon: User,
  },
  {
    value: "TEAM",
    label: "Business with a team",
    description: "I have a team or employees who help deliver services.",
    icon: Users,
  },
];

export function Step1BusinessType({
  application,
  saveStep1,
  saving,
}: {
  application: WizardApplication;
  saveStep1: (input: WizardStep1Payload) => Promise<WizardApplication>;
  saving: boolean;
}) {
  const router = useRouter();
  const [businessCategory, setBusinessCategory] = useState(
    application.businessCategory ?? "",
  );
  const [workMode, setWorkMode] = useState(application.workMode ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!businessCategory || !workMode) {
      setError("Choose a business type and how you work to continue.");
      return;
    }
    setError(null);
    try {
      await saveStep1({ businessCategory, workMode });
      router.push("/business/setup/details");
    } catch {
      setError("We could not save that. Try again.");
    }
  }

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        Step 1 of 4
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
        What kind of business are you building?
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Choose the option that best describes your primary work. You can add more
        services later.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const selected = businessCategory === category.value;
          return (
            <button
              className={`relative rounded-xl border p-4 text-center transition ${
                selected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]/50"
              }`}
              key={category.value}
              onClick={() => setBusinessCategory(category.value)}
              type="button"
            >
              {selected ? (
                <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[var(--color-brand)] text-white">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              ) : null}
              <Icon
                aria-hidden="true"
                className="mx-auto text-[var(--color-copper)]"
                size={32}
                strokeWidth={1.5}
              />
              <span className="mt-3 block text-sm font-semibold text-[var(--color-text-primary)]">
                {category.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">
                {category.description}
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-[var(--color-text-primary)]">
        How do you work?
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {WORK_MODES.map((mode) => {
          const Icon = mode.icon;
          const selected = workMode === mode.value;
          return (
            <button
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]/50"
              }`}
              key={mode.value}
              onClick={() => setWorkMode(mode.value)}
              type="button"
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)]"
                }`}
              >
                {selected ? (
                  <span className="size-2.5 rounded-full bg-[var(--color-brand)]" />
                ) : null}
              </span>
              <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-copper)]" size={22} />
              <span>
                <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                  {mode.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">
                  {mode.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p
          className="mt-4 rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex justify-end border-t border-[var(--color-border)] pt-6">
        <button
          className="btn-primary"
          disabled={saving}
          onClick={handleContinue}
          type="button"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </section>
  );
}
