'use client';

import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useState } from 'react';
import type { NearbyBraider } from '@/lib/discovery/types';
import { formatDistance, formatNextAvailableSlot } from '@/lib/discovery/format';

export type BraiderProfileCardProps = {
  braider: NearbyBraider | null;
  onClose: () => void;
  onBookNow?: (braider: NearbyBraider) => void;
  onViewFullProfile?: (braider: NearbyBraider) => void;
};

const SLOT_TONE_CLASSES: Record<string, string> = {
  available: 'text-green-700 bg-green-50',
  soon: 'text-amber-700 bg-amber-50',
  later: 'text-gray-700 bg-gray-100',
  full: 'text-gray-500 bg-gray-100',
};

/**
 * The card that appears when a braider's pin (or a sidebar "View on map"
 * row) is selected. Desktop: a fixed panel bottom-left of the map.
 * Mobile: a bottom sheet, draggable by its handle bar only - not the whole
 * card - so scrolling the card's own content (the portfolio row, in
 * particular) never fights with the sheet's own drag gesture. That's why
 * `drag` is wired through Framer Motion's dragControls/dragListener={false}
 * pattern instead of putting `drag="y"` directly on the card.
 */
export default function BraiderProfileCard({
  braider,
  onClose,
  onBookNow,
  onViewFullProfile,
}: BraiderProfileCardProps) {
  const dragControls = useDragControls();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {braider ? (
        <motion.div
          key={braider.id}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_event, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) onClose();
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${braider.professionalName} profile`}
          className="fixed inset-x-0 bottom-0 z-30 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:absolute md:inset-x-auto md:bottom-4 md:left-4 md:max-h-[70%] md:w-[380px] md:rounded-2xl"
        >
          <div
            className="flex cursor-grab touch-none justify-center py-2 active:cursor-grabbing md:hidden"
            onPointerDown={(event) => dragControls.start(event)}
          >
            <div className="h-1.5 w-10 rounded-full bg-gray-300" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile card"
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow ring-1 ring-black/10 hover:bg-white"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="flex-1 overflow-y-auto">
            <CoverAndProfilePhoto braider={braider} />

            <div className="px-4 pt-10 pb-4">
              <NameAndLocation braider={braider} />
              <RatingsRow braider={braider} />
              <NextAvailableSlot braider={braider} />
              {braider.photos.length > 0 ? (
                <PortfolioRow
                  braider={braider}
                  onThumbnailClick={setLightboxIndex}
                />
              ) : null}
              <Actions
                braider={braider}
                onBookNow={onBookNow}
                onViewFullProfile={onViewFullProfile}
              />
            </div>
          </div>
        </motion.div>
      ) : null}

      {lightboxIndex !== null && braider ? (
        <PortfolioLightbox
          braider={braider}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </AnimatePresence>
  );
}

function CoverAndProfilePhoto({ braider }: { braider: NearbyBraider }) {
  // The schema has one portfolio-derived photo per braider, not separate
  // "cover" and "profile" images - the same photo fills both roles here.
  const photoUrl = braider.photo?.url ?? braider.photos[0]?.url ?? null;
  const altText = braider.photo?.altText ?? `${braider.professionalName}'s work`;

  return (
    <div className="relative h-40 w-full bg-purple-100">
      {/*
        Plain <img>, not next/image: these URLs come from R2
        (R2_PUBLIC_BASE_URL, only known at deploy time) and next/image
        refuses to optimize a domain that isn't listed in
        next.config.ts's images.remotePatterns. Wiring that up belongs to
        whoever owns the app-wide next.config.ts, once the real R2 domain
        is known - see docs/map-feature.md.
      */}
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- see comment above
        <img src={photoUrl} alt={altText} className="h-full w-full object-cover" />
      ) : null}
      <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-full border-4 border-(--color-gold,#c9963c) bg-white shadow-md">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- see comment above
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      {braider.acceptsNewClients ? (
        <span
          aria-label="Verified braider"
          title="Verified"
          className="absolute -bottom-8 left-12 flex h-5 w-5 translate-x-1 items-center justify-center rounded-full border-2 border-white bg-(--color-gold,#c9963c) text-[10px] text-white"
        >
          ✓
        </span>
      ) : null}
    </div>
  );
}

