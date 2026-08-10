import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Sparkles } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";
import { appPromoFeatures, homePrimaryActions } from "@/features/home/config/home-content";

export function StyleQuizBanner() {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="page-container overflow-hidden rounded-md bg-[var(--color-brand-strong)] text-white shadow-[var(--shadow-media)]">
        <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr] md:items-center md:p-8 lg:grid-cols-[240px_1fr_320px]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white/10">
            <Image
              alt={homeMediaAssets.stylePortrait.alt}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 80vw, (max-width: 1024px) 220px, 240px"
              src={homeMediaAssets.stylePortrait.src}
              style={{ objectPosition: homeMediaAssets.stylePortrait.focalPoint }}
            />
          </div>

          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-gold-light)]">
              <BrainCircuit aria-hidden="true" size={18} />
              Personalized style match
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
              Not sure which style fits your face shape?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 md:text-base">
              Take the guided style quiz and use your result to begin a more
              confident booking journey.
            </p>
            <Link className="btn-secondary mt-6 w-fit" href={homePrimaryActions.styleQuiz.href}>
              {homePrimaryActions.styleQuiz.label}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>

          <ul className="grid gap-3 rounded-md border border-white/12 bg-white/6 p-4 md:col-span-2 lg:col-span-1">
            {appPromoFeatures.map((feature) => (
              <li className="flex items-center gap-3 text-sm font-semibold" key={feature}>
                <Sparkles aria-hidden="true" className="text-[var(--color-gold-light)]" size={17} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
