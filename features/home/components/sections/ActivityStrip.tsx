import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import type { DynamicSection, PublicHomeActivity } from "@/features/home/types/home.types";
import { DynamicStatusPanel } from "@/features/home/components/sections/DynamicStatusPanel";

type ActivityStripProps = {
  activity: DynamicSection<PublicHomeActivity>;
};

export function ActivityStrip({ activity }: ActivityStripProps) {
  return (
    <section className="border-y border-[var(--color-border)] bg-white">
      <div className="page-container grid gap-4 py-5 lg:grid-cols-[170px_1fr_auto] lg:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-[var(--color-copper-soft)] text-[var(--color-copper)]">
            <HeartHandshake aria-hidden="true" size={21} />
          </span>
          <div>
            <p className="font-serif text-xl font-semibold text-[var(--color-brand-strong)]">
              What&apos;s happening
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Public community updates
            </p>
          </div>
        </div>

        {activity.status === "ready" ? (
          <div className="grid gap-3 md:grid-cols-3">
            {activity.items.slice(0, 3).map((item) => (
              <article
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3"
                key={item.id}
              >
                <h2 className="text-sm font-bold text-[var(--color-brand-strong)]">
                  {item.label}
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <DynamicStatusPanel
            actionHref="/braiders"
            actionLabel="Browse braiders"
            message={activity.message}
            title="Live activity feed pending"
          />
        )}

        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
          href="/braiders"
        >
          View all activity
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </section>
  );
}
