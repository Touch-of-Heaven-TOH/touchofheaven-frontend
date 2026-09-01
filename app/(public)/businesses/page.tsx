import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export const metadata: Metadata = {
  title: "Businesses",
  description:
    "Browse verified Touch of Heaven beauty and wellness businesses and open public profiles.",
};

const businesses = [
  ["Royalty Hair Co.", "Knotless braids, boho braids", "Kathleen, GA", "4.9", "128", homeMediaAssets.communitySalon],
  ["Touched by Tee", "Goddess braids, loc care", "Warner Robins, GA", "4.8", "96", homeMediaAssets.studioBooking],
  ["Braids by Nia", "Cornrows, stitch braids", "Macon, GA", "4.9", "142", homeMediaAssets.primaryHero],
  ["Hair by Milly", "Box braids, kids styles", "Atlanta, GA", "4.7", "83", homeMediaAssets.stylePortrait],
] as const;

export default function BusinessesPage() {
  return (
    <section className="bg-white">
      <div className="page-container py-12 md:py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--color-brand-strong)]">
              Businesses
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold leading-tight text-[var(--color-brand-strong)]">
              Verified professionals with clear services, reviews, and booking paths.
            </h1>
          </div>
          <Link className="btn-primary" href="/map">
            Open map
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {businesses.map(([name, specialty, location, rating, reviews, image]) => (
            <article
              className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-subtle)]"
              key={name}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  alt={image.alt}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 92vw, 260px"
                  src={image.src}
                  style={{ objectPosition: image.focalPoint }}
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[var(--color-brand)]">
                  <BadgeCheck aria-hidden="true" className="text-[var(--color-success)]" size={14} />
                  Verified
                </span>
              </div>
              <div className="p-4">
                <h2 className="text-lg font-bold text-[var(--color-brand-strong)]">
                  {name}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {specialty}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <MapPin aria-hidden="true" size={14} />
                  {location}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-strong)]">
                  <Star aria-hidden="true" className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={15} />
                  {rating} ({reviews} reviews)
                </p>
                <Link
                  className="btn-primary mt-4 w-full"
                  href={`/businesses/${name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}`}
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
