import type { Metadata } from 'next';
import MapPageClient from '@/components/map/MapPageClient';

export const metadata: Metadata = {
  title: 'Find braiders near you',
  description:
    'Discover verified braiders near you on an interactive map and book directly.',
};

export default function MapPage() {
  return (
    <main className="h-dvh w-full">
      <MapPageClient />
    </main>
  );
}
