"use client";

import { Globe, Heart, Lock, Pencil, Users } from "lucide-react";
import { useState } from "react";
import {
  VISIBILITY_LABELS,
  type ItemVisibility,
  type PortfolioItem,
} from "@/features/account/portfolio/api";

/**
 * The portfolio itself. Every card says who can see it, because that is
 * the thing a person most needs to know at a glance about a photo of
 * themselves - and the thing they most regret getting wrong.
 */

const VISIBILITY_STYLE: Record<
  ItemVisibility,
  { icon: typeof Globe; className: string }
> = {
  PUBLIC: { icon: Globe, className: "bg-white text-[var(--color-text-primary)]" },
  SHARED_WITH_PROFESSIONALS: {
    icon: Users,
    className: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  },
  PRIVATE: {
    icon: Lock,
    className: "bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]",
  },
};

export function VisibilityBadge({
  visibility,
  /** Set where there is room for the whole label, such as inside a dialog. */
  allowFullLabel = false,
}: {
  visibility: ItemVisibility;
  allowFullLabel?: boolean;
}) {
  const meta = VISIBILITY_STYLE[visibility];
  const Icon = meta.icon;
  return (
    // nowrap either way: a two-line badge reads as damage. Over a photo it
    // may also have to truncate, since "Shared with professional" is longer
    // than a card is wide at 375px - but not where the room exists.
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
        allowFullLabel ? "shrink-0" : "min-w-0 shrink"
      } ${meta.className}`}
    >
      <Icon aria-hidden="true" size={13} className="shrink-0" />
      <span className={allowFullLabel ? "" : "truncate"}>
        {VISIBILITY_LABELS[visibility]}
      </span>
    </span>
  );
}

export function PortfolioGrid({
  items,
  canEdit,
  onEdit,
}: {
  items: PortfolioItem[];
  canEdit: boolean;
  onEdit: (item: PortfolioItem) => void;
}) {
  return (
    <ul role="list" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <PortfolioCard key={item.id} item={item} canEdit={canEdit} onEdit={onEdit} />
      ))}
    </ul>
  );
}

function PortfolioCard({
  item,
  canEdit,
  onEdit,
}: {
  item: PortfolioItem;
  canEdit: boolean;
  onEdit: (item: PortfolioItem) => void;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <li className="group relative min-w-0 overflow-hidden rounded-[var(--radius-panel)] bg-[var(--color-surface-strong)]">
      <div className="relative aspect-[4/5]">
        {item.thumbnailUrl ? (
          // Portfolio photos live in object storage, which next/image isn't
          // configured for; a plain img avoids a broken optimiser round trip.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={item.title}
            src={item.thumbnailUrl}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[var(--color-brand-soft)] p-3 text-center text-xs text-[var(--color-text-muted)]">
            Photo storage isn&apos;t set up yet
          </div>
        )}

        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)]">
          <VisibilityBadge visibility={item.visibility} />
        </span>

        {canEdit ? (
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.title}`}
            // Always present on touch, where there is no hover to reveal it.
            className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-white/90 text-[var(--color-brand)] opacity-100 shadow-sm transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
          >
            <Pencil aria-hidden="true" size={16} />
          </button>
        ) : null}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-bold text-white drop-shadow">
            {item.title}
          </span>
          <button
            type="button"
            onClick={() => setSaved((current) => !current)}
            aria-pressed={saved}
            aria-label={saved ? `Unsave ${item.title}` : `Save ${item.title}`}
            className="grid size-11 shrink-0 place-items-center rounded-full text-white"
          >
            <Heart
              aria-hidden="true"
              size={18}
              className={saved ? "fill-white" : ""}
            />
          </button>
        </span>
      </div>
    </li>
  );
}
