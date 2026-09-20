"use client";

import {
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquareWarning,
  Scale,
  ServerCog,
  ShieldCheck,
  Store,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { adminFetcher, errorMessage } from "@/features/admin/lib/api";
import type { PlatformStats } from "@/features/admin/lib/admin-types";

/**
 * Not a menu with a heading - a place to see whether the platform needs
 * you. The four numbers at the top are live counts, and two of them are
 * work queues: if either is above zero, someone is waiting on an admin.
 *
 * The sections below are the menu, and they come second on purpose.
 */

type SummaryCard = {
  key: keyof PlatformStats;
  label: string;
  detail: string;
  icon: LucideIcon;
  href?: string;
  /** A queue: worth drawing attention to when it isn't empty. */
  actionable?: boolean;
};

const CARDS: SummaryCard[] = [
  {
    key: "pendingApplications",
    label: "Applications waiting",
    detail: "People asking to work here",
    icon: ClipboardList,
    href: "/admin/applications",
    actionable: true,
  },
  {
    key: "openDisputes",
    label: "Open complaints",
    detail: "Cases nobody has settled",
    icon: MessageSquareWarning,
    href: "/admin/disputes",
    actionable: true,
  },
  {
    key: "activeProviders",
    label: "Active providers",
    detail: "Businesses able to take bookings",
    icon: Store,
  },
  {
    key: "activeClients",
    label: "Active clients",
    detail: "People able to book",
    icon: UsersRound,
  },
];

const SECTIONS: {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
}[] = [
  {
    label: "Provider applications",
    description: "Review, approve and reject people applying to work here.",
    href: "/admin/applications",
    icon: ClipboardList,
    ready: true,
  },
  {
    label: "Platform policies",
    description: "Fees, booking rules and the legal documents everyone agrees to.",
    href: "/admin/policies",
    icon: Scale,
    ready: true,
  },
  {
    label: "System configuration",
    description: "Maintenance mode and the switches that turn features off.",
    href: "/admin/system",
    icon: ServerCog,
    ready: true,
  },
  {
    label: "Audit log",
    description: "Every admin action, with who did it and when.",
    href: "/admin/audit",
    icon: ShieldCheck,
    ready: false,
  },
  {
    label: "Disputes",
    description: "Complaints between clients and businesses.",
    href: "/admin/disputes",
    icon: MessageSquareWarning,
    ready: false,
  },
  {
    label: "Reports",
    description: "How the platform is doing.",
    href: "/admin/reports",
    icon: FileText,
    ready: false,
  },
];

export function AdminSettingsDashboard() {
  const { data, error, isLoading, mutate } = useSWR<PlatformStats>(
    "/api/v1/admin/platform/stats",
    adminFetcher,
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Administration"
        title="Settings"
        description="How the platform runs, and what is waiting on you right now."
      />

      {error ? (
        <div className="mb-4 grid justify-items-start gap-3 rounded-md border border-[var(--color-border)] bg-white p-5">
          <p className="flex items-center gap-2 font-bold text-[var(--color-danger)]">
            <TriangleAlert aria-hidden="true" size={18} />
            {errorMessage(error, "We couldn't load the platform numbers.")}
          </p>
          <Button onClick={() => void mutate()}>Try again</Button>
        </div>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS.map((card) => (
            <SummaryTile
              key={card.key}
              card={card}
              value={data?.[card.key]}
              loading={isLoading}
            />
          ))}
        </div>
      )}

      <AdminPanel title="Sections">
        <ul role="list" className="grid gap-2 md:grid-cols-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const content = (
              <>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <Icon aria-hidden="true" size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {section.label}
                    </span>
                    {section.ready ? null : (
                      <span className="rounded-md bg-[var(--color-warning-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-warning)]">
                        Not built yet
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-[var(--color-text-muted)]">
                    {section.description}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-[var(--color-text-muted)]"
                />
              </>
            );

            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className={`flex h-full items-center gap-3 rounded-md border border-[var(--color-border)] p-4 transition hover:border-[var(--color-brand)] ${
                    section.ready ? "bg-white" : "bg-[var(--color-surface-strong)]"
                  }`}
                >
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      </AdminPanel>
    </div>
  );
}

function SummaryTile({
  card,
  value,
  loading,
}: {
  card: SummaryCard;
  value: number | undefined;
  loading: boolean;
}) {
  const Icon = card.icon;
  // A queue with something in it gets the warning treatment; an empty one
  // is good news and shouldn't shout.
  const needsAttention = card.actionable === true && (value ?? 0) > 0;

  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-full ${
            needsAttention
              ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
              : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
          }`}
        >
          <Icon aria-hidden="true" size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{card.label}</p>
          {loading ? (
            <span
              aria-hidden="true"
              className="mt-1 block h-8 w-14 animate-pulse rounded bg-[var(--color-surface-strong)]"
            />
          ) : (
            <p className="mt-1 text-3xl font-semibold text-[var(--color-text-primary)]">
              {value ?? "—"}
            </p>
          )}
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.detail}</p>
        </div>
      </div>
      {/* One atomic sentence rather than a bare live number, so a screen
          reader announces something meaningful when the count lands. */}
      <span role="status" className="sr-only">
        {loading ? "" : `${value ?? 0} ${card.label.toLowerCase()}`}
      </span>
    </>
  );

  const className = `block rounded-md border bg-white p-4 shadow-[var(--shadow-subtle)] transition ${
    needsAttention ? "border-[var(--color-warning)]" : "border-[var(--color-border)]"
  } ${card.href ? "hover:border-[var(--color-brand)]" : ""}`;

  return card.href ? (
    <Link href={card.href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}
