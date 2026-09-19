"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  CircleDollarSign,
  Clock,
  Copy,
  ExternalLink,
  Home,
  ImageIcon,
  Lock,
  MapPin,
  MessageSquareQuote,
  Scissors,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { ClientShell, classNames } from "@/features/discovery/DiscoveryShell";
import { providerInitials } from "@/features/discovery/nearby";
import { cancellationPolicyFor } from "@/lib/businesses/policies";
import type {
  PublicBusiness,
  PublicLocation,
  ServiceItem,
  ServiceVariation,
} from "@/lib/businesses/types";

/*
 * Public business pages: /businesses/[id] and its tabs, a service's own
 * page, and the shareable /book-with/[id] link. Everything shown comes from
 * the backend's public endpoints (see business-data.ts); fields the backend
 * doesn't publish - opening hours, amenities, languages, response times -
 * are left out rather than invented.
 *
 * These pages replaced the sample "Amara Braids & Beauty" profile from
 * discovery-data.ts, which every business ID used to fall back to.
 */

export type ProfileSection = "overview" | "services" | "portfolio" | "reviews" | "credentials";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatMoney(cents: number) {
  const formatted = moneyFormatter.format(cents / 100);
  return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatDelta(cents: number) {
  if (cents === 0) return "Same price";
  return `${cents > 0 ? "+" : "−"}${formatMoney(Math.abs(cents))}`;
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function depositSummary(services: ServiceItem[]) {
  if (services.length === 0) return null;
  const values = services.map((service) => service.depositPercentage);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}%` : `${min}–${max}%`;
}

function startingPrice(services: ServiceItem[]) {
  if (services.length === 0) return null;
  return Math.min(...services.map((service) => service.basePriceCents));
}

function coverPhoto(business: PublicBusiness) {
  const portfolio = business.portfolio[0];
  if (portfolio) return { url: portfolio.url, alt: portfolio.altText ?? "" };
  for (const service of business.services) {
    const image = service.media.find((media) => media.mediaType === "IMAGE");
    if (image) return { url: image.url, alt: image.altText };
  }
  return null;
}

function mapHref(location: PublicLocation) {
  if (location.latitude === null || location.longitude === null) return null;
  const lat = Number(location.latitude);
  const lng = Number(location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

function bookHref(businessId: string, serviceId?: string) {
  return serviceId ? `/book/${businessId}?serviceId=${encodeURIComponent(serviceId)}` : `/book/${businessId}`;
}

function officialAppUrl() {
  const configured = siteConfig.url.replace(/\/$/, "");
  return configured.startsWith("http://localhost") ? `https://${siteConfig.domain}` : configured;
}

// Colour and shape only: each use adds its own display and size classes,
// so no two utilities for the same property ever meet on one element.
const primaryLink =
  "items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] font-bold text-white transition hover:bg-[var(--color-brand-strong)]";
const secondaryLink =
  "items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-white font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]";
const regularSize = "inline-flex min-h-12 px-6";
const card = "rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]";
const factTile = "rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)]";

function BusinessAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={classNames(
        "relative z-10 grid shrink-0 place-items-center rounded-full border-4 border-white bg-[var(--color-brand)] font-serif font-semibold text-[var(--color-gold-light)] shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {providerInitials(name)}
    </span>
  );
}

function Cover({ business, className }: { business: PublicBusiness; className?: string }) {
  const photo = coverPhoto(business);
  return (
    <div
      className={classNames(
        "relative overflow-hidden bg-[var(--color-brand-strong)] bg-[radial-gradient(circle_at_18%_25%,rgba(201,150,60,0.38),transparent_42%),radial-gradient(circle_at_82%_70%,rgba(239,227,234,0.16),transparent_38%)]",
        className,
      )}
    >
      {photo ? (
        // Portfolio photos live in object storage, which next/image isn't
        // configured for.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={photo.alt} className="absolute inset-0 h-full w-full object-cover" src={photo.url} />
      ) : null}
    </div>
  );
}

function StarRow({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5 text-[var(--color-gold)]" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={size} fill={index < Math.round(rating) ? "currentColor" : "none"} aria-hidden="true" />
      ))}
    </span>
  );
}

