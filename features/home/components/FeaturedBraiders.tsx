"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useState } from "react";
import { featureShowcaseSlides } from "@/features/home/config/showcase-slide";

export function FeatureShowcaseSection() {
  const [index, setIndex] = useState(0);
  const total = featureShowcaseSlides.length;
  const current = featureShowcaseSlides[index];
  const next = featureShowcaseSlides[(index + 1) % total];

  const goNext = () => setIndex((i) => (i + 1) % total);

  return (
    <section className="bg-[var(--color-page)] py-7 md:py-10">
      <div className="page-container">
        <div className="overflow-hidden rounded-md bg-[var(--color-surface-strong)] text-[var(--color-brand-strong)] shadow-[var(--shadow-media)]">
          {/* Static heading — same across every slide */}
          <div className="p-5 text-center md:p-8 lg:p-10 lg:pb-0">
            <h2 className="mx-auto max-w-3xl font-serif text-3xl font-semibold italic leading-tight md:text-5xl">
              The all-in-one platform for hair braiding, booked and stocked.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
              Everything a braider or a customer needs — booking, payments, AI
              style previews, marketplace shopping, and marketing — in one app.
            </p>
          </div>

          <div className="grid gap-6 px-5 py-8 md:grid-cols-[0.85fr_1.1fr_0.85fr] md:items-center md:px-8 md:py-10 lg:px-10 lg:py-12">
            {/* Current feature — full color, left */}
            <div>
              <h3 className="text-xl font-bold md:text-2xl">{current.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
                {current.description}
              </p>
              <Link href={current.ctaHref} className="btn-secondary mt-5 w-fit">
                {current.ctaLabel}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>

            {/* Image — center */}
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-md border border-[var(--color-border)] bg-white">
              <Image
                src={current.image}
                alt={current.alt}
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-contain p-4"
              />
            </div>

            {/* Next feature — faded teaser, right */}
            <div className="relative min-h-[140px]">
              <h3 className="text-xl font-bold text-[var(--color-brand-strong)]/30 md:text-2xl">
                {next.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]/60 md:text-base">
                {next.description}
              </p>
              <button
                type="button"
                onClick={goNext}
                aria-label={`Show next feature: ${next.title}`}
                className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black text-white shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition hover:scale-105"
              >
                <ChevronRight aria-hidden="true" size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}