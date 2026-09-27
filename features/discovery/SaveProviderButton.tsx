"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";

/**
 * Saving a professional from their public profile.
 *
 * The account and portfolio pages have always shown a "saved
 * professionals" list; until now there was nowhere to put anything in it.
 *
 * This sits on a public page, so a signed-out visitor is a normal case
 * rather than an error: they get a link to sign in that returns them here,
 * not a button that fails.
 */

type FavoriteProvider = { braiderId: string };

export function SaveProviderButton({
  braiderId,
  professionalName,
}: {
  braiderId: string;
  professionalName: string;
}) {
  const favorites = useSWR<{ favorites: FavoriteProvider[] }>(
    "/api/v1/customer/favorites",
    (path: string) => browserApiFetch<{ favorites: FavoriteProvider[] }>(path),
    // A signed-out visitor gets a 401 here. That is an answer, not a
    // failure, so there is nothing to retry.
    { shouldRetryOnError: false },
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedOut =
    favorites.error instanceof ApiClientError && favorites.error.status === 401;

  const saved = (favorites.data?.favorites ?? []).some(
    (entry) => entry.braiderId === braiderId,
  );

  const buttonClass =
    "inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border px-5 font-semibold transition";

  if (signedOut) {
    return (
      <Link
        href={`/customer/sign-in?callbackUrl=${encodeURIComponent(`/businesses/${braiderId}`)}`}
        className={`${buttonClass} border-[var(--color-border)] bg-white hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]`}
      >
        <Heart aria-hidden="true" size={19} />
        Save
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (saved) {
        await browserApiFetch(`/api/v1/customer/favorites/${braiderId}`, {
          method: "DELETE",
        });
      } else {
        await browserApiFetch("/api/v1/customer/favorites", {
          method: "POST",
          body: { braiderId },
        });
      }
      await favorites.mutate();
    } catch (toggleError) {
      setError(
        toggleError instanceof ApiClientError
          ? toggleError.message
          : "We couldn't save that just now.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="grid justify-items-start gap-1">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={saved}
        aria-label={
          saved
            ? `Remove ${professionalName} from your saved professionals`
            : `Save ${professionalName} to your saved professionals`
        }
        className={`${buttonClass} ${
          saved
            ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
            : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        } ${busy ? "opacity-60" : ""}`}
      >
        <Heart aria-hidden="true" size={19} fill={saved ? "currentColor" : "none"} />
        {/* The word changes, not just the fill - a filled heart alone does
            not tell you which state you are in. */}
        {saved ? "Saved" : "Save"}
      </button>
      {error ? (
        <span role="alert" className="text-xs font-semibold text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </span>
  );
}
