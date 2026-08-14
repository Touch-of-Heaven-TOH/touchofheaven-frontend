import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { DynamicStatusPanel } from "@/features/home/components/sections/DynamicStatusPanel";
import type {
  DynamicSection,
  PublicHomeBraider,
} from "@/features/home/types/home.types";

type TopBraidersSectionProps = {
  braiders: DynamicSection<PublicHomeBraider>;
};

export function TopBraidersSection({ braiders }: TopBraidersSectionProps) {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
              Top Braiders Near You
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[var(--color-brand-strong)] md:text-4xl">
              Skilled, trusted, reviewed by the community.
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
            href="/braiders"
          >
            View all braiders
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        {braiders.status === "ready" ? (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {braiders.items.slice(0, 4).map((braider) => (
              <article
                className="w-[78vw] max-w-[290px] shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3 md:w-auto md:max-w-none"
                key={braider.id}
              >
                <Link
                  aria-label={`View ${braider.name} braider profile`}
                  className="block h-full"
                  href={braider.href}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
                    {braider.image ? (
                      <Image
                        alt={braider.image.alt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 76vw, 260px"
                        src={braider.image.src}
                        style={{ objectPosition: braider.image.focalPoint }}
                      />
                    ) : (
                      <span className="grid h-full place-items-center p-4 text-center">
                        <span className="grid size-16 place-items-center rounded-full bg-white text-3xl font-bold text-[var(--color-brand)]">
                          {braider.name.charAt(0)}
                        </span>
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[var(--color-brand-strong)]">
                    {braider.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {braider.specialty}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <MapPin aria-hidden="true" size={14} />
                    {braider.location}
                  </p>
                  {braider.ratingAverage ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-copper)]">
                      <Star aria-hidden="true" size={15} />
                      {braider.ratingAverage.toFixed(1)} ({braider.ratingCount})
                    </p>
                  ) : null}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <DynamicStatusPanel
            actionHref="/map"
            actionLabel="Open discovery map"
            message={braiders.message}
            title="Featured braider feed pending"
          />
        )}
      </div>
    </section>
  );
}
