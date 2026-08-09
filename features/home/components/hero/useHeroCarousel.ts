"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import type { HeroMediaItem } from "@/features/home/types/home.types";

type UseHeroCarouselInput = {
  items: HeroMediaItem[];
};

export type HeroCarouselState = {
  activeIndex: number;
  activeItem: HeroMediaItem;
  isPaused: boolean;
  isReducedMotion: boolean;
  next: () => void;
  previous: () => void;
  select: (index: number) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
};

const SWIPE_THRESHOLD_PX = 44;

export function useHeroCarousel({
  items,
}: UseHeroCarouselInput): HeroCarouselState {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const isPaused = isUserPaused || isInteractionPaused;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((index) => (index + 1) % items.length);
  }, [items.length]);

  const previous = useCallback(() => {
    setActiveIndex((index) => (index - 1 + items.length) % items.length);
  }, [items.length]);

  const select = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, items.length - 1)));
    },
    [items.length],
  );

  useEffect(() => {
    if (isPaused || isReducedMotion) return;

    const item = items[activeIndex];
    if (item.type === "video" && !item.loop) return;

    const timer = window.setTimeout(next, item.displayDurationMs);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, isReducedMotion, items, next]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }

      if (event.key === " ") {
        event.preventDefault();
        setIsUserPaused((value) => !value);
      }
    },
    [next, previous],
  );

  const onTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (touchStartX.current === null) return;

      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
      const delta = endX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (delta < 0) next();
      if (delta > 0) previous();
    },
    [next, previous],
  );

  const activeItem = useMemo(
    () => items[activeIndex] ?? items[0],
    [activeIndex, items],
  );

  return {
    activeIndex,
    activeItem,
    isPaused,
    isReducedMotion,
    next,
    previous,
    select,
    pause: () => setIsInteractionPaused(true),
    resume: () => setIsInteractionPaused(false),
    togglePause: () => setIsUserPaused((value) => !value),
    onKeyDown,
    onTouchStart,
    onTouchEnd,
  };
}
