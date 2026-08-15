import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Star } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";
import type {
  DynamicSection,
  PublicHomeBraider,
} from "@/features/home/types/home.types";

type TopBraidersSectionProps = {
  braiders: DynamicSection<PublicHomeBraider>;
};

const fallbackBraiders = [
  {
    id: "royalty-hair-co",
    name: "Royalty Hair Co.",
    specialty: "Knotless braids, boho braids",
    location: "Kathleen, GA · 1.8 mi",
    href: "/braiders/royalty-hair-co",
    image: homeMediaAssets.communitySalon,
    ratingAverage: 4.9,
    ratingCount: 128,
  },
  {
    id: "touched-by-tee",
    name: "Touched by Tee",
    specialty: "Goddess braids, loc care",
    location: "Warner Robins, GA · 3.2 mi",
    href: "/braiders/touched-by-tee",
    image: homeMediaAssets.studioBooking,
    ratingAverage: 4.8,
    ratingCount: 96,
  },
  {
    id: "braids-by-nia",
    name: "Braids by Nia",
    specialty: "Cornrows, stitch braids",
    location: "Macon, GA · 8.4 mi",
    href: "/braiders/braids-by-nia",
    image: homeMediaAssets.primaryHero,
    ratingAverage: 4.9,
    ratingCount: 142,
  },
  {
    id: "hair-by-milly",
    name: "Hair by Milly",
    specialty: "Box braids, kids styles",
    location: "Atlanta, GA · 22 mi",
    href: "/braiders/hair-by-milly",
    image: homeMediaAssets.stylePortrait,
    ratingAverage: 4.7,
    ratingCount: 83,
  },
] satisfies PublicHomeBraider[];

export function TopBraidersSection({ braiders }: TopBraidersSectionProps) {
  const visibleBraiders =
    braiders.status === "ready" ? braiders.items.slice(0, 4) : fallbackBraiders;

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

        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {visibleBraiders.map((braider) => (
            <article
              className="w-[78vw] max-w-[310px] shrink-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] md:w-auto md:max-w-none"
              key={braider.id}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-brand-soft)]">
                {braider.image ? (
                  <Image
                    alt={braider.image.alt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 78vw, 260px"
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
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[var(--color-brand)] shadow-sm">
                  <BadgeCheck aria-hidden="true" className="text-[var(--color-success)]" size={14} />
                  Verified
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[var(--color-brand-strong)]">
                  {braider.name}
                </h3>
                <p className="mt-1 min-h-10 text-sm leading-5 text-[var(--color-text-muted)]">
                  {braider.specialty}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <MapPin aria-hidden="true" size={14} />
                  {braider.location}
                </p>
                {braider.ratingAverage ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-strong)]">
                    <Star
                      aria-hidden="true"
                      className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                      size={15}
                    />
                    {braider.ratingAverage.toFixed(1)} ({braider.ratingCount} reviews)
                  </p>
                ) : null}
                <Link
                  aria-label={`View ${braider.name} braider profile`}
                  className="btn-primary mt-4 w-full"
                  href={braider.href}
                >
                  View Profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
