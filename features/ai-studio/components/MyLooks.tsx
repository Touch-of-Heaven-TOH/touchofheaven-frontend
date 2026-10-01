"use client";

import Link from "next/link";
import { ArrowRight, Download, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { useViewer } from "@/components/providers/ViewerProvider";
import {
  AiStudioChrome,
  StudioModeTabs,
} from "@/features/ai-studio/components/AiStudioChrome";
import {
  fetchAiStudioSessions,
  shareAiStudioSession,
} from "@/features/ai-studio/api/studio.api";
import type { AiStudioSession } from "@/features/ai-studio/types";

/*
 * My looks: the previews this account has generated, and only this account.
 *
 * GET /api/v1/studio/sessions is authenticated and scoped to the signed-in
 * user (getOwnSessionHistory), so nothing here is anyone else's. That is
 * the difference between this page and /account/portfolio, which is the
 * looks you chose to save and set a visibility on.
 *
 * The image URLs are R2 GET links signed for one hour, so this refetches
 * rather than holding a URL past its life.
 */

const SESSIONS_KEY = "ai-studio/my-looks";
// The backend caps a page at 20.
const PAGE_SIZE = 20;
// Comfortably inside the one-hour signature, and it also picks up a
// generation that finished while the page was open.
const REFRESH_MS = 5 * 60 * 1000;

function formatWhen(iso: string) {
  const when = new Date(iso);
  return when.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: when.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function detailLine(look: AiStudioSession) {
  return [look.selectedColor, look.selectedSize, look.selectedLength]
    .filter(Boolean)
    .join(" · ");
}

function StatusNote({ look }: { look: AiStudioSession }) {
  if (look.status === "COMPLETED") return null;
  const failed = look.status === "FAILED";
  return (
    <p
      role="status"
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        failed
          ? "bg-[var(--color-danger-soft,#fdeaea)] text-[var(--color-danger,#b3261e)]"
          : "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
      }`}
    >
      {failed ? null : <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
      {failed
        ? look.errorMessage ?? "This one did not finish."
        : "Still working on this one"}
    </p>
  );
}

function LookCard({ look }: { look: AiStudioSession }) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const image = look.resultImageUrl ?? look.inputImageUrl;

  async function share() {
    setSharing(true);
    try {
      const { shareUrl } = await shareAiStudioSession(look.id);
      await navigator.clipboard.writeText(shareUrl);
      setShareNote("Link copied");
    } catch {
      setShareNote("Could not create a link");
    } finally {
      setSharing(false);
      window.setTimeout(() => setShareNote(null), 2500);
    }
  }

  return (
    <li className="min-w-0">
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
        <div className="relative aspect-[4/5] bg-[var(--color-brand-soft)]">
          {image ? (
            // A signed R2 URL that expires, so it is not run through
            // next/image, which would cache a link with an hour to live.
            <img
              alt={`Your ${look.styleName} preview`}
              className="size-full object-cover"
              loading="lazy"
              src={image}
            />
          ) : (
            <div className="grid size-full place-items-center text-sm text-[var(--color-text-muted)]">
              No image yet
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <h2 className="truncate text-base font-bold text-[var(--color-brand-strong)]">
            {look.styleName}
          </h2>
          <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
            {detailLine(look)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {formatWhen(look.createdAt)}
          </p>

          <StatusNote look={look} />

          {look.status === "COMPLETED" && look.resultImageUrl ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand)] transition hover:border-[var(--color-brand)]"
                download={`touch-of-heaven-${look.styleSlug}.jpg`}
                href={look.resultImageUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Download aria-hidden="true" size={16} />
                Download
              </a>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand)] transition hover:border-[var(--color-brand)] disabled:opacity-60"
                disabled={sharing}
                onClick={() => void share()}
                type="button"
              >
                <Share2 aria-hidden="true" size={16} />
                {sharing ? "Creating…" : "Share"}
              </button>
              {shareNote ? (
                <span role="status" className="text-xs font-semibold text-[var(--color-brand-strong)]">
                  {shareNote}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function CardSkeleton() {
  return (
    <li>
      <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white">
        <div className="aspect-[4/5] animate-pulse bg-[var(--color-skeleton)]" />
        <div className="grid gap-2 p-4">
          <span className="h-4 w-2/3 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
          <span className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-skeleton)]" />
        </div>
      </div>
    </li>
  );
}

export function MyLooks() {
  // The public layout supplies the viewer, so the heading can greet the
  // account holder by name. It falls back to "My looks" when there is no
  // first name on the account rather than printing an empty possessive.
  const viewer = useViewer();
  const firstName = viewer?.firstName?.trim();
  const heading = firstName ? `${firstName}’s looks` : "My looks";

  const { data, error, isLoading } = useSWR<AiStudioSession[]>(
    SESSIONS_KEY,
    () => fetchAiStudioSessions(PAGE_SIZE),
    { refreshInterval: REFRESH_MS, revalidateOnFocus: true },
  );

  return (
    <AiStudioChrome>
      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 md:px-8 md:py-12">
        <StudioModeTabs active="looks" />

        <div className="grid gap-3">
         
          <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
            {heading}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
            Every preview you have created. Only you can see these until you
            share one.
          </p>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <ul role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <CardSkeleton key={index} />
              ))}
            </ul>
          ) : error ? (
            <p
              role="alert"
              className="rounded-md border border-[var(--color-border)] bg-white p-5 text-sm text-[var(--color-text-muted)]"
            >
              Your looks could not be loaded just now. Refresh the page to try
              again.
            </p>
          ) : !data || data.length === 0 ? (
            <div className="grid justify-items-start gap-3 rounded-md border border-dashed border-[var(--color-border)] bg-white p-8">
              <h2 className="text-lg font-bold text-[var(--color-brand-strong)]">
                You have not created a look yet
              </h2>
              <p className="max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
                Choose a hairstyle, add a photo, and your preview will appear
                here.
              </p>
              <Link className="btn-primary mt-1 min-h-11" href="/ai-studio">
                Create your first look
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          ) : (
            <ul role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.map((look) => (
                <LookCard key={look.id} look={look} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </AiStudioChrome>
  );
}