function NameAndLocation({ braider }: { braider: NearbyBraider }) {
  const locationText =
    braider.locationModel === 'PUBLIC_SALON'
      ? braider.address
      : (braider.locationLabel ?? 'Location shared after booking');

  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-gray-900">{braider.professionalName}</h2>
      {braider.specialties.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {braider.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
            >
              {specialty}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-1.5 text-sm text-gray-600">{locationText}</p>
      <p className="text-xs text-gray-400">{formatDistance(braider.distanceKm)}</p>
    </div>
  );
}

function RatingsRow({ braider }: { braider: NearbyBraider }) {
  if (braider.rating.count === 0) {
    return <p className="mb-3 text-sm text-gray-500">No reviews yet</p>;
  }

  return (
    <div className="mb-3 flex items-center gap-1.5 text-sm">
      <span aria-hidden="true" className="text-(--color-gold,#c9963c)">
        ★
      </span>
      <span className="font-medium text-gray-900">
        {braider.rating.average?.toFixed(1)}
      </span>
      <span className="text-gray-500">({braider.rating.count})</span>
      {/*
        A second "Google rating" column was part of the original design but
        is intentionally omitted: this platform has no stored Google Place
        ID for any braider yet, and no code path that calls the Places API
        to fetch one. Showing a rating here would mean fabricating a number
        with no real source behind it. Add it once a braider's Place ID is
        captured (likely during profile verification) and a server-side
        Places lookup exists to back it.
      */}
    </div>
  );
}

function NextAvailableSlot({ braider }: { braider: NearbyBraider }) {
  const { text, tone } = formatNextAvailableSlot(
    braider.nextAvailableSlotAt,
    braider.nextAvailableSlotBucket,
  );
  return (
    <div
      className={`mb-3 inline-block rounded-md px-2.5 py-1 text-sm font-medium ${SLOT_TONE_CLASSES[tone]}`}
    >
      {text}
    </div>
  );
}

function PortfolioRow({
  braider,
  onThumbnailClick,
}: {
  braider: NearbyBraider;
  onThumbnailClick: (index: number) => void;
}) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {braider.photos.map((photo, index) => (
        <button
          key={photo.url}
          type="button"
          onClick={() => onThumbnailClick(index)}
          className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- see CoverAndProfilePhoto's comment on why R2 URLs use <img> here */}
          <img
            src={photo.url}
            alt={photo.altText}
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}

function Actions({
  braider,
  onBookNow,
  onViewFullProfile,
}: {
  braider: NearbyBraider;
  onBookNow?: (braider: NearbyBraider) => void;
  onViewFullProfile?: (braider: NearbyBraider) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onBookNow?.(braider)}
        className="w-full rounded-lg bg-(--color-gold,#c9963c) py-3 text-sm font-semibold text-white transition hover:brightness-95"
      >
        Book Now
      </button>
      <button
        type="button"
        onClick={() => onViewFullProfile?.(braider)}
        className="mt-2 w-full text-center text-sm font-medium text-purple-700 hover:underline"
      >
        View full profile →
      </button>
    </div>
  );
}

function PortfolioLightbox({
  braider,
  index,
  onClose,
}: {
  braider: NearbyBraider;
  index: number;
  onClose: () => void;
}) {
  const photo = braider.photos[index];
  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${braider.professionalName}'s portfolio photo`}
    >
      <motion.div
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.92 }}
        className="relative max-h-full max-w-full"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- see CoverAndProfilePhoto's comment on why R2 URLs use <img> here */}
        <img
          src={photo.url}
          alt={photo.altText}
          className="max-h-[80dvh] w-auto rounded-lg object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg"
        >
          <span aria-hidden="true">×</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
