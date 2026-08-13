import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUnavailableHomePageData,
  fetchPublicHomePageData,
  PUBLIC_HOME_ENDPOINT,
} from "@/features/home/api/home.api";
import { serverApiFetch } from "@/lib/api/server";

vi.mock("@/lib/api/server", () => ({
  serverApiFetch: vi.fn(),
}));

const mockedServerApiFetch = vi.mocked(serverApiFetch);

describe("fetchPublicHomePageData", () => {
  beforeEach(() => {
    mockedServerApiFetch.mockReset();
  });

  it("normalizes a valid public homepage feed into ready sections", async () => {
    mockedServerApiFetch.mockResolvedValue({
      activity: [
        {
          id: "activity-1",
          label: "Jasmine booked knotless braids",
          detail: "Public-safe homepage activity",
          occurredAt: "2026-08-13T10:00:00.000Z",
        },
      ],
      featuredBraiders: [
        {
          id: "braider-1",
          name: "Touched by Tay",
          specialty: "Knotless braids",
          location: "Kathleen, GA",
          href: "/braiders/touched-by-tay",
          ratingAverage: 4.9,
          ratingCount: 128,
        },
      ],
      marketplaceProducts: [
        {
          id: "product-1",
          name: "Shea butter",
          category: "Hair care",
          href: "/marketplace/products/shea-butter",
          priceLabel: "$12.99",
          ratingAverage: 4.8,
          ratingCount: 92,
        },
      ],
    });

    const data = await fetchPublicHomePageData();

    expect(mockedServerApiFetch).toHaveBeenCalledWith(
      PUBLIC_HOME_ENDPOINT,
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(data.source).toBe("backend");
    expect(data.activity.status).toBe("ready");
    expect(data.featuredBraiders.status).toBe("ready");
    expect(data.marketplaceProducts.status).toBe("ready");
  });

  it("keeps the public homepage renderable when the feed is unavailable", async () => {
    mockedServerApiFetch.mockRejectedValue(new Error("backend unavailable"));

    await expect(fetchPublicHomePageData()).resolves.toEqual(
      createUnavailableHomePageData(),
    );
  });
});
