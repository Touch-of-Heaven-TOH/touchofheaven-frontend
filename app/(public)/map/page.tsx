import type { Metadata } from 'next';
import { preconnect } from 'react-dom';
import MapPageClient from '@/components/map/MapPageClient';

export const metadata: Metadata = {
  title: 'Find braiders near you',
  description:
    'Discover verified braiders near you on an interactive map and book directly.',
};

// Google Maps' JS SDK, tiles, and marker icons all come from these two
// hosts. BraiderMap lazy-loads (see MapPageClient's next/dynamic import),
// so the connection itself is the only thing worth starting eagerly here -
// warming up DNS/TLS ahead of the request shaves real latency off the
// first tile paint without downloading anything early.
function MapResourceHints() {
  preconnect('https://maps.googleapis.com');
  preconnect('https://maps.gstatic.com');
  return null;
}

export default function MapPage() {
  // No <main> here - app/(public)/layout.tsx already wraps every public
  // page's children in one. A second, nested <main> is an invalid
  // landmark structure (axe: landmark-main-is-top-level,
  // landmark-no-duplicate-main).
  return (
    <div className="h-dvh w-full">
      <MapResourceHints />
      <h1 className="sr-only">Find braiders near you</h1>
      <noscript>
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-lg font-medium text-purple-900">
            This page needs JavaScript
          </p>
          <p className="max-w-sm text-sm text-purple-700">
            The interactive braider map requires JavaScript to run.{' '}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberately
                a plain <a>, not <Link>: this only renders inside <noscript>, where
                Link's client-side navigation can't run anyway. */}
            <a href="/braiders" className="underline">
              Browse braiders without it
            </a>{' '}
            instead.
          </p>
        </div>
      </noscript>
      <MapPageClient />
    </div>
  );
}
