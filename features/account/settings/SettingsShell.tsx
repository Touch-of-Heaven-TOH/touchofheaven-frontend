"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SETTINGS_SECTIONS, type SettingsSectionKey } from "@/features/account/settings/sections";

/**
 * The frame every client settings screen sits in: a breadcrumb, the list
 * of sections, and the section itself. On a phone the list becomes a row
 * of chips that scrolls sideways, so the content starts near the top of
 * the screen instead of below a tall menu.
 */
export function SettingsShell({
  current,
  title,
  description,
  children,
}: {
  /** Left out on the hub itself, where no single section is open. */
  current?: SettingsSectionKey;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-text-muted)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/account">
              Account
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          <li>
            <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/account/settings">
              Settings
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          <li aria-current="page" className="text-[var(--color-text-primary)]">
            {title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <SettingsNav current={current} />
        <section className="min-w-0">
          <header className="mb-5">
            <h1 className="font-serif text-3xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-[var(--color-text-muted)]">{description}</p>
            ) : null}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}

function SettingsNav({ current }: { current?: SettingsSectionKey }) {
  return (
    <nav
      aria-label="Settings sections"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:sticky lg:top-6 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul role="list" className="flex min-w-max gap-2 pb-1 lg:min-w-0 lg:flex-col lg:gap-1 lg:pb-0">
        {SETTINGS_SECTIONS.map((section) => {
          const active = section.key === current;
          const Icon = section.icon;
          return (
            <li key={section.key}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex min-h-11 w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--color-brand)] text-white"
                    : section.destructive
                      ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]",
                ].join(" ")}
              >
                <Icon aria-hidden="true" size={17} />
                {section.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
