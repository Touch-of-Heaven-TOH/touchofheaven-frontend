import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { heroMediaItems } from "@/features/home/config/hero-media";
import { useHeroCarousel } from "@/features/home/components/hero/useHeroCarousel";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("useHeroCarousel", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("advances image slides after their configured duration", () => {
    vi.useFakeTimers();
    mockMatchMedia(false);

    const { result } = renderHook(() => useHeroCarousel({ items: heroMediaItems }));

    expect(result.current.activeIndex).toBe(0);
    act(() => {
      vi.advanceTimersByTime(heroMediaItems[0].displayDurationMs);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it("does not auto-advance when reduced motion is enabled", () => {
    vi.useFakeTimers();
    mockMatchMedia(true);

    const { result } = renderHook(() => useHeroCarousel({ items: heroMediaItems }));

    act(() => {
      vi.advanceTimersByTime(heroMediaItems[0].displayDurationMs * 2);
    });

    expect(result.current.activeIndex).toBe(0);
    expect(result.current.isReducedMotion).toBe(true);
  });

  it("supports keyboard next previous and pause controls", () => {
    mockMatchMedia(false);
    const preventDefault = vi.fn();
    const { result } = renderHook(() => useHeroCarousel({ items: heroMediaItems }));

    act(() => {
      result.current.onKeyDown({
        key: "ArrowRight",
        preventDefault,
      } as unknown as KeyboardEvent);
    });
    expect(result.current.activeIndex).toBe(1);

    act(() => {
      result.current.onKeyDown({
        key: "ArrowLeft",
        preventDefault,
      } as unknown as KeyboardEvent);
    });
    expect(result.current.activeIndex).toBe(0);

    act(() => {
      result.current.onKeyDown({
        key: " ",
        preventDefault,
      } as unknown as KeyboardEvent);
    });
    expect(result.current.isPaused).toBe(true);
  });
});
