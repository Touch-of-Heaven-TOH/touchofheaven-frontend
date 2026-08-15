import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Search, ShieldCheck, SlidersHorizontal, Star } from "lucide-react";
import { brandAssets } from "@/config/site";
import { getHomePageData } from "@/features/home/api/home.queries";

export const metadata: Metadata = {
  title: "Mobile discovery preview",
  robots: {
    index: false,
    follow: false,
  },
};

function BraiderSkeleton() {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="size-12 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
        <span className="grid flex-1 gap-2">
          <span className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
          <span className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
        </span>
      </div>
    </div>
  );
}

export default async function DiscoveryPreviewPage() {
  const homeData = await getHomePageData();
  const braiders = homeData.featuredBraiders.items.slice(0, 3);

  return (
    <main className="min-h-dvh overflow-hidden bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3">
        <div className="relative size-9 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
          <Image
            alt=""
            className="object-contain p-1"
            fill
            sizes="36px"
            src={brandAssets.logoMark}
          />
        </div>
        <p className="text-sm font-bold">Find Braiders</p>
        <button
          aria-label="Filter discovery results"
          className="grid size-9 place-items-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-brand-strong)]"
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={17} />
        </button>
      </header>

      <div className="p-4">
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-muted)]">
          <Search aria-hidden="true" size={16} />
          <span>Braider, style, or service</span>
        </label>
      </div>

      <section className="px-4" aria-label="Map preview">
        <div className="relative h-56 overflow-hidden rounded-md border border-[var(--color-border)] bg-[#e9efe8] shadow-[var(--shadow-subtle)]">
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(30deg,rgba(255,255,255,.76)_1px,transparent_1px),linear-gradient(120deg,rgba(255,255,255,.72)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="absolute left-8 top-16 h-20 w-44 rotate-[-14deg] rounded-full border border-white/80 bg-white/28" />
          <div className="absolute bottom-7 right-7 h-24 w-36 rotate-[18deg] rounded-full border border-white/80 bg-white/28" />
          {[
            "left-[28%] top-[38%]",
            "left-[56%] top-[50%]",
            "left-[70%] top-[28%]",
          ].map((position) => (
            <span
              aria-hidden="true"
              className={`absolute ${position} grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--color-brand)] text-white shadow-lg ring-4 ring-white/80`}
              key={position}
            >
              <MapPin size={17} />
            </span>
          ))}
          <div className="absolute bottom-3 left-3 right-3 rounded-md bg-white/92 p-3 shadow-[var(--shadow-subtle)] backdrop-blur">
            <p className="flex items-center gap-2 text-xs font-bold text-[var(--color-brand-strong)]">
              <ShieldCheck aria-hidden="true" size={15} />
              Discovery feed uses verified braider data when available.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 p-4" aria-label="Nearby braiders">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl font-semibold text-[var(--color-brand-strong)]">
            Top Braiders Near You
          </h1>
          <span className="text-xs font-bold text-[var(--color-brand)]">Map</span>
        </div>

        {homeData.featuredBraiders.status === "ready" ? (
          braiders.map((braider) => (
            <article
              className="rounded-md border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-subtle)]"
              key={braider.id}
            >
              <div className="flex gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
                  {braider.image ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="56px"
                      src={braider.image.src}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-[var(--color-brand-strong)]">
                    {braider.name}
                  </h2>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {braider.specialty}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    <Star
                      aria-hidden="true"
                      className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                      size={13}
                    />
                    {braider.ratingAverage?.toFixed(1) ?? "New"} ({braider.ratingCount})
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <>
            <div className="rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-xs font-semibold text-[var(--color-warning)]">
              Braider discovery data is pending from the public homepage feed.
            </div>
            <BraiderSkeleton />
            <BraiderSkeleton />
            <BraiderSkeleton />
          </>
        )}
      </section>
    </main>
  );
}
