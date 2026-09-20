"use client";

import Link from "next/link";
import { ChevronRight, CircleCheck, CircleDashed } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { SettingsShell } from "@/features/account/settings/SettingsShell";
import { SETTINGS_SECTIONS, type SettingsSectionKey } from "@/features/account/settings/sections";
import {
  useBeautyProfile,
  useCustomerProfile,
  type BeautyProfile,
  type CustomerProfile,
} from "@/features/account/settings/api";

/**
 * The settings hub: what each section is for, and whether it still needs
 * something from the client. Only sections with a "filled in" state carry
 * a badge - "Complete" on Addresses would be a judgement about how someone
 * lives, not a fact.
 */

type Completion = { complete: boolean; hint: string };

function profileCompletion(profile: CustomerProfile | undefined): Completion {
  if (!profile) return { complete: false, hint: "" };
  const missing = [
    profile.displayName?.trim() ? null : "your name",
    profile.phoneNumberE164 ? null : "a phone number",
    profile.avatarObjectKey ? null : "a photo",
  ].filter(Boolean) as string[];
  return missing.length === 0
    ? { complete: true, hint: "Name, phone and photo are set." }
    : { complete: false, hint: `Still missing ${missing.join(" and ")}.` };
}

function beautyCompletion(profile: BeautyProfile | undefined): Completion {
  if (!profile) return { complete: false, hint: "" };
  const answered = [profile.hairType, profile.hairLength, profile.scalpSensitivity].filter(Boolean).length;
  return answered >= 3
    ? { complete: true, hint: "Providers know what to prepare for." }
    : {
        complete: false,
        hint: answered === 0 ? "Nothing filled in yet." : "A few answers still missing.",
      };
}

function Badge({ complete }: { complete: boolean }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        complete
          ? "bg-[var(--color-success-soft,#e7f5ec)] text-[var(--color-success)]"
          : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      ].join(" ")}
    >
      {complete ? (
        <CircleCheck aria-hidden="true" size={14} />
      ) : (
        <CircleDashed aria-hidden="true" size={14} />
      )}
      {complete ? "Complete" : "Incomplete"}
    </span>
  );
}

export function SettingsLanding() {
  const profile = useCustomerProfile();
  const beauty = useBeautyProfile();

  const loading = profile.isLoading || beauty.isLoading;
  const completion: Partial<Record<SettingsSectionKey, Completion>> = {
    profile: profileCompletion(profile.data?.profile),
    "beauty-profile": beautyCompletion(beauty.data?.profile),
  };

  return (
    <SettingsShell
      title="Settings"
      description="Your details, what providers see, and how the platform contacts you."
    >
      {profile.error ? (
        <ErrorState
          description="We couldn't load your account details."
          onRetry={() => void profile.mutate()}
        />
      ) : null}

      {profile.data?.profile.deletion ? (
        <p
          role="status"
          className="mb-5 rounded-[var(--radius-control)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]"
        >
          This account is scheduled for deletion on{" "}
          {new Date(profile.data.profile.deletion.scheduledFor).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .{" "}
          <Link className="underline" href="/account/settings/danger">
            Cancel it
          </Link>
        </p>
      ) : null}

      {loading ? (
        <LoadingSkeleton label="Loading your settings" lines={6} />
      ) : (
        <ul role="list" className="grid gap-3 sm:grid-cols-2">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const status = completion[section.key];
            return (
              <li key={section.key}>
                <Link
                  href={section.href}
                  className={[
                    "flex h-full min-h-24 items-start gap-3 rounded-[var(--radius-control)] border bg-white p-4 shadow-[var(--shadow-subtle)] transition",
                    section.destructive
                      ? "border-[var(--color-danger)]/35 hover:border-[var(--color-danger)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      section.destructive
                        ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                        : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
                    ].join(" ")}
                  >
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--color-text-primary)]">{section.title}</span>
                      {status ? <Badge complete={status.complete} /> : null}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                      {section.description}
                    </span>
                    {status?.hint ? (
                      <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{status.hint}</span>
                    ) : null}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-[var(--color-text-muted)]"
                    size={18}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsShell>
  );
}
