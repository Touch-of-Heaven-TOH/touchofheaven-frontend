import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Touch of Heaven marketplace preview. Product shopping is not active until backend operations are approved.",
  robots: { index: false, follow: true },
};

export default function MarketplacePage() {
  return (
    <section className="page-container py-16">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        Marketplace preview
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[var(--color-text-primary)]">
        Product shopping is planned, not live.
      </h1>
      <div className="surface-panel mt-8 p-6">
        <p className="text-base leading-8 text-[var(--color-text-muted)]">
          The marketplace has a documented expansion path, but this route avoids
          fake cart, inventory, order, fulfillment, seller approval, commission,
          and payout behavior until those backend flows are explicitly ready.
        </p>
        <Link className="btn-primary mt-6" href="/braiders">
          Book a service
        </Link>
      </div>
    </section>
  );
}
