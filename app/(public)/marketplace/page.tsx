import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";
import { getPlatformFlags } from "@/lib/platform/flags";
import { FeatureUnavailable } from "@/components/layout/FeatureUnavailable";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Shop African beauty, hair care, groceries, drinks, and fashion on Touch of Heaven.",
};

const products = [
  ["Chebe Hair Growth Oil", "Hair & Beauty", "$18.99", "4.9", "63% center"],
  ["Hibiscus Ginger Drink", "African Drinks", "$5.99", "4.8", "8% center"],
  ["Cameroon Pepper Blend", "Spices & Foods", "$8.99", "4.7", "38% 72%"],
  ["Pre-Stretched Braiding Hair", "Braiding Hair", "$24.99", "4.9", "63% 20%"],
  ["Raw Shea Butter Cream", "Skincare", "$12.99", "4.8", "72% center"],
  ["Palm Nut Soup Spice Kit", "Groceries", "$14.99", "4.7", "30% 70%"],
  ["Satin Bonnet", "Hair Care", "$12.99", "4.8", "50% 82%"],
  ["Ankara Market Tote", "African Fashion", "$49.99", "4.8", "86% center"],
] as const;

export default async function MarketplacePage() {
  // The switch is the platform's, not the browser's. With the marketplace
  // off, the route itself stops serving the shop rather than merely
  // hiding the link to it.
  const { marketplaceEnabled } = await getPlatformFlags();
  if (!marketplaceEnabled) {
    return (
      <FeatureUnavailable
        title="The marketplace is closed just now"
        description="Our shop is temporarily unavailable. Booking, your appointments and everything else are working normally."
      />
    );
  }

  return (
    <section className="bg-white">
      <div className="page-container grid gap-8 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-16">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--color-brand-strong)]">
            Marketplace
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-[var(--color-brand-strong)]">
            Shop authentic African products for beauty days and home life.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
            Browse hair care, braiding hair, drinks, spices, groceries, and
            fashion in one clean product experience.
          </p>
        </div>
        <div className="relative aspect-[3/2] overflow-hidden rounded-md border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
          <Image
            alt={homeMediaAssets.marketplaceMixedProducts.alt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 56vw"
            src={homeMediaAssets.marketplaceMixedProducts.src}
            style={{ objectPosition: homeMediaAssets.marketplaceMixedProducts.focalPoint }}
          />
        </div>
      </div>

      <div className="page-container grid gap-4 pb-14 sm:grid-cols-2 lg:grid-cols-4">
        {products.map(([name, category, price, rating, position]) => (
          <article
            className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3 shadow-[var(--shadow-subtle)]"
            key={name}
          >
            <div className="relative aspect-square overflow-hidden rounded-md bg-white">
              <Image
                alt={`${name} product image`}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 46vw, 260px"
                src={homeMediaAssets.marketplaceMixedProducts.src}
                style={{ objectPosition: position }}
              />
            </div>
            <h2 className="mt-3 text-sm font-bold text-[var(--color-brand-strong)]">
              {name}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">{category}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-strong)]">
              <Star aria-hidden="true" className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={14} />
              {rating}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-bold text-[var(--color-brand-strong)]">
                {price}
              </span>
              <Link className="btn-primary" href={`/marketplace?product=${encodeURIComponent(name)}`}>
                <ShoppingBag aria-hidden="true" size={16} />
                Add
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
