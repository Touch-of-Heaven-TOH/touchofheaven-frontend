"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ClientShell } from "@/features/discovery/DiscoveryShell";
import { professionalHref } from "@/features/client-home/api";
import { SaveProviderButton } from "@/features/discovery/SaveProviderButton";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * The professionals a client has saved.
 *
 * The header's heart has pointed somewhere vague until now; this is the
 * real destination, reading the same favorites the save button writes.
 */

type FavoriteProvider = {
  braiderId: string;
  name: string;
  professionalName: string;
  logoUrl: string | null;
  handle: string | null;
};

export function SavedProfessionals() {
  const { data, error, isLoading, mutate } = useSWR<{ favorites: FavoriteProvider[] }>(
    "/api/v1/customer/favorites",
    (path: string) => browserApiFetch<{ favorites: FavoriteProvider[] }>(path),
  );

  const favorites = data?.favorites ?? [];

  return (
    <ClientShell>
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Saved professionals</h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Everyone you&apos;ve saved, ready to book again.
        </p>

        {isLoading ? (
          <div role="status" aria-label="Loading your saved professionals" className="mt-6 grid gap-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-20 animate-pulse rounded-[var(--radius-panel,16px)] bg-[var(--color-surface-strong,#f2ece9)]"
              />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-6 grid justify-items-start gap-3">
            <p className="font-semibold text-[var(--color-danger)]">
              We couldn&apos;t load your saved professionals.
            </p>
            <button type="button" onClick={() => void mutate()} className="btn-primary min-h-11">
              Try again
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="mt-6 grid justify-items-start gap-3 rounded-[var(--radius-panel,16px)] border border-dashed border-[var(--color-border)] p-6">
            <Heart aria-hidden="true" className="size-7 text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-muted)]">
              Nothing saved yet. Tap the heart on a professional&apos;s profile and
              they&apos;ll appear here.
            </p>
            <Link href="/explore" className="btn-primary min-h-11">
              Find a professional
            </Link>
          </div>
        ) : (
          <ul role="list" className="mt-6 grid gap-3">
            {favorites.map((favorite) => (
              <li
                key={favorite.braiderId}
                className="flex min-w-0 items-center gap-3 rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-3"
              >
                <span className="size-14 shrink-0 overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
                  {favorite.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={favorite.logoUrl} alt="" className="size-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={professionalHref(favorite.braiderId)}
                    className="block truncate font-semibold text-[var(--color-text-primary)] hover:underline"
                  >
                    {favorite.professionalName}
                  </Link>
                  {favorite.name ? (
                    <span className="block truncate text-sm text-[var(--color-text-muted)]">
                      {favorite.name}
                    </span>
                  ) : null}
                </span>
                <SaveProviderButton
                  braiderId={favorite.braiderId}
                  professionalName={favorite.professionalName}
                  compact
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ClientShell>
  );
}
