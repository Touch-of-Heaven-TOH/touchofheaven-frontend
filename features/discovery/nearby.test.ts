import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NearbyBraider } from "@/lib/discovery/types";

const browserApiFetch = vi.fn();
vi.mock("@/lib/api/browser", () => ({
  browserApiFetch: (...args: unknown[]) => browserApiFetch(...args),
}));

const {
  clampRadiusKm,
  fetchNearbyProviders,
  formatNextOpening,
  hasMappableLocation,
  mainServiceType,
  widerRadiusKm,
} = await import("@/features/discovery/nearby");

function provider(overrides: Partial<NearbyBraider> = {}): NearbyBraider {
  return {
    id: "loc-1",
    kind: "location",
    braiderId: "business-1",
    professionalName: "Amara Hair Studio",
    bio: null,
    locationLabel: "Akwa Salon, Douala",
    locationModel: "PUBLIC_SALON",
    isApproximateLocation: false,
    address: "Rue Joss, Akwa, Douala",
    latitude: 4.0511,
    longitude: 9.7085,
    radiusMiles: null,
    photo: null,
    photos: [],
    specialties: ["Knotless Braids"],
    rating: { average: null, count: 0 },
    nextAvailableSlotAt: null,
    nextAvailableSlotBucket: "NONE",
    acceptsNewClients: true,
    distanceKm: 0.6,
    ...overrides,
  };
}

describe("fetchNearbyProviders", () => {
  beforeEach(() => {
    browserApiFetch.mockReset();
    browserApiFetch.mockResolvedValue({ braiders: [], total: 0, searchCenter: { latitude: 0, longitude: 0 } });
  });

  it("asks the nearby endpoint with fixed-decimal coordinates and a 10 km default", async () => {
    await fetchNearbyProviders(4.0483, 9.7043);
    expect(browserApiFetch).toHaveBeenCalledWith(
      "/api/v1/braiders/nearby?lat=4.04830&lng=9.70430&radius=10&limit=20",
    );
  });

  it("never sends exponent notation for tiny coordinates", async () => {
    await fetchNearbyProviders(0.0000001, -0.0000001, 25);
    const [path] = browserApiFetch.mock.calls[0] as [string];
    expect(path).not.toContain("e-");
    expect(path).toContain("radius=25");
  });

  it("passes filters and pages through", async () => {
    await fetchNearbyProviders(4, 9, 50, { locationType: "PRIVATE_STUDIO", acceptingNewClients: true, page: 2 });
    const [path] = browserApiFetch.mock.calls[0] as [string];
    const params = new URL(path, "http://x").searchParams;
    expect(params.get("locationType")).toBe("PRIVATE_STUDIO");
    expect(params.get("acceptingNewClients")).toBe("true");
    expect(params.get("page")).toBe("2");
  });

  it("keeps the radius inside what the backend accepts", async () => {
    await fetchNearbyProviders(4, 9, 9000);
    expect(browserApiFetch.mock.calls[0]?.[0]).toContain("radius=500");
  });
});

describe("hasMappableLocation", () => {
  it("pins a real location", () => {
    expect(hasMappableLocation(provider())).toBe(true);
  });

  it("skips mobile-only providers, which have no place to pin", () => {
    expect(hasMappableLocation(provider({ kind: "serviceArea", locationModel: "MOBILE", radiusMiles: 10 }))).toBe(false);
  });

  it("never pins at 0,0 or outside the globe", () => {
    expect(hasMappableLocation(provider({ latitude: 0, longitude: 0 }))).toBe(false);
    expect(hasMappableLocation(provider({ latitude: Number.NaN }))).toBe(false);
    expect(hasMappableLocation(provider({ latitude: 91 }))).toBe(false);
  });
});

describe("radius helpers", () => {
  it("clamps and rounds", () => {
    expect(clampRadiusKm(0.2)).toBe(1);
    expect(clampRadiusKm(12.6)).toBe(13);
    expect(clampRadiusKm(Number.POSITIVE_INFINITY)).toBe(10);
  });

  it("steps up the ladder and stops at the maximum", () => {
    expect(widerRadiusKm(10)).toBe(25);
    expect(widerRadiusKm(13)).toBe(25);
    expect(widerRadiusKm(500)).toBeNull();
  });
});

describe("display helpers", () => {
  it("uses the first published service as the main service", () => {
    expect(mainServiceType(provider())).toBe("Knotless Braids");
    expect(mainServiceType(provider({ specialties: [] }))).toBe("Salon");
  });

  it("describes the next opening relative to today", () => {
    const now = new Date(2026, 8, 19, 8, 0);
    expect(formatNextOpening(null, now)).toBe("No openings in the next 2 weeks");
    expect(formatNextOpening(new Date(2026, 8, 19, 14, 0).toISOString(), now)).toMatch(/^Today, /);
    expect(formatNextOpening(new Date(2026, 8, 20, 9, 30).toISOString(), now)).toMatch(/^Tomorrow, /);
    expect(formatNextOpening(new Date(2026, 8, 24, 9, 0).toISOString(), now)).not.toMatch(/^(Today|Tomorrow)/);
  });
});
