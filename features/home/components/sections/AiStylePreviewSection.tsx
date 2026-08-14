import Image from "next/image";
import Link from "next/link";
import { ImageUp, Sparkles } from "lucide-react";
import {
  aiPreviewSteps,
  homePrimaryActions,
} from "@/features/home/config/home-content";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export function AiStylePreviewSection() {
  return (
    <section className="bg-[var(--color-page)] py-6 md:py-8">
      <div className="page-container overflow-hidden rounded-md bg-[var(--color-brand-strong)] text-white shadow-[var(--shadow-media)]">
        <div className="grid gap-6 p-5 md:grid-cols-[0.75fr_1.25fr] md:p-8 lg:p-10">
          <div className="flex flex-col justify-center">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-gold-light)]">
              <Sparkles aria-hidden="true" size={17} />
              AI Style Preview
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight md:text-5xl">
              Try your look before you book.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/72 md:text-base">
              Upload a photo, explore approved style directions, and enter the
              booking flow when you are ready.
            </p>
            <Link className="btn-secondary mt-6 w-fit" href={homePrimaryActions.aiStudio.href}>
              <ImageUp aria-hidden="true" size={18} />
              {homePrimaryActions.aiStudio.label}
            </Link>
          </div>

          <div className="grid gap-5">
            <div className="relative min-h-[250px] overflow-hidden rounded-md border border-white/20 bg-white/8 md:min-h-[320px]">
              <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r border-white">
                <Image
                  alt="Before hairstyle preview"
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 360px"
                  src={homeMediaAssets.naturalHairCare.src}
                  style={{ objectPosition: homeMediaAssets.naturalHairCare.focalPoint }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--color-brand)]">
                  Before
                </span>
              </div>
              <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                <Image
                  alt="After hairstyle preview"
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 360px"
                  src={homeMediaAssets.stylePortrait.src}
                  style={{ objectPosition: homeMediaAssets.stylePortrait.focalPoint }}
                />
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--color-brand)]">
                  After
                </span>
              </div>
              <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-white text-[var(--color-brand)] shadow-[var(--shadow-subtle)]">
                <Sparkles aria-hidden="true" size={18} />
              </span>
            </div>

            <ol className="grid gap-3 md:grid-cols-3">
              {aiPreviewSteps.map((step, index) => (
                <li className="flex items-center gap-3" key={step}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-sm font-bold text-[var(--color-brand-strong)]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-white/82">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
