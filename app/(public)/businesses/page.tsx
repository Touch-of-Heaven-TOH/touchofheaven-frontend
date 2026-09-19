import type { Metadata } from "next";
import {
  type DiscoveryRouteSearch,
  SearchResultsPage,
} from "@/features/discovery/DiscoveryResults";

export const metadata: Metadata = {
  title: "Professionals near you | Touch of Heaven",
  description:
    "Browse verified Touch of Heaven beauty and wellness businesses and open public profiles.",
};

export default async function BusinessesPage({
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
