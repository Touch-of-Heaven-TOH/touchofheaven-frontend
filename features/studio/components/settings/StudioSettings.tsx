"use client";

import Link from "next/link";
import { ChevronRight, CircleCheck, CircleDashed, ExternalLink, UserPlus } from "lucide-react";
import useSWR from "swr";
import { IconCircle } from "@/features/studio/components/ui/primitives";
import {
  SettingsFrame,
  useHasTeam,
  useVisibleSettingsSections,
} from "@/features/studio/components/settings/SettingsFrame";
import { studioFetcher } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";

/**
 * The Studio settings hub: how complete the public profile is, what is
 * still missing from it, and the way in to every section this person can
 * open.
 */

type Completion = {
  score: number;
  parts: {
    hasProfessionalName: boolean;
    hasBio: boolean;
    portfolioPhotoCount: number;
    serviceCount: number;
    hasAvailabilityConfigured: boolean;
    hasLocationSet: boolean;
    minPortfolioPhotos: number;
  };
  weights: Record<string, number>;
};

type Step = { label: string; done: boolean; href: string; weight: number };

function steps(completion: Completion | undefined): Step[] {
  if (!completion) return [];
  const { parts, weights } = completion;
  return [
    {
      label: "Business name",
      done: parts.hasProfessionalName,
      href: "/studio/settings/profile",
      weight: weights.professionalName ?? 0,
    },
    {
      label: "Description clients read",
      done: parts.hasBio,
      href: "/studio/settings/profile",
      weight: weights.bio ?? 0,
    },
    {
      label: `${parts.minPortfolioPhotos} portfolio photos`,
      done: parts.portfolioPhotoCount >= parts.minPortfolioPhotos,
      href: "/studio/portfolio",
      weight: weights.portfolioPhotos ?? 0,
    },
    {
      label: "At least one service",
      done: parts.serviceCount >= 1,
      href: "/studio/services",
      weight: weights.services ?? 0,
    },
    {
      label: "Working hours",
      done: parts.hasAvailabilityConfigured,
      href: "/studio/settings/availability",
      weight: weights.availability ?? 0,
    },
    {
      label: "Where you work",
      done: parts.hasLocationSet,
      href: "/studio/settings/location",
      weight: weights.location ?? 0,
    },
  ];
}

export function StudioSettings() {
  const studio = useStudio();
  const sections = useVisibleSettingsSections();
  const hasTeam = useHasTeam();
  const { data, isLoading } = useSWR<Completion>(
    studio.isOwner ? "/api/v1/braiders/profile/completion" : null,
    studioFetcher,
  );

  const score = data?.score ?? 0;
  const missing = steps(data).filter((step) => !step.done);

  return (
    <SettingsFrame
      current="profile"
      title="Settings"
      description={`How ${studio.businessName} works, and what clients see.`}
      actions={
        <Link
          href={`/businesses/${studio.businessId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-white px-4 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]"
        >
          Preview public profile
          <ExternalLink aria-hidden="true" size={15} />
        </Link>
      }
    >
      <div className="grid gap-5">
        {studio.isOwner ? (
          <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)]">Profile completeness</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {isLoading
                    ? "Checking what's on your profile…"
                    : missing.length === 0
                      ? "Everything clients look for is in place."
                      : `${missing.length} thing${missing.length === 1 ? "" : "s"} left to finish.`}
                </p>
              </div>
              <p className="font-serif text-3xl font-semibold text-[var(--color-brand)]">{score}%</p>
            </div>

            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-brand-soft)]"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completeness"
            >
              <div
                className="h-full rounded-full bg-[var(--color-brand)] transition-all"
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>

            {!isLoading && data ? (
              <ul role="list" className="mt-4 grid gap-2 sm:grid-cols-2">
                {steps(data).map((step) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-sm hover:bg-[var(--color-brand-soft)]"
                    >
                      {step.done ? (
                        <CircleCheck aria-hidden="true" className="shrink-0 text-[var(--color-success)]" size={16} />
                      ) : (
                        <CircleDashed aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" size={16} />
                      )}
                      <span className={step.done ? "text-[var(--color-text-muted)]" : "font-semibold"}>
                        {step.label}
                      </span>
                      <span className="ml-auto text-xs text-[var(--color-text-muted)]">{step.weight}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <ul role="list" className="grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <li key={section.key}>
              <Link
                href={section.href}
                className="flex h-full items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)] sm:p-5"
              >
                <IconCircle icon={section.icon} tone="brand" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[var(--color-text-primary)]">{section.label}</span>
                  <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{section.description}</span>
                </span>
                <ChevronRight aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" size={18} />
              </Link>
            </li>
          ))}
        </ul>

        {/* A sole provider has no Team section. The door still has to be
            somewhere, so it is here rather than in the navigation. */}
        {studio.isOwner && !hasTeam ? (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="min-w-0">
              <h2 className="font-semibold text-[var(--color-text-primary)]">Working on your own?</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Invite someone and a Team section appears here, with control over what each person can see.
              </p>
            </div>
            <Link
              href="/studio/team"
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] px-4 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]"
            >
              <UserPlus aria-hidden="true" size={16} />
              Invite someone
            </Link>
          </section>
        ) : null}
      </div>
    </SettingsFrame>
  );
}
