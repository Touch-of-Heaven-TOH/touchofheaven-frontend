"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { StarRating } from "@/components/shared/StarRating";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import type {
  PortfolioMediaItem,
  PublicBraiderProfile,
  ReviewItem,
  ServiceItem,
} from "@/lib/braiders/types";

export type BraiderProfileContentProps = {
  profile: PublicBraiderProfile;
  portfolio: PortfolioMediaItem[];
  reviews: ReviewItem[];
  services: ServiceItem[];
};

const TABS = ["About", "Portfolio", "Services", "Reviews"] as const;
type Tab = (typeof TABS)[number];

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function BraiderProfileContent({
  profile,
  portfolio,
  reviews,
  services,
}: BraiderProfileContentProps) {
  const [tab, setTab] = useState<Tab>("About");
  const heroPhoto = portfolio[0] ?? null;

  return (
    <div className="page-container grid gap-8 py-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="min-w-0">
        <div className="overflow-hidden rounded-[var(--radius-panel)] bg-[var(--color-brand-soft)]">
          {heroPhoto ? (
            // R2 URLs use a plain <img>, not next/image - see
            // components/map/BraiderProfileCard.tsx's identical comment on
            // why (R2's domain isn't in next.config.ts's remotePatterns).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroPhoto.url}
              alt={heroPhoto.altText ?? `${profile.professionalName}'s work`}
              className="h-72 w-full object-cover md:h-96"
            />
          ) : (
            <div className="h-72 md:h-96" />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
                {profile.professionalName}
              </h1>
              <VerifiedBadge />
            </div>
            {profile.rating.count > 0 ? (
              <div className="mt-2">
                <StarRating rating={profile.rating.average ?? 0} reviewCount={profile.rating.count} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">No reviews yet</p>
            )}
          </div>
        </div>

        {profile.specialties.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.specialties.slice(0, 6).map((specialty) => (
              <span
                key={specialty}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)]"
              >
                {specialty}
              </span>
            ))}
          </div>
        ) : null}

        <nav className="mt-8 flex gap-1 border-b border-[var(--color-border)]" aria-label="Profile sections">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              aria-current={tab === item ? "true" : undefined}
              className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                tab === item
                  ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "About" ? (
            <p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[var(--color-text-primary)]">
              {profile.bio ?? "This braider hasn't added a bio yet."}
            </p>
          ) : null}

          {tab === "Portfolio" ? (
            portfolio.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No portfolio photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolio.map((item) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={item.id}
                    src={item.url}
                    alt={item.altText ?? ""}
                    className="aspect-square w-full rounded-[var(--radius-control)] object-cover"
                  />
                ))}
              </div>
            )
          ) : null}

          {tab === "Services" ? (
            services.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No published services yet.
              </p>
            ) : (
              <ul role="list" className="grid gap-3">
                {services.map((service) => (
                  <li key={service.id} className="surface-panel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {service.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {service.baseDurationMins} min · From{" "}
                          {formatPrice(service.basePriceCents)}
                        </p>
                      </div>
                      <Link href={`/book/${profile.braiderId}?serviceId=${service.id}`}>
                        <Button variant="secondary">Book this service</Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "Reviews" ? (
            reviews.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No reviews yet.</p>
            ) : (
              <ul role="list" className="grid gap-4">
                {reviews.map((review) => (
                  <li key={review.id} className="surface-panel p-4">
                    <StarRating rating={review.rating} />
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-primary)]">
                      {review.reviewBody}
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {review.service.name} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </div>

      <aside className="surface-panel sticky top-20 grid gap-3 p-5">
        <Link href={`/book/${profile.braiderId}`}>
          <Button className="w-full justify-center">Book Appointment</Button>
        </Link>
        <Link href={`/messages?to=${profile.braiderId}`}>
          <Button variant="secondary" className="w-full justify-center">
            Message
          </Button>
        </Link>
        {!profile.acceptsNewClients ? (
          <p className="text-center text-xs text-[var(--color-warning)]">
            Not currently accepting new clients.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
