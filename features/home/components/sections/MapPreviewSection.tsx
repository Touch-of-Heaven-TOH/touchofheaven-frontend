import Link from "next/link";
import { LocateFixed, MapPin } from "lucide-react";

const markerPositions = [
  { left: "32%", top: "38%" },
  { left: "54%", top: "58%" },
  { left: "70%", top: "34%" },
  { left: "82%", top: "68%" },
] as const;

export function MapPreviewSection() {
  return (
    <section className="bg-[var(--color-page)] py-8 md:py-10">
      <div className="page-container grid overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] md:grid-cols-[320px_1fr]">
        <div className="p-5 md:p-7">
          <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
            Near You
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)]">
            Find braiders near you
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Open the discovery map to use your location, filters, and verified
            public profiles.
          </p>
          <div className="mt-5 grid gap-2">
            <Link className="btn-primary" href="/map">
              <LocateFixed aria-hidden="true" size={18} />
              Use My Location
            </Link>
            <Link className="btn-secondary" href="/braiders">
              Browse all braiders
            </Link>
          </div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden bg-[var(--color-sage-soft)]">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-0 top-1/3 h-px w-full bg-[var(--color-border)]" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-[var(--color-border)]" />
            <div className="absolute left-1/4 top-0 h-full w-px bg-[var(--color-border)]" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--color-border)]" />
            <div className="absolute left-3/4 top-0 h-full w-px bg-[var(--color-border)]" />
            <div className="absolute left-[8%] top-[58%] h-16 w-[120%] -rotate-12 rounded-full border-t-4 border-[var(--color-gold-light)]" />
            <div className="absolute left-[-10%] top-[22%] h-20 w-[140%] rotate-6 rounded-full border-t-4 border-white" />
          </div>
          {markerPositions.map((position, index) => (
            <span
              aria-hidden="true"
              className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[var(--color-brand)] shadow-[var(--shadow-soft)]"
              key={`${position.left}-${position.top}`}
              style={position}
            >
              <MapPin fill="currentColor" size={20} />
              <span className="sr-only">Braider marker {index + 1}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
