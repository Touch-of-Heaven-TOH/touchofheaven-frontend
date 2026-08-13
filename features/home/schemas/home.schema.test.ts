import { describe, expect, it } from "vitest";
import { parsePublicHomePagePayload } from "@/features/home/schemas/home.schema";

describe("parsePublicHomePagePayload", () => {
  it("drops malformed dynamic homepage records instead of trusting them", () => {
    const payload = parsePublicHomePagePayload({
      activity: [{ id: "a1", label: "Booked", detail: "Public-safe", occurredAt: "now" }, {}],
      featuredBraiders: [{ id: "missing-required" }],
      marketplaceProducts: [
        {
          id: "p1",
          name: "Shea butter",
          category: "Hair care",
          href: "/marketplace/products/p1",
          priceLabel: "$12.99",
          ratingAverage: 4.8,
          ratingCount: 12,
        },
      ],
    });

    expect(payload.activity).toHaveLength(1);
    expect(payload.featuredBraiders).toHaveLength(0);
    expect(payload.marketplaceProducts).toHaveLength(1);
  });

  it("returns empty arrays for non-object responses", () => {
    expect(parsePublicHomePagePayload(null)).toEqual({
      activity: [],
      featuredBraiders: [],
      marketplaceProducts: [],
    });
  });
});
