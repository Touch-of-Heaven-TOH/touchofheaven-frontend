"use client";

import { ArrowRight, CalendarDays, MapPin, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { PlatformSearch } from "@/components/search/PlatformSearch";
import { ClientShell } from "@/features/discovery/DiscoveryShell";
import {
  CLIENT_HOME_KEY,
  clientHomeFetcher,
  professionalHref,
  type ClientHome as ClientHomeData,
  type HomeCategory,
  type HomeProfessional,
} from "@/features/client-home/api";
import { CategoryGrid } from "@/features/client-home/CategoryGrid";
import {
  ProfessionalCard,
  ProfessionalRow,
} from "@/features/client-home/ProfessionalCards";

/**
 * The client home: the first screen after signing in.
 *
 * One request answers the whole page, so the sections below are slices of
 * a single truthful payload rather than seven independent guesses. Where
 * the platform has nothing - a new client with no history, a day with no
 * free slot - the section says so plainly instead of filling the space
 * with something invented.
 *
 * Desktop and mobile are one tree. They differ by CSS except where the
 * interaction genuinely differs: the recommendation strip is a snapping
 * carousel on a phone and a grid on a wide screen.
 */

export function ClientHome() {
  const { data, error, isLoading, mutate } = useSWR<ClientHomeData>(
    CLIENT_HOME_KEY,
    clientHomeFetcher,
  );

  return (
    <ClientShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-10">
        {error ? (
          <div className="my-8 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-6">
            <h1 className="font-serif text-2xl font-semibold">
              We couldn&apos;t load your home
            </h1>
            <p className="mt-2 text-[var(--color-text-muted)]">
              Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => void mutate()}
              className="btn-primary mt-4 inline-flex min-h-11"
            >
              Try again
            </button>
          </div>
        ) : (
          <HomeBody data={data} loading={isLoading} onRetry={() => void mutate()} />
        )}
      </div>
    </ClientShell>
  );
}

