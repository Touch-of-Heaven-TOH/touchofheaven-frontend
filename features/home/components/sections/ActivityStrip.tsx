import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import type { DynamicSection, PublicHomeActivity } from "@/features/home/types/home.types";

type ActivityStripProps = {
  activity: DynamicSection<PublicHomeActivity>;
};

const fallbackActivity = [
  {
    id: "fallback-booking-knotless",
    label: "Jasmine booked Knotless Braids",
    detail: "Royalty Hair Co. accepted a 3:30 PM appointment in Kathleen.",
    occurredAt: "2 min ago",
  },
  {
    id: "fallback-product-aftercare",
    label: "Aftercare bundle added",
    detail: "A customer paired shea butter and chebe oil with a new style.",
    occurredAt: "8 min ago",
  },
  {
    id: "fallback-profile-review",
    label: "New 5-star profile review",
    detail: "Clean parts, gentle styling, and clear appointment reminders.",
    occurredAt: "14 min ago",
  },
] satisfies PublicHomeActivity[];

export function ActivityStrip({ activity }: ActivityStripProps) {
  const visibleActivity =
    activity.status === "ready" ? activity.items.slice(0, 3) : fallbackActivity;

  return (
    <section className="border-y border-[var(--color-border)] bg-white">
      <div className="page-container grid gap-4 py-5 lg:grid-cols-[190px_1fr_auto] lg:items-center">
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

        <div className="grid gap-3 md:grid-cols-3">
          {visibleActivity.map((item) => (
            <article
              className="min-h-24 rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3"
              key={item.id}
            >
              <h2 className="text-sm font-bold text-[var(--color-brand-strong)]">
                {item.label}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                {item.detail}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase text-[var(--color-copper)]">
                {item.occurredAt}
              </p>
            </article>
          ))}
        </div>

        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
          href="/braiders"
        >
          View all activity
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </section>
  );
}
