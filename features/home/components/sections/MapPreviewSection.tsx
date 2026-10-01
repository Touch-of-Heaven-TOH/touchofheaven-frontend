import Link from "next/link";
import { ExternalLink, LocateFixed, MapPinned } from "lucide-react";

export function MapPreviewSection() {
  return (
    <section className="bg-[var(--color-page)] py-8 md:py-12">
      <div className="page-container grid overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)] lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        <div className="grid content-center p-5 md:p-7">
          <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
            Near You
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)]">
            Explore businesses around Kathleen
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            This live map can be panned and zoomed. Use the full discovery map
            for filters, geolocation, and verified public profiles.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Link className="btn-primary" href="/explore?view=map">
              <LocateFixed aria-hidden="true" size={18} />
              Open discovery
            </Link>
            <Link className="btn-secondary" href="/explore">
              <MapPinned aria-hidden="true" size={18} />
              Browse all businesses
            </Link>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden bg-[var(--color-sage-soft)] md:min-h-[430px] lg:min-h-[500px]">
          <iframe
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=Kathleen%2C%20Georgia%2C%20USA&z=11&output=embed"
            title="Interactive map centered on Kathleen, Georgia"
          />
          <div className="absolute inset-0 -z-10 grid place-items-center p-6 text-center">
            <div>
              <MapPinned
                aria-hidden="true"
                className="mx-auto text-[var(--color-brand)]"
                size={36}
              />
              <p className="mt-3 text-sm font-bold text-[var(--color-brand-strong)]">
                Map preview loading
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                Open discovery if the embedded map is blocked by your browser.
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md border border-[var(--color-border)] bg-white/94 p-4 shadow-[var(--shadow-subtle)] backdrop-blur md:left-4 md:right-auto md:w-72">
            <p className="text-sm font-bold text-[var(--color-brand-strong)]">
              Full discovery has filters
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              Location-aware business cards remain on the dedicated map page.
            </p>
            <Link
              className="pointer-events-auto mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
              href="/explore?view=map"
            >
              Use discovery tools
              <ExternalLink aria-hidden="true" size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
