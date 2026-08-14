import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageUp, ShieldCheck, Sparkles } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export const metadata: Metadata = {
  title: "AI style preview",
  description:
    "Preview hairstyle directions before starting a secure Touch of Heaven booking.",
};

export default function AiStudioPage() {
  return (
    <section className="page-container grid gap-8 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-20">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
          <Sparkles aria-hidden="true" size={17} />
          AI Studio
        </p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-6xl">
          Preview your next look with confidence.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          This public preview page introduces the AI-assisted style workflow.
          Photo upload, consent, and generated previews must use approved
          backend media endpoints before production activation.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/book">
            <ImageUp aria-hidden="true" size={18} />
            Start with booking
          </Link>
          <Link className="btn-secondary" href="/beauty">
            Browse styles
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
          <ShieldCheck aria-hidden="true" size={17} />
          Private photo handling remains backend-authorized.
        </p>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-brand-soft)] shadow-[var(--shadow-soft)]">
        <Image
          alt={homeMediaAssets.stylePortrait.alt}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 48vw"
          src={homeMediaAssets.stylePortrait.src}
          style={{ objectPosition: homeMediaAssets.stylePortrait.focalPoint }}
        />
      </div>
    </section>
  );
}
