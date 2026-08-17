"use client";

import type { HeroMediaItem } from "@/features/home/types/home.types";
import { HeroImageSlide } from "@/features/home/components/hero/HeroImageSlide";
import { useHeroCarousel } from "@/features/home/components/hero/useHeroCarousel";

type HeroMediaCarouselProps = {
  items: HeroMediaItem[];
};

const overlayClassByStrength: Record<HeroMediaItem["overlayStrength"], string> = {
  light:
    "from-[var(--color-page)]/94 via-[var(--color-page)]/68 to-[var(--color-page)]/16 md:via-[var(--color-page)]/58 md:to-[var(--color-page)]/8",
  medium:
    "from-[var(--color-page)]/94 via-[var(--color-page)]/72 to-[var(--color-page)]/24 md:via-[var(--color-page)]/64 md:to-[var(--color-page)]/12",
  strong:
    "from-[var(--color-page)]/96 via-[var(--color-page)]/78 to-[var(--color-page)]/32 md:via-[var(--color-page)]/72 md:to-[var(--color-page)]/18",
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
              <HeroImageSlide isActive={isActive} item={item} />
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
    </div>
  );
}
