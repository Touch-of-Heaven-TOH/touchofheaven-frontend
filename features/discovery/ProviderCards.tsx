"use client";

import Link from "next/link";
import { BadgeCheck, Calendar, Car, MapPin, ShieldCheck, Star, X } from "lucide-react";
import { classNames } from "@/features/discovery/DiscoveryShell";
import { formatDistance } from "@/lib/discovery/format";
import {
  bookingHref,
  formatNextOpening,
  formatRating,
  locationTypeLabel,
  mainServiceType,
  profileHref,
  providerInitials,
  type NearbyProvider,
} from "@/features/discovery/nearby";

/**
 * The provider's cover photo, or their initials on a brand tile when they
 * haven't published one. Photos are served from object storage, whose
 * host isn't one next/image is configured for, hence the plain <img>.
 */
export function ProviderAvatar({
  provider,
  className,
}: {
  provider: NearbyProvider;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        "relative grid shrink-0 place-items-center overflow-hidden bg-[var(--color-brand)] font-serif font-semibold text-[var(--color-gold-light)]",
        className,
      )}
    >
      {provider.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={provider.photo.altText || ""}
          className="absolute inset-0 h-full w-full object-cover"
          src={provider.photo.url}
        />
      ) : (
        <span aria-hidden="true">{providerInitials(provider.professionalName)}</span>
      )}
    </span>
  );
}

function RatingLine({ provider, className }: { provider: NearbyProvider; className?: string }) {
  const rating = formatRating(provider);
  return (
    <p className={classNames("flex items-center gap-1.5 text-sm", className)}>
      <Star
        aria-hidden="true"
        className={rating ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "text-[var(--color-text-muted)]"}
        size={15}
      />
      {rating ?? <span className="text-[var(--color-text-muted)]">New, no reviews yet</span>}
    </p>
  );
}

function WhereLine({ provider }: { provider: NearbyProvider }) {
  const Icon = provider.kind === "serviceArea" ? Car : MapPin;
  const where =
    provider.kind === "serviceArea"
      ? provider.radiusMiles
        ? `Comes to you, within ${provider.radiusMiles} mi`
        : "Comes to you"
      : [provider.locationLabel, locationTypeLabel(provider.locationModel)].filter(Boolean).join(" · ");
  return (
    <p className="flex items-start gap-1.5 text-sm text-[var(--color-text-muted)]">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
      <span className="min-w-0">
        {where}
        <span className="whitespace-nowrap"> · {formatDistance(provider.distanceKm)}</span>
      </span>
    </p>
  );
}

function NextOpeningLine({ provider }: { provider: NearbyProvider }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
      <Calendar aria-hidden="true" className="shrink-0" size={15} />
      <span>
        {provider.nextAvailableSlotAt ? "Next opening: " : null}
        {formatNextOpening(provider.nextAvailableSlotAt)}
      </span>
    </p>
  );
}

function ActionLinks({ provider, compact = false }: { provider: NearbyProvider; compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        href={profileHref(provider)}
        className={classNames(
          "inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] px-3 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]",
          compact ? "min-h-10" : "min-h-11",
        )}
      >
        View profile
      </Link>
      <Link
        href={bookingHref(provider)}
        className={classNames(
          "inline-flex items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-3 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)]",
          compact ? "min-h-10" : "min-h-11",
        )}
      >
        Book
      </Link>
    </div>
  );
}

function NotTakingClients({ provider }: { provider: NearbyProvider }) {
  if (provider.acceptsNewClients) return null;
  return (
    <p className="rounded-[var(--radius-control)] bg-[var(--color-warning-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-warning)]">
      Not taking new clients right now
    </p>
  );
}

