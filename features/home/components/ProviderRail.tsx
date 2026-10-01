"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A row of provider cards you step through, with one split control.
 *
 * A "browse everything" link sent people away from the section instead of
 * letting them see what is in it. This keeps them here: the two halves
 * move to the previous and next card, and each half goes flat when there
 * is nothing further that way, so the control always says whether there
 * is more to see.
 *
 * The rail still scrolls and swipes on its own, so the buttons are an
 * addition rather than the only way through - which is what makes it
 * usable by keyboard and by touch alike.
 */
export function ProviderRail({ children }: { children: ReactNode }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 1);
    // A rail with nothing to scroll counts as being at the end, so both
    // halves read as unavailable rather than one of them lying.
    setAtEnd(max <= 1 || rail.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    measure();
    const rail = railRef.current;
    if (!rail) return;
    // The cards have to be watched, not just the rail. The rail's own box
    // is a fixed-width cell in the page grid, so it never resizes, while
    // what decides whether there is anything further to scroll is the
    // total width of the cards inside it - and those settle after mount.
    // Observing the rail alone kept that first, premature measurement,
    // which left the next half enabled on a rail with nothing more to show.
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    for (const card of Array.from(rail.children)) observer.observe(card);
    return () => observer.disconnect();
  }, [measure]);

  function step(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    // One card at a time, whatever a card currently measures.
    const card = rail.querySelector("li");
    const distance = card
      ? card.getBoundingClientRect().width + 16
      : rail.clientWidth * 0.8;
    rail.scrollBy({ left: distance * direction, behavior: "smooth" });
  }

  const half =
    "grid size-11 place-items-center transition-colors disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]/40 enabled:hover:bg-[var(--color-brand-soft)] enabled:text-[var(--color-brand)] focus-ring";

  return (
    <>
      <div className="inline-flex shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-white">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atStart}
          aria-label="Show the previous professional"
          className={`${half} border-r border-[var(--color-border)]`}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={atEnd}
          aria-label="Show the next professional"
          className={half}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>

      <ul
        ref={railRef}
        onScroll={measure}
        role="list"
        className="col-span-full mt-8 flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
    </>
  );
}
