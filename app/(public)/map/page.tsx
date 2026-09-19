import type { Metadata } from 'next';
import {
  type DiscoveryRouteSearch,
  SearchResultsPage,
} from '@/features/discovery/DiscoveryResults';

export const metadata: Metadata = {
  title: 'Find businesses near you',
  description:
    'Discover verified beauty and wellness businesses near you on an interactive map and book directly.',
};

export default async function MapPage({
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
