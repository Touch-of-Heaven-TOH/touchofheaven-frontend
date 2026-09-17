"use client";

import {
  Bell,
  ChevronRight,
  Clock,
  Landmark,
  MapPin,
  Scissors,
  Settings,
  ShieldCheck,
  Store,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { IconCircle, PageHeader, Pill } from "@/features/studio/components/ui/primitives";
import { useStudio } from "@/features/studio/lib/context";
import type { BusinessModule } from "@/features/studio/lib/types";

type SettingsLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
  module?: BusinessModule;
  ownerOnly?: boolean;
};

const LINKS: SettingsLink[] = [
  { label: "Business profile", description: "Name, description, logo and handle.", href: "/studio/settings/profile", icon: Store, ready: false, ownerOnly: true },
  { label: "Location & travel zones", description: "Address, privacy and mobile service area.", href: "/studio/settings/location", icon: MapPin, ready: false, ownerOnly: true },
  { label: "Availability", description: "Weekly hours, booking rules and time off.", href: "/studio/settings/availability", icon: Clock, ready: true, module: "availability", ownerOnly: true },
  { label: "Services", description: "Prices, durations, deposits and options.", href: "/studio/services", icon: Scissors, ready: true, module: "services", ownerOnly: true },
  { label: "Team & permissions", description: "Who can see and change what.", href: "/studio/team", icon: UsersRound, ready: true, module: "team" },
  { label: "Payouts", description: "Where your earnings are paid.", href: "/studio/settings/payouts", icon: Landmark, ready: true, module: "earnings", ownerOnly: true },
  { label: "Policies", description: "Cancellation, deposit and no-show rules.", href: "/studio/settings/policies", icon: ShieldCheck, ready: false, ownerOnly: true },
  { label: "Notifications", description: "How you hear about bookings and requests.", href: "/studio/settings/notifications", icon: Bell, ready: false },
];

export function StudioSettings() {
  const studio = useStudio();
  const visible = LINKS.filter(
    (link) =>
      (!link.ownerOnly || studio.isOwner) && (!link.module || studio.permissions[link.module] !== "none"),
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" icon={Settings} description={`Manage how ${studio.businessName} works.`} />
      <ul className="grid gap-3 md:grid-cols-2">
        {visible.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-full items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] hover:border-[var(--color-brand)] sm:p-5"
            >
              <IconCircle icon={link.icon} tone={link.ready ? "brand" : "gold"} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg text-[var(--color-text-primary)]">{link.label}</span>
                  {link.ready ? null : <Pill tone="gold">Coming soon</Pill>}
                </span>
                <span className="block text-sm text-[var(--color-text-muted)]">{link.description}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-text-muted)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
