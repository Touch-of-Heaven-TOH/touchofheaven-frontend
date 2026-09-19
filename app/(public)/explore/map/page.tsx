import type { Metadata } from "next";
import {
  type DiscoveryRouteSearch,
  SearchResultsPage,
} from "@/features/discovery/DiscoveryResults";

export const metadata: Metadata = {
  title: "Map discovery | Touch of Heaven",
  description:
    "Browse nearby Touch of Heaven businesses on an interactive, privacy-safe discovery map.",
};

export default async function ExploreMapPage({
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

  return <SearchResultsPage initialSearch={initialSearch} initialView="map" />;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
