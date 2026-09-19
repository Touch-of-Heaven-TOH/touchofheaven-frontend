import type { Metadata } from "next";
import {
  type DiscoveryRouteSearch,
  SearchResultsPage,
} from "@/features/discovery/DiscoveryResults";

export const metadata: Metadata = {
  title: "Discovery filters | Touch of Heaven",
  description:
    "Filter Touch of Heaven professionals by time, price, distance, rating, service location, verification, and accessibility.",
};

export default async function ExploreFiltersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const initialSearch: DiscoveryRouteSearch = {
    q: valueOf(params.q),
    location: valueOf(params.location),
    category: valueOf(params.category),
  };

  return (
    <SearchResultsPage
      initialSearch={initialSearch}
      showFiltersInitially
    />
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
