import type { Metadata } from 'next';
import BraiderMap from '@/components/map/BraiderMap';

export const metadata: Metadata = {
  title: 'Find braiders near you',
  description:
    'Discover verified braiders near you on an interactive map and book directly.',
};

// This page is intentionally minimal until step 8 assembles the full
// experience (search panel, sidebar, profile card, and the
// useNearbyBraiders data flow that feeds this component's braiders prop).
export default function MapPage() {
  return (
    <main className="h-dvh w-full">
      <BraiderMap braiders={[]} />
    </main>
  );
}
