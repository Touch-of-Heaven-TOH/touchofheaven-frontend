import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Touch of Heaven Beauty & Marketplace.",
};

const values = [
  "Trusted braider discovery with public profiles and reviews",
  "Beauty booking and product shopping in one experience",
  "African culture, care products, and professional craft at the center",
] as const;

export default function AboutPage() {
  return (
    <section className="bg-white">
      <div className="page-container grid gap-8 py-12 md:grid-cols-[0.82fr_1.18fr] md:items-center md:py-16">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--color-brand-strong)]">
            About Touch of Heaven
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-[var(--color-brand-strong)]">
            A beauty and marketplace platform built around trust.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
            Touch of Heaven helps customers discover skilled braiders, book
            appointments with confidence, and shop authentic African products
            before and after every style day.
          </p>
          <div className="mt-6 grid gap-3">
            {values.map((value) => (
              <p
                className="flex items-start gap-2 text-sm font-semibold leading-6 text-[var(--color-brand-strong)]"
                key={value}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--color-success)]"
                  size={17}
                />
                {value}
              </p>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
          <Image
            alt={homeMediaAssets.bookingMarketplace.alt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 56vw"
            src={homeMediaAssets.bookingMarketplace.src}
            style={{ objectPosition: homeMediaAssets.bookingMarketplace.focalPoint }}
          />
        </div>
      </div>
    </section>
  );
}
