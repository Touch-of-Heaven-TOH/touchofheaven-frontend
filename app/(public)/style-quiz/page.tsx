import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export const metadata: Metadata = {
  title: "Style quiz",
  description:
    "Answer a guided style quiz before choosing a Touch of Heaven braiding service.",
};

const quizSignals = [
  "Face shape and hair goals",
  "Maintenance preferences",
  "Appointment timing and lifestyle",
] as const;

export default function StyleQuizPage() {
  return (
    <section className="page-container grid gap-8 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
          <BrainCircuit aria-hidden="true" size={17} />
          Style Quiz
        </p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-6xl">
          Find a style direction before you book.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          The quiz experience will become interactive once the recommendation
          endpoint is approved. Until then, customers can browse style
          categories and start a secure booking journey.
        </p>
        <ul className="mt-6 grid gap-3">
          {quizSignals.map((signal) => (
            <li className="flex items-center gap-3 text-sm font-semibold" key={signal}>
              <CheckCircle2 aria-hidden="true" className="text-[var(--color-success)]" size={18} />
              {signal}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/beauty">
            Browse styles
          </Link>
          <Link className="btn-secondary" href="/book">
            Book a consultation
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-brand-soft)] shadow-[var(--shadow-soft)]">
        <Image
          alt={homeMediaAssets.studioBooking.alt}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 46vw"
          src={homeMediaAssets.studioBooking.src}
          style={{ objectPosition: homeMediaAssets.studioBooking.focalPoint }}
        />
      </div>
    </section>
  );
}
