import { describe, expect, it } from "vitest";
import { heroMediaItems, homeMediaAssets } from "@/features/home/config/hero-media";

describe("heroMediaItems", () => {
  it("keeps stable unique ids and a priority first slide", () => {
    const ids = heroMediaItems.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(heroMediaItems[0]?.priority).toBe(true);
    expect(heroMediaItems.slice(1).every((item) => !item.priority)).toBe(true);
  });

  it("requires posters for video slides", () => {
    const videos = heroMediaItems.filter((item) => item.type === "video");

    expect(videos.length).toBeGreaterThan(0);
    expect(videos.every((item) => item.poster)).toBe(true);
  });

  it("uses public homepage media paths only", () => {
    for (const asset of Object.values(homeMediaAssets)) {
      expect(asset.src).toMatch(/^\/images\/home\/images\//);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.alt.length).toBeGreaterThan(20);
    }
  });
});
