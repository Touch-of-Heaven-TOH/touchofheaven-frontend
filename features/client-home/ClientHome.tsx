"use client";

import { ArrowRight, CalendarDays, MapPin, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ClientShell } from "@/features/discovery/DiscoveryShell";
import {
  CLIENT_HOME_KEY,
  clientHomeFetcher,
  professionalHref,
  searchHref,
  type ClientHome as ClientHomeData,
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

const DATE_OPTIONS = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

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
          <>
            <div className="lg:hidden">
              <CategoryGrid
                categories={data?.categories ?? []}
                failed={data?.categoriesFailed ?? false}
                onRetry={onRetry}
                limit={8}
              />
            </div>
            <div className="hidden lg:block">
              <CategoryGrid
                categories={data?.categories ?? []}
                failed={data?.categoriesFailed ?? false}
                onRetry={onRetry}
                limit={6}
              />
            </div>
          </>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="grid min-w-0 gap-8">
          {data && data.recentlyViewed.length > 0 ? (
            <RecentlyViewed data={data} />
          ) : null}

          <Recommended data={data} loading={loading} onRetry={onRetry} />
          <Nearby data={data} loading={loading} />
        </div>

        <aside className="grid gap-4">
          <UpcomingAppointment data={data} loading={loading} />
          <AiStudioCard data={data} />
        </aside>
      </div>
    </div>
  );
}

function Hero({ city, loading }: { city: string; loading: boolean }) {
  const [query, setQuery] = useState("");
  const [where, setWhere] = useState("");
  const [date, setDate] = useState("any");

  return (
    <section className="grid gap-5">
      <div className="hidden lg:block">
        <h1 className="font-serif text-4xl leading-tight font-semibold text-[var(--color-text-primary)] xl:text-5xl">
          Book beauty and wellness near you
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-muted)]">
          Discover trusted braiders, nail technicians, barbers and spa
          professionals.
        </p>
      </div>

      {/* The location the results are actually anchored to, stated rather
          than assumed - and never taken from the browser unasked. */}
      <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] lg:hidden">
        <MapPin aria-hidden="true" className="size-4 text-[var(--color-brand)]" />
        {loading ? "Finding your area…" : city}
      </p>

      <form
        action={searchHref({ q: query, location: where, date })}
        className="grid gap-2 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-subtle)] lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_minmax(0,11rem)_auto] lg:items-center lg:gap-0 lg:rounded-full lg:p-1.5"
      >
        <label className="sr-only" htmlFor="home-q">
          Service or professional
        </label>
        <div className="flex min-w-0 items-center gap-2 px-3">
          <Search aria-hidden="true" className="size-5 shrink-0 text-[var(--color-text-muted)]" />
          <input
            id="home-q"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services or professionals"
            className="min-h-11 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <label className="sr-only" htmlFor="home-where">
          Location
        </label>
        <input
          id="home-where"
          name="location"
          value={where}
          onChange={(event) => setWhere(event.target.value)}
          placeholder={city || "Location"}
          className="min-h-11 min-w-0 border-t border-[var(--color-border)] bg-transparent px-3 text-sm outline-none lg:border-t-0 lg:border-l"
        />

        <label className="sr-only" htmlFor="home-date">
          Date
        </label>
        <select
          id="home-date"
          name="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="min-h-11 min-w-0 border-t border-[var(--color-border)] bg-transparent px-3 text-sm outline-none lg:border-t-0 lg:border-l"
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn-primary min-h-12 lg:rounded-full lg:px-8">
          Search
        </button>
      </form>

      <p className="hidden text-center text-sm text-[var(--color-text-muted)] lg:block">
        Trusted professionals. Simple booking. Protected appointments.
      </p>
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
