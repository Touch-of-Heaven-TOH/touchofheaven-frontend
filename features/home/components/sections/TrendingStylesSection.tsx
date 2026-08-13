import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import {
  trendingStyleIntro,
  trendingStyles,
} from "@/features/home/config/home-content";
import { MediaCard } from "@/features/home/components/sections/MediaCard";
import { SectionHeading } from "@/features/home/components/sections/SectionHeading";

export function TrendingStylesSection() {
  return (
    <section className="bg-[var(--color-page)] py-8 md:py-10">
      <div className="page-container">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-stretch">
          <aside className="rounded-md border border-[var(--color-border)] bg-white p-5">
            <SectionHeading intro={trendingStyleIntro} />
            <Link className="btn-primary mt-6 w-full" href="/book">
              <CalendarCheck aria-hidden="true" size={18} />
              Start booking
            </Link>
          </aside>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {trendingStyles.map((style) => (
              <div className="w-[74vw] max-w-[280px] shrink-0 md:w-auto md:max-w-none" key={style.title}>
                <MediaCard card={style} ratio="landscape" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
