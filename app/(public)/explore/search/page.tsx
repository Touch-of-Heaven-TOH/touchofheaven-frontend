import type { Metadata } from "next";
import {
  type DiscoveryRouteSearch,
  SearchResultsPage,
} from "@/features/discovery/DiscoveryResults";

export const metadata: Metadata = {
  title: "Search professionals | Touch of Heaven",
  description:
    "Search Touch of Heaven professionals by service, business, location, rating, price, and availability.",
};

export default async function ExploreSearchPage({
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

  return <SearchResultsPage initialSearch={initialSearch} />;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
