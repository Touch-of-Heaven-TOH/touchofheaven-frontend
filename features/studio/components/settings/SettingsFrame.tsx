"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Clock,
  Landmark,
  MapPin,
  Scissors,
  ShieldCheck,
  Store,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { studioFetcher } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import type { BusinessModule } from "@/features/studio/lib/types";

/**
 * The frame every Studio settings screen sits in: breadcrumb, the list of
 * sections, and the section itself. On a phone the list becomes a row of
 * chips that scrolls sideways.
 *
 * A section only appears when this person can actually open it: owner-only
 * areas are hidden from staff, and each one is checked against the
 * permission map the Studio layout already carries.
 */

export type StudioSettingsSectionKey =
  | "profile"
  | "location"
  | "availability"
  | "services"
  | "notifications"
  | "policies"
  | "payouts"
  | "team";

type Section = {
  key: StudioSettingsSectionKey;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  module?: BusinessModule;
  ownerOnly?: boolean;
  /** Hidden for a business with nobody else on it - a sole provider. */
  needsTeam?: boolean;
};

export const STUDIO_SETTINGS_SECTIONS: Section[] = [
  {
    key: "profile",
    label: "Business profile",
    description: "Name, handle, logo, description and the links clients see.",
    href: "/studio/settings/profile",
    icon: Store,
    ownerOnly: true,
  },
  {
    key: "location",
    label: "Location & travel zones",
    description: "Where you work from, and how far you travel.",
    href: "/studio/settings/location",
    icon: MapPin,
    ownerOnly: true,
  },
  {
    key: "availability",
    label: "Availability",
    description: "Weekly hours, booking rules and time off.",
    href: "/studio/settings/availability",
    icon: Clock,
    module: "availability",
    ownerOnly: true,
  },
  {
    key: "services",
    label: "Services",
    description: "Prices, durations, deposits and options.",
    href: "/studio/services",
    icon: Scissors,
    module: "services",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "How you hear about bookings, payouts and the rest.",
    href: "/studio/settings/notifications",
    icon: Bell,
  },
  {
    key: "policies",
    label: "Policies",
    description: "Cancellation, deposits, rescheduling and your own terms.",
    href: "/studio/settings/policies",
    icon: ShieldCheck,
    module: "services",
    ownerOnly: true,
  },
  {
    key: "payouts",
    label: "Payouts",
    description: "Where your earnings are paid.",
    href: "/studio/settings/payouts",
    icon: Landmark,
    module: "earnings",
    ownerOnly: true,
  },
  {
    key: "team",
    label: "Team",
    description: "Who can see and change what.",
    href: "/studio/team",
    icon: UsersRound,
    module: "team",
    needsTeam: true,
  },
];

type TeamResponse = { members: { id: string; status: string }[] };

/**
 * Whether this business has anyone besides the owner. A sole provider
 * never sees a Team section; the settings hub offers to invite the first
 * person instead, so the door isn't locked.
 */
export function useHasTeam(): boolean {
  const studio = useStudio();
  const canRead = studio.permissions.team !== "none";
  const { data } = useSWR<TeamResponse>(
    canRead ? "/api/v1/business/team" : null,
    studioFetcher,
  );
  if (!canRead) return false;
  const members = data?.members ?? [];
  return members.some((member) => member.id !== studio.teamMemberId);
}

export function useVisibleSettingsSections(): Section[] {
  const studio = useStudio();
  const hasTeam = useHasTeam();
  return STUDIO_SETTINGS_SECTIONS.filter((section) => {
    if (section.ownerOnly && !studio.isOwner) return false;
    if (section.module && studio.permissions[section.module] === "none") return false;
    if (section.needsTeam && !hasTeam) return false;
    return true;
  });
}

export function SettingsFrame({
  current,
  title,
  description,
  actions,
  children,
}: {
  /** "home" is the settings hub itself: it owns no section, so none is marked. */
  current: StudioSettingsSectionKey | "home";
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const sections = useVisibleSettingsSections();
  const activeChip = useRef<HTMLAnchorElement | null>(null);

  // On mobile the section list scrolls sideways, and the page you are on can
  // start out past the right edge. Bring it into view so the nav answers
  // "where am I" without being scrolled first. block: "nearest" keeps this
  // from dragging the page itself around.
  useEffect(() => {
    activeChip.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current, sections.length]);

  return (
    <div className="grid gap-5">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-text-muted)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/studio">
              Studio
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          {current === "home" ? null : (
            <>
              <li>
                <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/studio/settings">
                  Settings
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={14} />
              </li>
            </>
          )}
          <li aria-current="page" className="text-[var(--color-text-primary)]">
            {title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <nav
          aria-label="Settings sections"
          className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:sticky lg:top-6 lg:mx-0 lg:overflow-visible lg:px-0"
        >
          <ul role="list" className="flex min-w-max gap-2 pb-1 lg:min-w-0 lg:flex-col lg:gap-1 lg:pb-0">
            {sections.map((section) => {
              const active = section.key === current;
              const Icon = section.icon;
              return (
                <li key={section.key}>
                  <Link
                    href={section.href}
                    ref={active ? activeChip : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--color-brand)] text-white"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                    }`}
                  >
                    <Icon aria-hidden="true" size={17} />
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="min-w-0">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-3xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-[var(--color-text-muted)]">{description}</p>
              ) : null}
            </div>
            {actions}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
