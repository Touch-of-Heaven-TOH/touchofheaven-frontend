import type { Metadata } from 'next';
import BraiderMap from '@/components/map/BraiderMap';

export const metadata: Metadata = {
  title: 'Find braiders near you',
  description:
    'Discover verified braiders near you on an interactive map and book directly.',
};

// Step 1 of the braider discovery map build: proves the map renders. The
// surrounding page chrome (search panel, sidebar, profile card) is
// assembled in a later step - this page intentionally stays minimal until
// then.
export default function MapPage() {
  return (
    <main className="h-dvh w-full">
      <BraiderMap />
    </main>
  );
}
