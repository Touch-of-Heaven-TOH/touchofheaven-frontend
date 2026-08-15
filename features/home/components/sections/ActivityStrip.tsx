import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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
    <section className="border-y border-[var(--color-border)] bg-white py-4">
      <div className="page-container grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-brand-strong)]">
          <Sparkles aria-hidden="true" className="text-[var(--color-copper)]" size={16} />
          Live activity
        </p>

        <div className="overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-page)]">
          <div className="activity-ticker-track flex w-max items-center gap-6 px-4 py-3 text-sm font-semibold text-[var(--color-brand-strong)]">
            {[...visibleActivity, ...visibleActivity].map((item, index) => (
              <span className="inline-flex items-center gap-2" key={`${item.id}-${index}`}>
                <span>{item.label}</span>
                <span className="text-[var(--color-copper)]">★★★★★</span>
                <span className="text-[var(--color-text-muted)]">·</span>
                <span className="text-[var(--color-text-muted)]">{item.detail}</span>
              </span>
            ))}
          </div>
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
