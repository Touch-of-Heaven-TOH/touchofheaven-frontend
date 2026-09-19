import type { StyleSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { guardNullComparisons } from "@/lib/maps/style-guards";

function styleWith(filter: unknown): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      { id: "background", type: "background" },
      { id: "shield", type: "symbol", source: "openmaptiles", filter } as StyleSpecification["layers"][number],
    ],
  };
}

describe("guardNullComparisons", () => {
  it("wraps a numeric comparison on a feature property", () => {
    const style = guardNullComparisons(
      styleWith(["all", ["<=", ["get", "ref_length"], 6], ["==", ["get", "network"], "us-interstate"]]),
    );
    const layer = style.layers[1] as { filter: unknown };
    expect(layer.filter).toEqual([
      "all",
      ["case", ["==", ["typeof", ["get", "ref_length"]], "number"], ["<=", ["get", "ref_length"], 6], false],
      ["==", ["get", "network"], "us-interstate"],
    ]);
  });

  it("handles the number on either side", () => {
    const style = guardNullComparisons(styleWith([">", 3, ["get", "rank"]]));
    expect((style.layers[1] as { filter: unknown }).filter).toEqual([
      "case",
      ["==", ["typeof", ["get", "rank"]], "number"],
      [">", 3, ["get", "rank"]],
      false,
    ]);
  });

  it("leaves other expressions and filterless layers alone", () => {
    const filter = ["match", ["geometry-type"], ["LineString"], true, false];
    const style = guardNullComparisons(styleWith(filter));
    expect((style.layers[1] as { filter: unknown }).filter).toEqual(filter);
    expect(style.layers[0]).toEqual({ id: "background", type: "background" });
  });
});
