'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';
import type { NearbyBraider } from '@/lib/discovery/types';
import { formatDistance, formatNextAvailableSlot } from '@/lib/discovery/format';

export type BraiderListSidebarProps = {
  braiders: NearbyBraider[];
  // Keyed by NearbyBraider.id (the location/service-area entry, one per
  // pin) - the same id BraiderMap's onBraiderSelect/selectedBraiderId use.
  // See that component's doc comment on BraiderMapProps for why it's the
  // entry id and not the underlying braiderId.
  selectedBraiderId?: string | null;
  onSelectBraider: (id: string) => void;
  isLoading?: boolean;
  // When set, the empty state shows this instead of the generic "no
  // braiders found" copy - a failed request isn't the same situation as a
  // real empty result set, and telling a visitor to "try widening your
  // search" when the actual problem is a network/server error is
  // actively misleading.
  error?: string | null;
};

const ROW_HEIGHT_PX = 108;

const SLOT_TONE_CLASSES: Record<string, string> = {
  available: 'text-green-700 bg-green-50',
  soon: 'text-amber-700 bg-amber-50',
  later: 'text-gray-700 bg-gray-100',
  full: 'text-gray-500 bg-gray-100',
};

/**
 * The list view of the discovery map - kept in sync with BraiderMap in
 * both directions: clicking a row here selects the same entry a map pin
 * click would, and selecting a pin on the map scrolls its row into view.
 * Virtualized with @tanstack/react-virtual since a busy metro area's
 * result set can run into the hundreds of rows across pages.
 */
export default function BraiderListSidebar({
  braiders,
  selectedBraiderId,
  onSelectBraider,
  isLoading,
  error,
}: BraiderListSidebarProps) {
  // @tanstack/react-virtual's useVirtualizer returns functions the React
  // Compiler can't safely memoize (see its own incompatible-library lint
  // warning) - "use no memo" is React's documented opt-out for exactly
  // this case, not a lint suppression.
  'use no memo';

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: braiders.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 6,
  });

  useEffect(() => {
    if (!selectedBraiderId) return;
    const index = braiders.findIndex((braider) => braider.id === selectedBraiderId);
    if (index === -1) return;
    virtualizer.scrollToIndex(index, { align: 'auto' });
  }, [selectedBraiderId, braiders, virtualizer]);

  if (!isLoading && error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
        <p className="text-sm font-medium text-gray-900">Couldn&apos;t load braiders</p>
        <p className="text-xs text-gray-500">{error}</p>
      </div>
    );
  }

  if (!isLoading && braiders.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
        <p className="text-sm font-medium text-gray-900">No braiders found nearby</p>
        <p className="text-xs text-gray-500">
          Try widening your search radius or clearing filters.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
      aria-busy={isLoading ? 'true' : undefined}
    >
      <ul
        role="list"
        aria-label="Nearby braiders"
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const braider = braiders[virtualRow.index];
          if (!braider) return null;

          const selected = braider.id === selectedBraiderId;
          const slot = formatNextAvailableSlot(
            braider.nextAvailableSlotAt,
            braider.nextAvailableSlotBucket,
          );

          return (
            <li
              key={braider.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <button
                type="button"
                onClick={() => onSelectBraider(braider.id)}
                aria-current={selected ? 'true' : undefined}
                className={`flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition ${
                  selected ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-purple-100">
                  {braider.photo ? (
                    // Plain <img>, not next/image - see BraiderProfileCard's
                    // CoverAndProfilePhoto comment on why R2 URLs use it.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={braider.photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {braider.professionalName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {formatDistance(braider.distanceKm)}
                  </p>
                  {braider.rating.count > 0 ? (
                    <p className="mt-0.5 text-xs text-gray-600">
                      <span aria-hidden="true" className="text-(--color-gold,#c9963c)">
                        ★
                      </span>{' '}
                      {braider.rating.average?.toFixed(1)} ({braider.rating.count})
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-gray-400">No reviews yet</p>
                  )}
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${SLOT_TONE_CLASSES[slot.tone]}`}
                  >
                    {slot.text}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
