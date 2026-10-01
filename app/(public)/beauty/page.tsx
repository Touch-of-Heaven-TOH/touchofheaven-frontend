import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export const metadata: Metadata = {
  title: "Beauty",
  description:
    "Explore braiding styles, protective looks, and care paths on Touch of Heaven.",
};

const styles = [
  {
    name: "Knotless Braids",
    detail: "Lightweight, flexible braids with clean parting and natural movement.",
    price: "From $220",
    image: homeMediaAssets.primaryHero,
  },
  {
    name: "Boho Braids",
    detail: "Soft curl texture, polished finish, and premium appointment prep.",
    price: "From $260",
    image: homeMediaAssets.communitySalon,
  },
  {
    name: "Cornrows",
    detail: "Defined stitch lines for protective styling and everyday wear.",
    price: "From $120",
    image: homeMediaAssets.braidingDetail,
  },
  {
    name: "Loc Care",
    detail: "Maintenance, retwist, styling, and aftercare support.",
    price: "From $95",
    image: homeMediaAssets.studioBooking,
  },
] as const;

export default function BeautyPage() {
  return (
    <section className="bg-white">
      <div className="page-container grid gap-8 py-12 md:grid-cols-[0.85fr_1.15fr] md:items-center md:py-16">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--color-brand-strong)]">
            Beauty
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-[var(--color-brand-strong)]">
            Find the style that fits your week, your face, and your routine.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
            Browse protective looks, compare appointment expectations, then book
            directly with a verified professional.
          </p>
          <Link className="btn-primary mt-6" href="/explore">
            Find a business
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
          <Image
            alt={homeMediaAssets.communitySalon.alt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 56vw"
            src={homeMediaAssets.communitySalon.src}
            style={{ objectPosition: homeMediaAssets.communitySalon.focalPoint }}
          />
        </div>
      </div>

      <div className="page-container grid gap-4 pb-14 md:grid-cols-4">
        {styles.map((style) => (
          <article
            className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-subtle)]"
            key={style.name}
          >
            <div className="relative aspect-[4/3]">
              <Image
                alt={style.image.alt}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 92vw, 260px"
                src={style.image.src}
                style={{ objectPosition: style.image.focalPoint }}
              />
            </div>
            <div className="p-4">
              <h2 className="text-lg font-bold text-[var(--color-brand-strong)]">
                {style.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {style.detail}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand-strong)]">
                <CheckCircle2 aria-hidden="true" className="text-[var(--color-success)]" size={16} />
                {style.price}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
