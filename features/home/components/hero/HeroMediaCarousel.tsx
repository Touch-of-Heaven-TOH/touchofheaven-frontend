"use client";

import type { HeroMediaItem } from "@/features/home/types/home.types";
import { HeroControls } from "@/features/home/components/hero/HeroControls";
import { HeroImageSlide } from "@/features/home/components/hero/HeroImageSlide";
import { HeroProgress } from "@/features/home/components/hero/HeroProgress";
import { HeroVideoSlide } from "@/features/home/components/hero/HeroVideoSlide";
import { useHeroCarousel } from "@/features/home/components/hero/useHeroCarousel";

type HeroMediaCarouselProps = {
  items: HeroMediaItem[];
};

const overlayClassByStrength: Record<HeroMediaItem["overlayStrength"], string> = {
  light: "from-[var(--color-page)] via-[var(--color-page)]/80 to-[var(--color-page)]/20",
  medium: "from-[var(--color-page)] via-[var(--color-page)]/90 to-[var(--color-page)]/28",
  strong: "from-[var(--color-page)] via-[var(--color-page)]/95 to-[var(--color-page)]/42",
};

export function HeroMediaCarousel({ items }: HeroMediaCarouselProps) {
  const carousel = useHeroCarousel({ items });

  return (
    <div
      aria-label="Homepage media carousel"
      className="absolute inset-0"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          carousel.resume();
        }
      }}
      onFocus={carousel.pause}
      onKeyDown={carousel.onKeyDown}
      onMouseEnter={carousel.pause}
      onMouseLeave={carousel.resume}
      onTouchEnd={carousel.onTouchEnd}
      onTouchStart={carousel.onTouchStart}
      role="region"
      tabIndex={-1}
    >
      <div className="absolute inset-0 overflow-hidden">
        {items.map((item, index) => {
          const isActive = index === carousel.activeIndex;

          return (
            <div
              aria-hidden={!isActive}
              className="absolute inset-0"
              key={item.id}
            >
              {item.type === "video" ? (
                <HeroVideoSlide
                  isActive={isActive}
                  isReducedMotion={carousel.isReducedMotion}
                  item={item}
                  onEnded={carousel.next}
                />
              ) : (
                <HeroImageSlide isActive={isActive} item={item} />
              )}
            </div>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-r ${
          overlayClassByStrength[carousel.activeItem.overlayStrength]
        }`}
      />
      <div className="absolute inset-x-0 bottom-4 z-10 hidden md:block">
        <div className="page-container flex items-end justify-between gap-4">
          <HeroProgress activeIndex={carousel.activeIndex} total={items.length} />
          <HeroControls
            activeIndex={carousel.activeIndex}
            isPaused={carousel.isPaused || carousel.isReducedMotion}
            items={items}
            onNext={carousel.next}
            onPrevious={carousel.previous}
            onSelect={carousel.select}
            onTogglePause={carousel.togglePause}
          />
        </div>
      </div>
    </div>
  );
}
