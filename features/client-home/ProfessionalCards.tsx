"use client";

import { CalendarDays, ChevronRight, MapPin, Star } from "lucide-react";
import Link from "next/link";
import {
  bookHref,
  formatDistance,
  nextAvailableLabel,
  professionalHref,
  type HomeProfessional,
} from "@/features/client-home/api";
import { SaveProviderButton } from "@/features/discovery/SaveProviderButton";

/**
 * The two card shapes the client home uses: a large media card for the
 * recommendation carousel, and a compact row for the nearby list.
 *
 * Both draw only what the backend actually sent. A professional with no
 * reviews shows "New", not a decorative star count, and a card with no
 * free slot simply omits the availability line rather than inventing one.
 */

function Rating({ rating }: { rating: HomeProfessional["rating"] }) {
  if (rating.average === null || rating.count === 0) {
    return (
      <span className="text-sm text-[var(--color-text-muted)]">
        New to Touch of Heaven
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      <Star
        aria-hidden="true"
        className="size-4 shrink-0 text-[var(--color-gold)]"
        fill="currentColor"
      />
      <span className="font-semibold text-[var(--color-text-primary)]">
        {rating.average.toFixed(1)}
      </span>
      <span className="text-[var(--color-text-muted)]">
        ({rating.count} {rating.count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

export function ProfessionalCard({ item }: { item: HomeProfessional }) {
  const available = nextAvailableLabel(item);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transform-none">
      <div className="relative aspect-[16/10] bg-[var(--color-brand-soft)]">
        {item.photo ? (
          // Portfolio media comes from object storage on hosts that are
          // not listed in next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo.url}
            alt={item.photo.altText}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-[var(--color-text-muted)]">
            No photo yet
          </div>
        )}
        <span className="absolute right-2 top-2">
          <SaveProviderButton
            braiderId={item.braiderId}
            professionalName={item.professionalName}
            compact
          />
        </span>
      </div>

      <div className="grid flex-1 content-start gap-1.5 p-4">
        <h3 className="min-w-0 font-semibold break-words text-[var(--color-text-primary)]">
          <Link href={professionalHref(item.braiderId)} className="hover:underline">
            {item.professionalName}
          </Link>
        </h3>
        {item.locationLabel ? (
          <p className="truncate text-sm text-[var(--color-text-muted)]">
            {item.locationLabel}
          </p>
        ) : null}
        <Rating rating={item.rating} />
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {formatDistance(item.distanceKm)}
          </span>
          {available ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{available}</span>
            </span>
          ) : null}
        </div>
        <Link
          href={bookHref(item.braiderId)}
          className="btn-primary mt-3 inline-flex min-h-11 justify-center"
        >
          Book now
        </Link>
      </div>
    </article>
  );
}

export function ProfessionalRow({ item }: { item: HomeProfessional }) {
  return (
    <li className="min-w-0">
      <Link
        href={professionalHref(item.braiderId)}
        className="flex min-w-0 items-center gap-3 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-3 transition-colors hover:border-[var(--color-brand)]"
      >
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
          {item.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photo.url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-[var(--color-text-primary)]">
            {item.professionalName}
          </span>
          {item.specialties.length > 0 ? (
            <span className="block truncate text-sm text-[var(--color-text-muted)]">
              {item.specialties.slice(0, 3).join(" · ")}
            </span>
          ) : null}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm">
            <Rating rating={item.rating} />
            <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              {formatDistance(item.distanceKm)}
            </span>
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-[var(--color-text-muted)]"
        />
      </Link>
    </li>
  );
}
