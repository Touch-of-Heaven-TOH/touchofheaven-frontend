import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";

export type ComingSoonLink = { label: string; href: string };

/**
 * A Studio page whose feature is not built yet. It says so plainly, explains
 * what the page will do, and points to what the business can use today, so
 * a navigation item never leads to a dead end or a 404.
 */
export function ComingSoon({
  title,
  icon: Icon = Sparkles,
  description,
  plannedItems,
  alternatives = [],
}: {
  title: string;
  icon?: LucideIcon;
  description: string;
  plannedItems: string[];
  alternatives?: ComingSoonLink[];
}) {
  return (
    <div className="grid gap-6">
      <header className="flex items-start gap-3">
        <Icon aria-hidden="true" strokeWidth={1.5} className="mt-1.5 size-7 shrink-0 text-[var(--color-gold)] sm:size-8" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] leading-tight text-[var(--color-text-primary)] sm:text-[34px]">
              {title}
            </h1>
            <span className="rounded-md bg-[var(--color-gold-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-gold-text,#8f5a1d)]">
              Coming soon
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-[15px] text-[var(--color-text-muted)]">{description}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
          <h2 className="font-display text-xl">What this page will do</h2>
          <ul className="mt-4 grid gap-3">
            {plannedItems.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] text-[var(--color-text-primary)]">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {alternatives.length > 0 ? (
          <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
            <h2 className="font-display text-xl">Available now</h2>
            <ul className="mt-3 grid gap-1">
              {alternatives.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 text-[15px] text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
                  >
                    {link.label}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
