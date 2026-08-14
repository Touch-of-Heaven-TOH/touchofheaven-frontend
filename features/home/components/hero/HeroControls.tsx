"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { HeroMediaItem } from "@/features/home/types/home.types";

type HeroControlsProps = {
  activeIndex: number;
  items: HeroMediaItem[];
  isPaused: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
  onTogglePause: () => void;
};

export function HeroControls({
  activeIndex,
  items,
  isPaused,
  onNext,
  onPrevious,
  onSelect,
  onTogglePause,
}: HeroControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/80 p-1 text-[var(--color-brand)] shadow-[var(--shadow-subtle)] backdrop-blur">
        <button
          aria-label="Previous hero slide"
          className="grid size-9 place-items-center rounded-full hover:bg-[var(--color-brand-soft)]"
          type="button"
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>
        <button
          aria-label={isPaused ? "Play hero carousel" : "Pause hero carousel"}
          className="grid size-9 place-items-center rounded-full bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)]"
          type="button"
          onClick={onTogglePause}
        >
          {isPaused ? (
            <Play aria-hidden="true" size={16} />
          ) : (
            <Pause aria-hidden="true" size={16} />
          )}
        </button>
        <button
          aria-label="Next hero slide"
          className="grid size-9 place-items-center rounded-full hover:bg-[var(--color-brand-soft)]"
          type="button"
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
        {items.map((item, index) => (
          <button
            aria-label={`Show ${item.id.replaceAll("-", " ")} slide`}
            aria-selected={index === activeIndex}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex
                ? "w-8 bg-[var(--color-gold)]"
                : "w-2.5 bg-[var(--color-brand)]/25 hover:bg-[var(--color-brand)]/50"
            }`}
            key={item.id}
            role="tab"
            type="button"
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}
