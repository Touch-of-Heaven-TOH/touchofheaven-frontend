import type { Metadata } from 'next';
import { SearchResultsPage } from '@/features/discovery/DiscoveryModule';

export const metadata: Metadata = {
  title: 'Find businesses near you',
  description:
    'Discover verified beauty and wellness businesses near you on an interactive map and book directly.',
};

export default function MapPage() {
  return <SearchResultsPage initialView="map" />;
}
