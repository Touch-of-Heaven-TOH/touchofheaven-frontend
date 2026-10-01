import type { Metadata } from "next";
import {
  type DiscoveryRouteSearch,
  type DiscoveryView,
  SearchResultsPage,
} from "@/features/discovery/DiscoveryResults";

export const metadata: Metadata = {
  title: "Explore | Touch of Heaven",
  description:
    "Discover verified beauty and wellness businesses near you, compare services, and book with confidence.",
};

/*
 * The one discovery page.
 *
 * Browse, results and the map used to be six separate routes rendering two
 * components between them, with two pairs that were byte-identical. They are
 * three states of this page now: no query browses, a query shows results,
 * and ?view=map shows the map. Everything else redirects here - see the
 * redirects in next.config.ts.
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const initialSearch: DiscoveryRouteSearch = {
    q: valueOf(params.q),
    location: valueOf(params.location),
    category: valueOf(params.category),
    date: valueOf(params.date),
  };
  const view: DiscoveryView = valueOf(params.view) === "map" ? "map" : "grid";

  return (
    <SearchResultsPage
      initialSearch={initialSearch}
      initialView={view}
      showFiltersInitially={valueOf(params.filters) === "open"}
    />
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
