import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { heroMediaItems } from "@/features/home/config/hero-media";
import { HeroVideoSlide } from "@/features/home/components/hero/HeroVideoSlide";

const videoItem = heroMediaItems.find((item) => item.type === "video");

describe("HeroVideoSlide", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("plays only when active and pauses when inactive", () => {
    expect(videoItem).toBeDefined();

    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);

    const { rerender } = render(
      <HeroVideoSlide
        isActive
        isReducedMotion={false}
        item={videoItem!}
        onEnded={vi.fn()}
      />,
    );

    expect(play).toHaveBeenCalledTimes(1);

    rerender(
      <HeroVideoSlide
        isActive={false}
        isReducedMotion={false}
        item={videoItem!}
        onEnded={vi.fn()}
      />,
    );

    expect(pause).toHaveBeenCalled();
  });
});
