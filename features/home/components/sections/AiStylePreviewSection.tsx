import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageUp, Sparkles } from "lucide-react";
import {
  aiPreviewSteps,
  homePrimaryActions,
} from "@/features/home/config/home-content";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export function AiStylePreviewSection() {
  return (
    <section className="bg-[var(--color-page)] py-7 md:py-10">
      <div className="page-container">
        <div className="overflow-hidden rounded-md bg-[radial-gradient(circle_at_86%_18%,rgba(211,160,74,0.24),transparent_30%),linear-gradient(135deg,#230c2f_0%,#381149_48%,#16081f_100%)] text-white shadow-[var(--shadow-media)]">
          <div className="grid gap-7 p-5 md:grid-cols-[1fr_1.05fr] md:items-center md:p-8 lg:p-10">
            <div className="relative min-h-[300px] overflow-hidden rounded-md border border-white/20 bg-white/8 md:min-h-[340px]">
              <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r border-white">
                <Image
                  alt="Before AI style preview with natural hair"
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 420px"
                  src={homeMediaAssets.bookingMarketplace.src}
                  style={{ objectPosition: "57% center" }}
                />
                <span className="absolute bottom-3 left-3 rounded-sm bg-black/55 px-3 py-1 text-xs font-bold">
                  Before
                </span>
              </div>
              <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                <Image
                  alt="After AI style preview with polished braids"
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 420px"
                  src={homeMediaAssets.primaryHero.src}
                  style={{ objectPosition: "62% center" }}
                />
                <span className="absolute bottom-3 right-3 rounded-sm bg-black/55 px-3 py-1 text-xs font-bold">
                  After
                </span>
              </div>
              <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-white text-[var(--color-brand)] shadow-[var(--shadow-subtle)]">
                <Sparkles aria-hidden="true" size={18} />
              </span>
            </div>

            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-gold-light)]">
                <Sparkles aria-hidden="true" size={17} />
                AI Style Preview
              </p>
              <h2 className="mt-4 max-w-xl font-serif text-3xl font-semibold leading-tight md:text-5xl">
                Try your look before you book.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/76 md:text-base">
                Upload a photo, explore approved style directions, and find the
                perfect look before choosing a braider.
              </p>

              <ol className="mt-6 grid gap-3 md:grid-cols-3">
                {aiPreviewSteps.map((step, index) => (
                  <li className="flex items-center gap-3" key={step}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-sm font-bold text-[var(--color-brand-strong)]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white/84">{step}</span>
                  </li>
                ))}
              </ol>

              <Link
                className="btn-secondary mt-6 w-fit"
                href={homePrimaryActions.aiStudio.href}
              >
                <ImageUp aria-hidden="true" size={18} />
                {homePrimaryActions.aiStudio.label}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