function RatingSummary({ business }: { business: PublicBusiness }) {
  const { average, count } = business.profile.rating;
  if (count === 0 || average === null) {
    return (
      <span className="flex items-center gap-2">
        <Star size={18} aria-hidden="true" />
        New on Touch of Heaven
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={18} aria-hidden="true" />
      {average.toFixed(1)} ({count} verified review{count === 1 ? "" : "s"})
    </span>
  );
}

function locationTypeText(type: PublicLocation["locationType"]) {
  return type === "PUBLIC_SALON" ? "Salon" : "Private studio";
}

function useShare(title: string, url: () => string) {
  const [notice, setNotice] = useState("");
  async function share() {
    const target = url();
    try {
      if (navigator.share) {
        await navigator.share({ title, url: target });
        return;
      }
      await navigator.clipboard.writeText(target);
      setNotice("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Copy the link from the address bar");
    }
  }
  return { notice, share };
}

function ProfileHeader({ business, section }: { business: PublicBusiness; section: ProfileSection }) {
  const { profile } = business;
  const primary = business.locations[0] ?? null;
  const { notice, share } = useShare(profile.professionalName, () => `${window.location.origin}/businesses/${profile.braiderId}`);
  const base = `/businesses/${profile.braiderId}`;
  const tabs: Array<[ProfileSection, string, string]> = [
    ["overview", "Overview", base],
    ["services", `Services (${business.services.length})`, `${base}/services`],
    ["portfolio", `Portfolio (${business.portfolio.length})`, `${base}/portfolio`],
    ["reviews", `Reviews (${business.reviews.length})`, `${base}/reviews`],
    ["credentials", "Credentials", `${base}/credentials`],
  ];

  return (
    <section className="border-b border-[var(--color-border)] bg-white">
      <Cover business={business} className="h-40 md:h-56" />
      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-10">
        <BusinessAvatar name={profile.professionalName} className="-mt-16 h-28 w-28 text-4xl md:-mt-20 md:h-40 md:w-40 md:text-5xl" />
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 font-serif text-4xl font-semibold [overflow-wrap:anywhere]">
            {profile.professionalName}
            <BadgeCheck aria-label="Verified business" className="shrink-0 fill-[var(--color-gold)] text-white" size={26} />
          </h1>
          {profile.specialties.length ? (
            <p className="mt-1 text-lg text-[var(--color-text-muted)]">{profile.specialties.slice(0, 4).join(" · ")}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
            {primary ? (
              <span className="flex items-center gap-2">
                <MapPin size={18} aria-hidden="true" />
                {[primary.label, locationTypeText(primary.locationType)].filter(Boolean).join(" · ")}
              </span>
            ) : null}
            <RatingSummary business={business} />
            {profile.acceptsNewClients ? null : (
              <span className="font-semibold text-[var(--color-warning)]">Not taking new clients right now</span>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-5 font-semibold transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            <Share2 size={19} aria-hidden="true" />
            Share
          </button>
          <Link href={bookHref(profile.braiderId)} className={classNames(primaryLink, "hidden min-h-12 px-6 lg:inline-flex")}>
            Book now
          </Link>
        </div>
      </div>
      {notice ? (
        <p role="status" className="mx-auto max-w-[1500px] px-4 pb-3 text-sm font-semibold text-[var(--color-brand)] sm:px-6 md:px-10">
          {notice}
        </p>
      ) : null}
      <nav className="border-t border-[var(--color-border)]" aria-label="Business sections">
        <div className="mx-auto flex max-w-[1500px] gap-3 overflow-x-auto px-4 sm:px-6 md:px-10">
          {tabs.map(([id, label, href]) => (
            <Link
              key={id}
              href={href}
              aria-current={id === section ? "page" : undefined}
              className={classNames(
                "inline-flex min-h-14 shrink-0 items-center border-b-2 px-2 text-sm font-semibold md:px-5",
                id === section
                  ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                  : "border-transparent hover:text-[var(--color-brand)]",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}

function EmptyNote({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] bg-white px-5 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">{icon}</span>
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-[var(--color-text-muted)]">{body}</p>
    </div>
  );
}

function ServiceThumb({ service, className }: { service: ServiceItem; className?: string }) {
  const image = service.media.find((media) => media.mediaType === "IMAGE");
  return (
    <span className={classNames("relative grid shrink-0 place-items-center overflow-hidden bg-[var(--color-brand-soft)] text-[var(--color-brand)]", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={image.altText} className="absolute inset-0 h-full w-full object-cover" src={image.url} />
      ) : (
        <Scissors size={26} aria-hidden="true" />
      )}
    </span>
  );
}

function LocationCard({ location }: { location: PublicLocation }) {
  const href = mapHref(location);
  const Icon = location.locationType === "PUBLIC_SALON" ? Store : Home;
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={22} aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold">{location.label ?? locationTypeText(location.locationType)}</p>
        <p className="text-sm text-[var(--color-text-muted)]">{locationTypeText(location.locationType)}</p>
        {location.address ? (
          <p className="mt-1 text-sm">{location.address}</p>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Private studio. The exact address is shared once your booking is confirmed.
          </p>
        )}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:underline"
          >
            Open in map
            <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only">(opens OpenStreetMap in a new tab)</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

function BookingAside({ business }: { business: PublicBusiness }) {
  const { profile, services } = business;
  const deposit = depositSummary(services);
  const from = startingPrice(services);
  return (
    <aside className={classNames(card, "grid gap-4 self-start")}>
      <h2 className="font-serif text-3xl font-semibold">Ready to book?</h2>
      {from !== null ? (
        <p className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <CircleDollarSign size={18} aria-hidden="true" className="text-[var(--color-gold)]" />
          Services from <strong className="text-[var(--color-text-primary)]">{formatMoney(from)}</strong>
        </p>
      ) : null}
      {deposit ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          A {deposit} deposit holds your appointment. You pay the rest at the appointment.
        </p>
      ) : null}
      {profile.acceptsNewClients ? null : (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-warning)]">
          This business isn&apos;t taking new clients right now.
        </p>
      )}
      <Link href={bookHref(profile.braiderId)} className={classNames(primaryLink, regularSize)}>
        <Calendar size={19} aria-hidden="true" />
        See openings and book
      </Link>
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="text-[var(--color-gold)]" size={20} aria-hidden="true" />
          Book on Touch of Heaven
        </h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Pay your deposit here, not by cash or transfer, so the booking policy and refund rules apply.
        </p>
        <Link href="/legal/booking-policy" className="mt-3 inline-block text-sm font-semibold text-[var(--color-brand)] hover:underline">
          Read the booking policy
        </Link>
      </div>
    </aside>
  );
}

function OverviewSection({ business }: { business: PublicBusiness }) {
  const { profile, services, locations } = business;
  const base = `/businesses/${profile.braiderId}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid min-w-0 gap-6">
        <section className={card}>
          <h2 className="font-serif text-3xl font-semibold">About {profile.professionalName}</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-lg leading-8 text-[var(--color-text-muted)]">
            {profile.bio ?? "This business hasn't written an introduction yet. Their services, prices and reviews are below."}
          </p>
          {profile.specialties.length ? (
            <>
              <h3 className="mt-6 font-semibold">Specialties</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.specialties.map((specialty) => (
                  <span key={specialty} className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm">
                    {specialty}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-3xl font-semibold">Services</h2>
            {services.length > 4 ? (
              <Link href={`${base}/services`} className="font-semibold text-[var(--color-brand)] hover:underline">
                View all {services.length} services
              </Link>
            ) : null}
          </div>
          {services.length === 0 ? (
            <p className="mt-3 text-[var(--color-text-muted)]">No services are published yet.</p>
          ) : (
            <ul role="list" className="mt-4 grid gap-3">
              {services.slice(0, 4).map((service) => (
                <li key={service.id}>
                  <Link
                    href={`${base}/services/${service.id}`}
                    className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 transition hover:border-[var(--color-brand)]"
                  >
                    <ServiceThumb service={service} className="h-[72px] w-[72px] rounded-[var(--radius-control)]" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{service.name}</span>
                      <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                        {formatDuration(service.baseDurationMins)} · from {formatMoney(service.basePriceCents)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-brand)]">Details</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card} id="location">
          <h2 className="font-serif text-3xl font-semibold">Where</h2>
          {locations.length === 0 ? (
            <p className="mt-3 text-[var(--color-text-muted)]">Location details are confirmed when you book.</p>
          ) : (
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
        </section>
      </div>
      <BookingAside business={business} />
    </div>
  );
}

function ServiceFacts({ service }: { service: ServiceItem }) {
  const policy = cancellationPolicyFor(service.cancellationPolicy);
  return (
    <ul role="list" className="grid gap-1.5 text-sm text-[var(--color-text-muted)]">
      <li className="flex items-center gap-2">
        <Clock size={16} aria-hidden="true" />
        {formatDuration(service.baseDurationMins)}
      </li>
      <li className="flex items-center gap-2">
        <CircleDollarSign size={16} aria-hidden="true" />
        {service.depositPercentage}% deposit to book
      </li>
      {policy ? (
        <li className="flex items-center gap-2">
          <ShieldCheck size={16} aria-hidden="true" />
          {policy.label} cancellation
        </li>
      ) : null}
    </ul>
  );
}

function ServicesSection({ business }: { business: PublicBusiness }) {
  const { profile, services } = business;
  if (services.length === 0) {
    return (
      <EmptyNote
        icon={<Scissors size={24} aria-hidden="true" />}
        title="No services published yet"
        body="This business hasn't published any bookable services. Check back soon."
      />
    );
  }
  return (
    <section>
      <h2 className="font-serif text-4xl font-semibold">Services</h2>
      <ul role="list" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <li key={service.id} className="flex flex-col overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
            <ServiceThumb service={service} className="h-40 w-full" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h3 className="text-xl font-semibold">{service.name}</h3>
                {service.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{service.description}</p>
                ) : null}
              </div>
              <ServiceFacts service={service} />
              <p className="font-bold">From {formatMoney(service.basePriceCents)}</p>
              <div className="mt-auto grid grid-cols-2 gap-2">
                <Link href={`/businesses/${profile.braiderId}/services/${service.id}`} className={classNames(secondaryLink, "inline-flex min-h-11 px-3 text-sm")}>
                  Details
                </Link>
                <Link href={bookHref(profile.braiderId, service.id)} className={classNames(primaryLink, "inline-flex min-h-11 px-3 text-sm")}>
                  Book
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PortfolioSection({ business }: { business: PublicBusiness }) {
  if (business.portfolio.length === 0) {
    return (
      <EmptyNote
        icon={<ImageIcon size={24} aria-hidden="true" />}
        title="No portfolio photos yet"
        body="Photos of finished work appear here once clients agree to share them and they've been checked."
      />
    );
  }
  return (
    <section>
      <h2 className="font-serif text-4xl font-semibold">Portfolio</h2>
      <ul role="list" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {business.portfolio.map((item) => (
          <li key={item.id} className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-brand-soft)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={item.altText ?? ""} className="absolute inset-0 h-full w-full object-cover" src={item.url} loading="lazy" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewsSection({ business }: { business: PublicBusiness }) {
  const { reviews, profile } = business;
  if (reviews.length === 0) {
    return (
      <EmptyNote
        icon={<MessageSquareQuote size={24} aria-hidden="true" />}
        title="No reviews yet"
        body="Only clients who completed an appointment can leave a review, so every review here comes from a real booking."
      />
    );
  }
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-4xl font-semibold">Reviews</h2>
        {profile.rating.average !== null ? (
          <p className="flex items-center gap-3 text-lg">
            <strong className="font-serif text-3xl">{profile.rating.average.toFixed(1)}</strong>
            <StarRow rating={profile.rating.average} />
            <span className="text-sm text-[var(--color-text-muted)]">{profile.rating.count} verified</span>
          </p>
        ) : null}
      </div>
      <ul role="list" className="grid gap-4">
        {reviews.map((review) => (
          <li key={review.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StarRow rating={review.rating} size={17} />
              <span className="text-sm text-[var(--color-text-muted)]">
                {review.service.name} · {formatReviewDate(review.createdAt)}
              </span>
            </div>
            <p className="mt-3 leading-7">{review.reviewBody}</p>
            {review.response ? (
              <div className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-4">
                <p className="text-sm font-semibold">Response from {profile.professionalName}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{review.response.responseBody}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CredentialsSection({ business }: { business: PublicBusiness }) {
  const policyCodes = [...new Set(business.services.map((service) => service.cancellationPolicy))];
  const policies = policyCodes.map((code) => cancellationPolicyFor(code)).filter((policy) => policy !== null);
  return (
    <section className="grid gap-5">
      <h2 className="font-serif text-4xl font-semibold">Credentials</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <BadgeCheck className="fill-[var(--color-gold)] text-white" size={24} aria-hidden="true" />
            Verified business
          </h3>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Touch of Heaven checked this business&apos;s identity and documents before its page went live. Unverified businesses
            don&apos;t appear in search or on the map.
          </p>
        </div>
        <div className={card}>
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquareQuote className="text-[var(--color-gold)]" size={24} aria-hidden="true" />
            Reviews from real bookings
          </h3>
          <p className="mt-2 text-[var(--color-text-muted)]">
            {business.reviews.length
              ? `${business.reviews.length} review${business.reviews.length === 1 ? "" : "s"}, each from a client who completed an appointment.`
              : "No reviews yet. Only clients who completed an appointment can leave one."}
          </p>
        </div>
        <div className={classNames(card, "md:col-span-2")}>
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="text-[var(--color-gold)]" size={24} aria-hidden="true" />
            Cancellation policies
          </h3>
          {policies.length ? (
            <ul role="list" className="mt-3 grid gap-2">
              {policies.map((policy) => (
                <li key={policy.value}>
                  <strong>{policy.label}:</strong> <span className="text-[var(--color-text-muted)]">{policy.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[var(--color-text-muted)]">Each service shows its policy once published.</p>
          )}
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Each service is booked under one of these. Refunds follow it automatically, judged at the moment you cancel.{" "}
            <Link href="/legal/cancellation" className="font-semibold text-[var(--color-brand)] hover:underline">
              How cancellations work
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function StickyBookingBar({ href }: { href: string }) {
  return (
    <div className="fixed inset-x-0 bottom-[88px] z-20 border-t border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-[0_-8px_24px_rgba(43,23,36,0.08)] lg:hidden">
      <Link href={href} className={classNames(primaryLink, "flex min-h-12 w-full px-6 text-lg")}>
        <Calendar size={21} aria-hidden="true" />
        Book now
      </Link>
    </div>
  );
}

export function BusinessProfilePage({ business, section = "overview" }: { business: PublicBusiness; section?: ProfileSection }) {
  return (
    <ClientShell>
      <ProfileHeader business={business} section={section} />
      <div className="mx-auto max-w-[1500px] px-4 pb-28 pt-8 sm:px-6 md:px-10 lg:pb-12">
        {section === "overview" ? <OverviewSection business={business} /> : null}
        {section === "services" ? <ServicesSection business={business} /> : null}
        {section === "portfolio" ? <PortfolioSection business={business} /> : null}
        {section === "reviews" ? <ReviewsSection business={business} /> : null}
        {section === "credentials" ? <CredentialsSection business={business} /> : null}
      </div>
      <StickyBookingBar href={bookHref(business.profile.braiderId)} />
    </ClientShell>
  );
}

function groupVariations(variations: ServiceVariation[]) {
  const groups = new Map<string, ServiceVariation[]>();
  for (const variation of variations) {
    const key = variation.variationType ?? "OPTION";
    groups.set(key, [...(groups.get(key) ?? []), variation]);
  }
  return [...groups.entries()];
}

// The backend's ServiceVariationType values.
const VARIATION_GROUP_LABELS: Record<string, string> = {
  LENGTH: "Length",
  SIZE: "Size",
  COLOR: "Colour",
  HAIR_INCLUSION: "Hair",
  AGE_GROUP: "Age group",
  ADD_ON: "Add-ons",
  REMOVAL: "Removal",
  OPTION: "Options",
};

export function BusinessServicePage({ business, service }: { business: PublicBusiness; service: ServiceItem }) {
  const { profile, services } = business;
  const policy = cancellationPolicyFor(service.cancellationPolicy);
  const images = service.media.filter((media) => media.mediaType === "IMAGE");
  const depositCents = Math.round((service.basePriceCents * service.depositPercentage) / 100);
  const others = services.filter((other) => other.id !== service.id).slice(0, 3);
  const base = `/businesses/${profile.braiderId}`;

  return (
    <ClientShell>
      <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12">
        <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-text-muted)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={base} className="font-semibold text-[var(--color-brand)] hover:underline">
                {profile.professionalName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`${base}/services`} className="font-semibold text-[var(--color-brand)] hover:underline">
                Services
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{service.name}</li>
          </ol>
        </nav>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid content-start gap-3 self-start">
            {images.length ? (
              <>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-brand-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={images[0]!.altText} className="absolute inset-0 h-full w-full object-cover" src={images[0]!.url} />
                </div>
                {images.length > 1 ? (
                  <ul role="list" className="grid grid-cols-4 gap-3">
                    {images.slice(1, 5).map((image) => (
                      <li key={image.id} className="relative aspect-square overflow-hidden rounded-[var(--radius-control)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={image.altText} className="absolute inset-0 h-full w-full object-cover" src={image.url} loading="lazy" />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center rounded-[var(--radius-control)] bg-[var(--color-brand-strong)] bg-[radial-gradient(circle_at_20%_20%,rgba(201,150,60,0.38),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(239,227,234,0.16),transparent_40%)] p-6 text-center text-white">
                <div className="grid justify-items-center gap-3">
                  <Scissors size={40} aria-hidden="true" className="text-[var(--color-gold-light)]" />
                  <p className="font-serif text-2xl font-semibold">{service.name}</p>
                  <p className="max-w-xs text-sm text-white/75">No photos of this service yet. The business adds them from finished appointments.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid content-start gap-5">
            <div>
              <h1 className="font-serif text-4xl font-semibold md:text-5xl">{service.name}</h1>
              <p className="mt-2 text-lg text-[var(--color-text-muted)]">by {profile.professionalName}</p>
            </div>
            {service.description ? <p className="text-lg leading-8">{service.description}</p> : null}

            <dl className="grid grid-cols-2 gap-3">
              <div className={factTile}>
                <dt className="text-sm text-[var(--color-text-muted)]">Price</dt>
                <dd className="mt-1 text-xl font-bold">From {formatMoney(service.basePriceCents)}</dd>
              </div>
              <div className={factTile}>
                <dt className="text-sm text-[var(--color-text-muted)]">Time</dt>
                <dd className="mt-1 text-xl font-bold">{formatDuration(service.baseDurationMins)}</dd>
              </div>
              <div className={factTile}>
                <dt className="text-sm text-[var(--color-text-muted)]">Deposit to book</dt>
                <dd className="mt-1 text-xl font-bold">
                  {service.depositPercentage}% <span className="text-base font-semibold text-[var(--color-text-muted)]">({formatMoney(depositCents)})</span>
                </dd>
              </div>
              <div className={factTile}>
                <dt className="text-sm text-[var(--color-text-muted)]">Cancellation</dt>
                <dd className="mt-1 text-xl font-bold">{policy?.label ?? "See booking policy"}</dd>
              </div>
            </dl>
            {policy ? (
              <p className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={17} aria-hidden="true" />
                {policy.description} The deposit is shown for the base price; options change it.
              </p>
            ) : null}

            {service.variations.length ? (
              <section className={card}>
                <h2 className="font-serif text-2xl font-semibold">Options</h2>
                <div className="mt-3 grid gap-4">
                  {groupVariations(service.variations).map(([type, variations]) => (
                    <div key={type}>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {VARIATION_GROUP_LABELS[type] ?? "Options"}
                      </h3>
                      <ul role="list" className="mt-2 divide-y divide-[var(--color-border)]">
                        {variations.map((variation) => (
                          <li key={variation.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="font-semibold">{variation.label}</span>
                            <span className="text-[var(--color-text-muted)]">
                              {formatDelta(variation.priceDeltaCents)}
                              {variation.durationDeltaMins ? ` · ${variation.durationDeltaMins > 0 ? "+" : "−"}${formatDuration(Math.abs(variation.durationDeltaMins))}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <Link href={bookHref(profile.braiderId, service.id)} className={classNames(primaryLink, "inline-flex min-h-14 px-6 text-lg")}>
              <Calendar size={21} aria-hidden="true" />
              Book this service
            </Link>
          </div>
        </div>

        {others.length ? (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-3xl font-semibold">More from {profile.professionalName}</h2>
              <Link href={`${base}/services`} className="font-semibold text-[var(--color-brand)] hover:underline">
                All services
              </Link>
            </div>
            <ul role="list" className="mt-4 grid gap-3 md:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`${base}/services/${other.id}`}
                    className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3 transition hover:border-[var(--color-brand)]"
                  >
                    <ServiceThumb service={other} className="h-16 w-16 rounded-[var(--radius-control)]" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{other.name}</span>
                      <span className="text-sm text-[var(--color-text-muted)]">
                        {formatDuration(other.baseDurationMins)} · from {formatMoney(other.basePriceCents)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <StickyBookingBar href={bookHref(profile.braiderId, service.id)} />
    </ClientShell>
  );
}

function SafeLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-start gap-4 p-4 text-[var(--color-text-muted)]">
      <span className="text-[var(--color-gold)]">{icon}</span>
      {text}
    </p>
  );
}

/** The shareable "book with this business" page, with a QR code. */
export function DirectBookingLinkPage({ business }: { business: PublicBusiness }) {
  const { profile, services, locations } = business;
  const officialUrl = officialAppUrl();
  const canonicalUrl = `${officialUrl}/book/${profile.braiderId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&color=5c2747&bgcolor=fffaf7&data=${encodeURIComponent(canonicalUrl)}`;
  const [notice, setNotice] = useState("");
  const from = startingPrice(services);
  const deposit = depositSummary(services);
  const primary = locations[0] ?? null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setNotice("Booking link copied");
    } catch {
      setNotice("Copy the link from the address bar if your browser blocks clipboard access");
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Book with ${profile.professionalName}`, url: canonicalUrl });
        return;
      }
      await copyLink();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Sharing isn't available here. Use Copy link instead.");
    }
  }

  return (
    <ClientShell simple>
      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
        <section className="text-center">
          <h1 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
            You&apos;re one step away from your next appointment
          </h1>
          <div className="mx-auto my-4 h-px w-56 bg-[var(--color-gold)]" />
          <p className="text-lg text-[var(--color-text-muted)]">Book safely, confidently, and on your time.</p>
        </section>

        <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="min-w-0 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
            <Cover business={business} className="h-44" />
            <div className="px-6 pb-6 text-center">
              <BusinessAvatar name={profile.professionalName} className="mx-auto -mt-16 h-32 w-32 text-4xl" />
              <p className="mt-3 text-[var(--color-text-muted)]">You&apos;re booking with</p>
              <h2 className="flex flex-wrap items-center justify-center gap-2 break-words font-serif text-4xl font-semibold">
                {profile.professionalName}
                <BadgeCheck aria-label="Verified business" className="fill-[var(--color-gold)] text-white" size={26} />
              </h2>
              {profile.specialties.length ? (
                <p className="mt-2 text-lg text-[var(--color-text-muted)]">{profile.specialties.slice(0, 3).join(" · ")}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-[var(--color-text-muted)]">
                <RatingSummary business={business} />
                {primary ? (
                  <span className="flex items-center gap-2">
                    <MapPin size={18} aria-hidden="true" />
                    {primary.label ?? locationTypeText(primary.locationType)}
                  </span>
                ) : null}
              </div>
              {from !== null ? (
                <div className="mx-auto mt-6 max-w-xl rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-5 text-left">
                  <p className="flex items-center gap-3 font-semibold text-[var(--color-brand)]">
                    <CircleDollarSign size={22} aria-hidden="true" />
                    {services.length} service{services.length === 1 ? "" : "s"} from {formatMoney(from)}
                  </p>
                  {deposit ? <p className="mt-1 pl-9 text-sm">A {deposit} deposit holds your time.</p> : null}
                </div>
              ) : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={`/businesses/${profile.braiderId}/services`} className={classNames(secondaryLink, "inline-flex min-h-14 px-6")}>
                  View services
                </Link>
                <Link href={bookHref(profile.braiderId)} className={classNames(primaryLink, "inline-flex min-h-14 px-6")}>
                  Book now
                </Link>
              </div>
            </div>
          </article>

          <article className="min-w-0 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-subtle)]">
            <h2 className="font-serif text-3xl font-semibold">Scan to book with {profile.professionalName}</h2>
            <div className="mx-auto mt-5 w-fit rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-[var(--shadow-subtle)]">
              <Image alt={`QR code for ${profile.professionalName}'s booking link`} width={240} height={240} src={qrSrc} unoptimized />
            </div>
            <p className="mt-5 flex min-w-0 flex-wrap items-center justify-center gap-2 text-sm font-semibold text-[var(--color-brand)] sm:text-base">
              <Send size={17} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 break-all">{canonicalUrl.replace(/^https?:\/\//, "")}</span>
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] font-semibold transition hover:border-[var(--color-brand)]">
                <Copy size={19} aria-hidden="true" />
                Copy link
              </button>
              <button type="button" onClick={() => void shareLink()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] font-semibold transition hover:border-[var(--color-brand)]">
                <Share2 size={19} aria-hidden="true" />
                Share
              </button>
            </div>
            {notice ? (
              <p role="status" className="mt-3 text-sm font-semibold text-[var(--color-brand)]">
                {notice}
              </p>
            ) : null}
            <div className="mt-6 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] text-left">
              <SafeLine icon={<ShieldCheck aria-hidden="true" />} text="This official Touch of Heaven link opens the verified business." />
              <SafeLine icon={<Lock aria-hidden="true" />} text="The booking policy and refunds apply only to bookings paid on the platform." />
              <SafeLine icon={<MapPin aria-hidden="true" />} text={`Check for the ${new URL(officialUrl).hostname} domain before paying.`} />
            </div>
          </article>
        </div>
      </main>
    </ClientShell>
  );
}
