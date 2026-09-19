"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, CircleAlert, MapPinned, RotateCw, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ClientShell, classNames } from "@/features/discovery/DiscoveryShell";
import {
  ProviderAvatar,
  ProviderCardSkeleton,
  ProviderGridCard,
} from "@/features/discovery/ProviderCards";
import { SearchCard } from "@/features/discovery/SearchCard";
import { discoveryCategories, type DiscoveryCategory } from "@/features/discovery/categories";
import {
  bookingHref,
  formatNextOpening,
  mainServiceType,
  type NearbyProvider,
} from "@/features/discovery/nearby";
import { useNearbyProviders, type NearbySearch } from "@/features/discovery/useNearbyProviders";
import { useSearchOrigin } from "@/features/discovery/useSearchOrigin";

/*
 * The Explore landing page (/explore). The category tiles are fixed
 * navigation; everything about businesses comes from the backend's nearby
 * search around the visitor (or the default city when their location
 * isn't shared). Until September 2026 the two provider rows here showed the
 * sample records from discovery-data.ts.
 */

// Wide enough to cover a whole city from wherever the visitor stands.
const EXPLORE_RADIUS_KM = 25;
const ROW_SIZE = 4;

function CategoryImage({ category }: { category: DiscoveryCategory }) {
  return (
    <div className="relative h-32 w-full overflow-hidden bg-[var(--color-brand-soft)]">
      <Image
        alt={category.image.alt}
        className="object-cover"
        fill
        sizes="(max-width: 768px) 45vw, 24vw"
        src={category.image.src}
        style={{ objectPosition: category.image.position ?? "center" }}
      />
    </div>
  );
}

function SectionHeading({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-serif text-2xl font-semibold text-[var(--color-text-primary)] md:text-3xl">{title}</h2>
      <Link
        href={href}
        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-semibold text-[var(--color-brand)]"
      >
        {cta}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

function OpeningRow({ provider }: { provider: NearbyProvider }) {
  return (
    <li>
      <Link
        href={bookingHref(provider)}
        className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)]"
      >
        <ProviderAvatar provider={provider} className="h-16 w-16 rounded-[var(--radius-control)] text-lg" />
        <span className="grid min-w-0 gap-1">
          <span className="truncate font-semibold">{provider.professionalName}</span>
          <span className="truncate text-sm text-[var(--color-text-muted)]">{mainServiceType(provider)}</span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-brand)] px-2 py-0.5 text-xs font-bold text-[var(--color-brand)]">
            <Calendar size={13} aria-hidden="true" />
            {formatNextOpening(provider.nextAvailableSlotAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function SafetyBanner() {
  return (
    <section className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 sm:flex-row sm:items-center">
        <ShieldCheck className="shrink-0 text-[var(--color-gold)]" size={38} aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Every business here is verified before it can be booked.</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Pay your deposit on Touch of Heaven so the booking policy and refund rules apply.{" "}
            <Link href="/legal/booking-policy" className="font-semibold text-[var(--color-brand)] hover:underline">
              Read the booking policy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function ExploreDiscoveryPage() {
  const origin = useSearchOrigin();
  const search = useMemo<NearbySearch | null>(
    () =>
      origin
        ? { center: origin.coordinates, radiusKm: EXPLORE_RADIUS_KM, locationType: null, acceptingNewClients: false }
        : null,
    [origin],
  );
  const nearby = useNearbyProviders(search);
  const providers = useMemo(() => (nearby.error ? [] : nearby.providers), [nearby.error, nearby.providers]);

  // Best-rated first, then nearest: the backend already returns them by distance.
  const recommended = useMemo(
    () =>
      [...providers]
        .sort((a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.rating.count - a.rating.count)
        .slice(0, ROW_SIZE),
    [providers],
  );
  const openingSoon = useMemo(
    () =>
      providers
        .filter((provider) => provider.nextAvailableSlotBucket === "TODAY" || provider.nextAvailableSlotBucket === "THIS_WEEK")
        .sort((a, b) => new Date(a.nextAvailableSlotAt ?? 0).getTime() - new Date(b.nextAvailableSlotAt ?? 0).getTime())
        .slice(0, ROW_SIZE),
    [providers],
  );

  const where = origin ? origin.label : "you";
  const loading = !origin || (nearby.isLoading && providers.length === 0);

  return (
    <ClientShell>
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="absolute inset-y-0 right-0 hidden w-[54%] md:block">
          <div className="relative h-full w-full">
            <Image
              alt="A Touch of Heaven professional preparing for a beauty appointment."
              className="object-cover"
              fill
              priority
              sizes="55vw"
              src="/images/home/images/booking-marketplace-lifestyle.png"
              style={{ objectPosition: "72% center" }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-page)] via-[var(--color-page)]/72 to-transparent" />
        </div>
        <div className="relative mx-auto grid min-h-[440px] gap-7 px-4 py-10 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14">
          <div className="flex max-w-xl flex-col justify-center">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Find beauty and wellness, your way
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--color-text-muted)]">
              Discover verified professionals near you and book with confidence.
            </p>
          </div>
          <div className="self-center md:pt-20">
            <SearchCard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10" aria-label="Browse by category">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {discoveryCategories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <CategoryImage category={category} />
              <div className="flex min-h-16 items-center gap-3 px-5">
                <Sparkles className="text-[var(--color-gold)]" size={28} aria-hidden="true" />
                <span className="text-lg font-semibold text-[var(--color-text-primary)]">{category.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-10">
        <SectionHeading title={`Recommended near ${where}`} href="/businesses" cta="See all" />
        <div className="mt-5" aria-live="polite">
          {nearby.error ? (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 sm:flex-row sm:items-center">
              <CircleAlert className="shrink-0 text-[var(--color-danger)]" size={24} aria-hidden="true" />
              <p className="flex-1 font-semibold">Could not load providers</p>
              <button
                type="button"
                onClick={nearby.retry}
                disabled={nearby.isFetching}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 text-sm font-bold text-white disabled:opacity-80"
              >
                <RotateCw size={16} aria-hidden="true" className={nearby.isFetching ? "animate-spin" : undefined} />
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading providers">
              {Array.from({ length: ROW_SIZE }, (_, index) => (
                <ProviderCardSkeleton key={index} layout="grid" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] bg-white p-5 sm:flex-row sm:items-center">
              <MapPinned className="shrink-0 text-[var(--color-brand)]" size={24} aria-hidden="true" />
              <p className="flex-1">
                <span className="font-semibold">No verified businesses within {EXPLORE_RADIUS_KM} km of {where} yet.</span>{" "}
                <span className="text-[var(--color-text-muted)]">The map can search a wider area or another city.</span>
              </p>
              <Link
                href="/explore/map"
                className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 text-sm font-bold text-white"
              >
                Open the map
              </Link>
            </div>
          ) : (
            <ul role="list" className={classNames("grid gap-5 md:grid-cols-2", recommended.length > 2 && "xl:grid-cols-4")}>
              {recommended.map((provider) => (
                <li key={provider.id}>
                  <ProviderGridCard provider={provider} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {!loading && !nearby.error && providers.length > 0 ? (
        <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-10">
          <SectionHeading title="Opening this week" href="/explore/map" cta="Open the map" />
          {openingSoon.length ? (
            <ul role="list" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {openingSoon.map((provider) => (
                <OpeningRow key={provider.id} provider={provider} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[var(--color-text-muted)]">
              No openings this week near {where}. Each business&apos;s calendar shows later dates.
            </p>
          )}
        </section>
      ) : null}

      <SafetyBanner />
    </ClientShell>
  );
}