function HomeBody({
  data,
  loading,
  onRetry,
}: {
  data: ClientHomeData | undefined;
  loading: boolean;
  onRetry: () => void;
}) {
  const city = data ? `${data.location.city}, ${data.location.region}` : "";

  // Everyone the payload knows about, each person once.
  const everyone = useMemo(() => {
    const seen = new Map<string, HomeProfessional>();
    for (const item of [...(data?.recommendations ?? []), ...(data?.nearby ?? [])]) {
      if (!seen.has(item.id)) seen.set(item.id, item);
    }
    return [...seen.values()];
  }, [data]);

  const newProfessionals = useMemo(
    () => everyone.filter((item) => item.rating.count === 0).slice(0, 8),
    [everyone],
  );

  const categoryRails = useMemo(
    () =>
      (data?.categories ?? [])
        .filter((category) => BUSINESS_TYPE_SLUGS.includes(category.slug))
        .map((category) => ({
          category,
          items: everyone.filter((item) => inCategory(item, category)).slice(0, 8),
        }))
        .filter(({ items }) => items.length > 0),
    [data, everyone],
  );

  return (
    <div className="grid gap-8 py-6 lg:py-8">
      <Hero city={city} loading={loading} />

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="sr-only">
          Browse by category
        </h2>
        {loading ? (
          <TileSkeleton />
        ) : (
          <CategoryGrid
            categories={data?.categories ?? []}
            failed={data?.categoriesFailed ?? false}
            onRetry={onRetry}
            limit={8}
          />
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="grid min-w-0 gap-8">
          {data && data.recentlyViewed.length > 0 ? (
            <RecentlyViewed data={data} />
          ) : null}

          <Recommended data={data} loading={loading} onRetry={onRetry} />

          {/* New: professionals nobody has reviewed yet. That is the only
              honest reading of "new" in this payload - there is no joined
              date on a professional. */}
          <ProfessionalRail
            id="new-heading"
            title="New on Touch of Heaven"
            items={newProfessionals}
            loading={loading}
            emptyMessage=""
          />

          {/* One row per category the backend sends, filled from the same
              nearby professionals. Categories with nobody in them are
              skipped rather than shown empty. */}
          {categoryRails.map(({ category, items }) => (
            <ProfessionalRail
              key={category.id}
              id={`category-${category.slug}-heading`}
              title={category.name}
              items={items}
              loading={false}
              emptyMessage=""
            />
          ))}

          {/* Trending: who clients have actually been opening lately,
              counted from recently-viewed rows. Empty until the platform
              has traffic, and it fills by itself after that. */}
          <ProfessionalRail
            id="trending-heading"
            title="Trending near you"
            items={data?.trending ?? []}
            loading={loading}
            emptyMessage=""
          />

          <Nearby data={data} loading={loading} />
        </div>

        <aside className="grid gap-4">
          <UpcomingAppointment data={data} loading={loading} />
          <AiStudioCard data={data} />
        </aside>
      </div>

      <Testimonials data={data} loading={loading} />
    </div>
  );
}

function Hero({ city, loading }: { city: string; loading: boolean }) {
  return (
    <section className="grid gap-5">
      <div className="hidden lg:block">
        
      </div>

      {/* The location the results are actually anchored to, stated rather
          than assumed - and never taken from the browser unasked. */}
      <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] lg:hidden">
        <MapPin aria-hidden="true" className="size-4 text-[var(--color-brand)]" />
        {loading ? "Finding your area…" : city}
      </p>

      <PlatformSearch locationPlaceholder={city || "Location"} />
    </section>
  );
}

function SectionHeading({
  title,
  href,
  id,
}: {
  title: string;
  href?: string;
  id: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2
        id={id}
        className="min-w-0 font-serif text-2xl font-semibold text-[var(--color-text-primary)]"
      >
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          See all
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function RecentlyViewed({ data }: { data: ClientHomeData }) {
  return (
    <section aria-labelledby="recent-heading" className="grid min-w-0 gap-4">
      <SectionHeading id="recent-heading" title="Recently viewed" />
      <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.recentlyViewed.slice(0, 3).map((item) => (
          <li key={item.braiderId} className="min-w-0">
            <Link
              href={professionalHref(item.braiderId)}
              className="flex min-w-0 items-center gap-3 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-3 transition-colors hover:border-[var(--color-brand)]"
            >
              <span className="size-12 shrink-0 overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
                {item.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logoUrl} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 truncate font-semibold text-[var(--color-text-primary)]">
                {item.professionalName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One row of professionals: a snapping carousel on a phone, a grid on a wide
 * screen. Every row below the search bar uses this, so they stay in step.
 */
function ProfessionalRail({
  id,
  title,
  items,
  loading,
  emptyMessage,
}: {
  id: string;
  title: string;
  items: HomeProfessional[];
  loading: boolean;
  emptyMessage: string;
}) {
  // A row with nothing in it is noise, so it does not render at all.
  if (!loading && items.length === 0) return null;

  return (
    <section aria-labelledby={id} className="grid min-w-0 gap-4">
      <SectionHeading id={id} title={title} href="/explore" />
      {loading ? (
        <CardSkeleton />
      ) : (
        <>
          <ul
            role="list"
            className="flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] lg:hidden"
          >
            {items.map((item) => (
              <li key={item.id} className="w-[82%] shrink-0 snap-start sm:w-[48%]">
                <ProfessionalCard item={item} />
              </li>
            ))}
          </ul>
          <ul role="list" className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="min-w-0">
                <ProfessionalCard item={item} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/**
 * Does this professional work in this category?
 *
 * Matched against their own specialties, which is the only thing the home
 * payload says about what they do. Nothing is invented: a category with no
 * matching professional simply does not get a row.
 */
/**
 * The categories that get a row of their own.
 *
 * These are kinds of business - a nail bar, a barber shop, a spa - which is
 * what someone is choosing between. The rest of the backend's categories
 * are hairstyles (braids, cornrows, twists, locs), and a row per hairstyle
 * is a different page than this one.
 */
const BUSINESS_TYPE_SLUGS = ["nails", "barbers", "spa-wellness", "makeup"];

function inCategory(item: HomeProfessional, category: HomeCategory) {
  const haystack = item.specialties.join(" ").toLowerCase();
  const words = category.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
  return words.some((word) => haystack.includes(word));
}

function Recommended({
  data,
  loading,
  onRetry,
}: {
  data: ClientHomeData | undefined;
  loading: boolean;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="recommended-heading" className="grid min-w-0 gap-4">
      <SectionHeading
        id="recommended-heading"
        title="Recommended for you"
        href="/explore"
      />

      {loading ? (
        <CardSkeleton />
      ) : data?.nearbyFailed ? (
        <SectionError onRetry={onRetry} what="recommendations" />
      ) : (data?.recommendations.length ?? 0) === 0 ? (
        <EmptyStrip message="No professionals nearby just yet. Try widening your search." />
      ) : (
        <>
          {/* Phone: a snapping carousel, so the next card peeks and the
              page itself never scrolls sideways. */}
          <ul
            role="list"
            className="flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] lg:hidden"
          >
            {data?.recommendations.map((item) => (
              <li key={item.id} className="w-[82%] shrink-0 snap-start sm:w-[48%]">
                <ProfessionalCard item={item} />
              </li>
            ))}
          </ul>
          <ul role="list" className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-4">
            {data?.recommendations.map((item) => (
              <li key={item.id} className="min-w-0">
                <ProfessionalCard item={item} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Nearby({
  data,
  loading,
}: {
  data: ClientHomeData | undefined;
  loading: boolean;
}) {
  if (!loading && (data?.nearby.length ?? 0) === 0) return null;

  return (
    <section aria-labelledby="nearby-heading" className="grid min-w-0 gap-4">
      <SectionHeading id="nearby-heading" title="Nearby professionals" href="/explore" />
      {loading ? (
        <CardSkeleton rows={3} />
      ) : (
        <ul role="list" className="grid min-w-0 gap-3">
          {data?.nearby.slice(0, 5).map((item) => (
            <ProfessionalRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function UpcomingAppointment({
  data,
  loading,
}: {
  data: ClientHomeData | undefined;
  loading: boolean;
}) {
  if (loading) return <CardSkeleton rows={1} />;

  const appointment = data?.upcomingAppointment;

  if (!appointment) {
    return (
      <section className="rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-5">
        <h2 className="font-serif text-xl font-semibold">
          Ready for your next appointment?
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Find a professional near you and book in a few taps.
        </p>
        <Link href="/explore" className="btn-primary mt-4 inline-flex min-h-11">
          Explore services
        </Link>
      </section>
    );
  }

  const when = new Date(appointment.startAt);

  return (
    <section className="rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-5">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <CalendarDays aria-hidden="true" className="size-5 text-[var(--color-brand)]" />
        Upcoming appointment
      </h2>
      <p className="mt-3 font-semibold text-[var(--color-text-primary)]">
        {appointment.serviceName}
      </p>
      {appointment.professionalName ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {appointment.professionalName}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        {when.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}{" "}
        at{" "}
        {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </p>
      {appointment.locationLabel ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          {appointment.locationLabel}
        </p>
      ) : null}
      <Link
        href={`/bookings/${appointment.id}`}
        className="btn-secondary mt-4 inline-flex min-h-11 w-full justify-center"
      >
        View booking
      </Link>
    </section>
  );
}

function AiStudioCard({ data }: { data: ClientHomeData | undefined }) {
  if (data && !data.aiStudio.available) return null;

  const resuming = data?.aiStudio.hasDraft ?? false;

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel,16px)] bg-[var(--color-brand)] p-5 text-white">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <Sparkles aria-hidden="true" className="size-5 text-[var(--color-gold)]" />
        {resuming ? "Continue your look" : "Try your look in AI Studio"}
      </h2>
      <p className="mt-2 text-sm text-white/85">
        {resuming
          ? "You started a look and didn't finish it. Pick up where you left off."
          : "See hairstyles, makeup and more on you instantly."}
      </p>
      <Link
        href="/ai-studio"
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-white px-4 font-bold text-[var(--color-brand)]"
      >
        {resuming ? "Continue" : "Open AI Studio"}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

/**
 * What clients say, across the whole platform.
 *
 * Every quote is a verified review of a real appointment - the model will
 * not hold anything else - so this stays empty until there are reviews
 * rather than showing written-up praise in the meantime.
 */
function Testimonials({
  data,
  loading,
}: {
  data: ClientHomeData | undefined;
  loading: boolean;
}) {
  const items = data?.testimonials ?? [];
  if (loading || items.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading" className="grid min-w-0 gap-4">
      <SectionHeading id="testimonials-heading" title="What clients are saying" />
      <ul
        role="list"
        className="flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] lg:grid lg:snap-none lg:grid-cols-3 lg:overflow-visible"
      >
        {items.slice(0, 6).map((item) => (
          <li
            key={item.id}
            className="w-[82%] shrink-0 snap-start sm:w-[48%] lg:w-auto lg:min-w-0"
          >
            <figure className="flex h-full flex-col gap-3 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
              <div
                className="flex gap-0.5 text-[var(--color-gold)]"
                aria-label={`${item.rating} out of 5`}
              >
                {Array.from({ length: item.rating }, (_, index) => (
                  <Star key={index} aria-hidden="true" className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-6 text-[var(--color-text-primary)]">
                {item.body}
              </blockquote>
              <figcaption className="text-xs text-[var(--color-text-muted)]">
                <span className="font-bold text-[var(--color-text-primary)]">
                  {item.reviewerFirstName ?? "A client"}
                </span>
                {" · "}
                {item.serviceName}
                {item.professionalName ? ` with ${item.professionalName}` : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionError({ onRetry, what }: { onRetry: () => void; what: string }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-panel,16px)] border border-dashed border-[var(--color-border)] p-5"
    >
      <p className="text-sm text-[var(--color-text-muted)]">
        We couldn&apos;t load {what}. The rest of your home is fine.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 min-h-11 font-semibold text-[var(--color-brand)] hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyStrip({ message }: { message: string }) {
  return (
    <p className="rounded-[var(--radius-panel,16px)] border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-text-muted)]">
      {message}
    </p>
  );
}

/* Skeletons keep the final layout, so nothing jumps when data lands. */

function TileSkeleton() {
  return (
    <div role="status" aria-label="Loading categories" className="grid grid-cols-4 gap-3 lg:grid-cols-6">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-[88px] animate-pulse rounded-[var(--radius-panel,16px)] bg-[var(--color-brand-soft)]"
        />
      ))}
    </div>
  );
}

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-56 animate-pulse rounded-[var(--radius-panel,16px)] bg-[var(--color-surface-strong,#f2ece9)]"
        />
      ))}
    </div>
  );
}