/** What opens over a pin when it's clicked. */
export function ProviderPopup({
  provider,
  onClose,
}: {
  provider: NearbyProvider;
  onClose: () => void;
}) {
  return (
    <div className="w-[272px] font-sans text-[var(--color-text-primary)]">
      <div className="flex items-start gap-3 p-4 pb-3">
        <ProviderAvatar provider={provider} className="h-12 w-12 rounded-full text-base" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-semibold leading-snug">
            <span className="truncate">{provider.professionalName}</span>
            <BadgeCheck aria-label="Verified business" className="shrink-0 fill-[var(--color-gold)] text-white" size={16} />
          </p>
          <p className="truncate text-sm text-[var(--color-text-muted)]">{mainServiceType(provider)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-1.5 px-4">
        <RatingLine provider={provider} />
        <WhereLine provider={provider} />
        <NextOpeningLine provider={provider} />
        {provider.isApproximateLocation ? (
          <p className="flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]">
            <ShieldCheck aria-hidden="true" className="mt-px shrink-0 text-[var(--color-gold)]" size={14} />
            Approximate area. The exact address is shared once your booking is confirmed.
          </p>
        ) : null}
        <NotTakingClients provider={provider} />
      </div>
      <div className="p-4 pt-3">
        <ActionLinks provider={provider} compact />
      </div>
    </div>
  );
}

/** A result in the list beside the map. The top part selects the pin. */
export function ProviderListCard({
  provider,
  selected,
  onSelect,
  onMap,
}: {
  provider: NearbyProvider;
  selected: boolean;
  onSelect: () => void;
  /** False for mobile-only providers, which have no pin. */
  onMap: boolean;
}) {
  return (
    <article
      className={classNames(
        "rounded-[var(--radius-control)] border bg-white shadow-[var(--shadow-subtle)] transition",
        selected ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]" : "border-[var(--color-border)]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!onMap}
        aria-pressed={onMap ? selected : undefined}
        className="grid w-full grid-cols-[72px_minmax(0,1fr)] gap-3 p-3 text-left disabled:cursor-default"
      >
        <ProviderAvatar provider={provider} className="h-[72px] w-[72px] rounded-[var(--radius-control)] text-xl" />
        <span className="grid min-w-0 gap-1">
          <span className="flex items-center gap-1 font-semibold">
            <span className="truncate">{provider.professionalName}</span>
            <BadgeCheck aria-hidden="true" className="shrink-0 fill-[var(--color-gold)] text-white" size={15} />
          </span>
          <span className="truncate text-sm text-[var(--color-text-muted)]">
            {provider.specialties.slice(0, 3).join(", ") || mainServiceType(provider)}
          </span>
          <RatingLine provider={provider} />
          {onMap ? null : (
            <span className="text-xs font-semibold text-[var(--color-copper)]">Travels to clients, not shown on the map</span>
          )}
        </span>
      </button>
      <div className="grid gap-2 border-t border-[var(--color-border)] px-3 py-3">
        <WhereLine provider={provider} />
        <NextOpeningLine provider={provider} />
        <NotTakingClients provider={provider} />
        <ActionLinks provider={provider} compact />
      </div>
    </article>
  );
}

/** A result in the grid (list view). */
export function ProviderGridCard({ provider }: { provider: NearbyProvider }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
      <ProviderAvatar provider={provider} className="h-44 w-full text-5xl" />
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1 text-lg font-semibold">
            <span className="truncate">{provider.professionalName}</span>
            <BadgeCheck aria-label="Verified business" className="shrink-0 fill-[var(--color-gold)] text-white" size={17} />
          </h2>
          <p className="truncate text-sm text-[var(--color-text-muted)]">
            {provider.specialties.slice(0, 3).join(", ") || mainServiceType(provider)}
          </p>
        </div>
        <RatingLine provider={provider} />
        <WhereLine provider={provider} />
        <NextOpeningLine provider={provider} />
        <NotTakingClients provider={provider} />
        <div className="mt-auto pt-2">
          <ActionLinks provider={provider} />
        </div>
      </div>
    </article>
  );
}

export function ProviderCardSkeleton({ layout }: { layout: "list" | "grid" }) {
  if (layout === "grid") {
    return (
      <div aria-hidden="true" className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white">
        <div className="h-44 animate-pulse bg-[var(--color-skeleton)]" />
        <div className="grid gap-3 p-5">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
          <div className="mt-2 h-11 animate-pulse rounded-[var(--radius-control)] bg-[var(--color-skeleton)]" />
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="grid grid-cols-[72px_1fr] gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3">
      <div className="h-[72px] animate-pulse rounded-[var(--radius-control)] bg-[var(--color-skeleton)]" />
      <div className="grid content-center gap-2">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
      </div>
    </div>
  );
}
