import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Star } from "lucide-react";
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
    image: undefined,
    ratingAverage: 4.9,
    ratingCount: 128,
  },
  {
    id: "touched-by-tee",
    name: "Touched by Tee",
    specialty: "Goddess braids, loc care",
    location: "Warner Robins, GA · 3.2 mi",
    href: "/braiders/touched-by-tee",
    image: undefined,
    ratingAverage: 4.8,
    ratingCount: 96,
  },
  {
    id: "braids-by-nia",
    name: "Braids by Nia",
    specialty: "Cornrows, stitch braids",
    location: "Macon, GA · 8.4 mi",
    href: "/braiders/braids-by-nia",
    image: undefined,
    ratingAverage: 4.9,
    ratingCount: 142,
  },
  {
    id: "hair-by-milly",
    name: "Hair by Milly",
    specialty: "Box braids, kids styles",
    location: "Atlanta, GA · 22 mi",
    href: "/braiders/hair-by-milly",
    image: undefined,
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
        <div className="relative">
          <Link
            aria-label="Browse all braiders on the platform"
            className="absolute right-0 top-1/2 z-10 hidden size-10 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-brand)] shadow-[var(--shadow-subtle)] transition hover:bg-[var(--color-brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] md:grid"
            href="/braiders"
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </Link>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {visibleBraiders.map((braider) => (
            <Link
              className="w-[78vw] max-w-[310px] shrink-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] md:w-auto md:max-w-none"
              href={braider.href}
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

              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
