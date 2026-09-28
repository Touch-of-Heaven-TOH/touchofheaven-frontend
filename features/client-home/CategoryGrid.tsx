"use client";

import {
  Brush,
  Car,
  Flower2,
  Grid2x2,
  Hand,
  Scissors,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { categoryHref, type HomeCategory } from "@/features/client-home/api";

/**
 * The category tiles.
 *
 * The backend says which icon each category uses; this file owns the
 * artwork. An unknown key falls back to a neutral mark rather than
 * breaking the row, so an administrator can add a category today and we
 * can draw it properly later.
 */
const ICONS: Record<string, LucideIcon> = {
  all: Grid2x2,
  braids: Waves,
  nails: Hand,
  barber: Scissors,
  spa: Flower2,
  natural: Sparkles,
  makeup: Brush,
  mobile: Car,
  locs: Waves,
  twists: Waves,
  sparkles: Sparkles,
};

export function CategoryGrid({
  categories,
  failed,
  onRetry,
  limit,
}: {
  categories: HomeCategory[];
  failed: boolean;
  onRetry: () => void;
  /** The mobile design shows eight tiles; desktop shows six. */
  limit?: number;
}) {
  if (failed) {
    return (
      <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] p-4 text-sm">
        <p className="text-[var(--color-text-muted)]">
          We couldn&apos;t load the categories.
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

  if (categories.length === 0) return null;

  const shown = limit ? categories.slice(0, limit) : categories;

  return (
    <ul
      role="list"
      className="grid grid-cols-4 gap-3 sm:gap-4 lg:grid-cols-6 lg:gap-5"
    >
      {shown.map((category) => {
        const Icon = ICONS[category.iconKey] ?? Sparkles;
        return (
          <li key={category.id} className="min-w-0">
            {/* The whole tile is the link, not just the icon. */}
            <Link
              href={categoryHref(category.slug)}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[var(--radius-panel,16px)] bg-[var(--color-brand-soft)] px-2 py-3 text-center transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--color-brand-soft)]/70 focus-ring motion-reduce:transform-none"
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-7 text-[var(--color-brand)] sm:size-8"
              />
              <span className="line-clamp-2 text-xs leading-tight font-medium text-[var(--color-text-primary)] sm:text-sm">
                {category.name}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
