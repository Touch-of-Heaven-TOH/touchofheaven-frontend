import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  marketplaceCategories,
  marketplaceIntro,
} from "@/features/home/config/home-content";
import { DynamicStatusPanel } from "@/features/home/components/sections/DynamicStatusPanel";
import { MediaCard } from "@/features/home/components/sections/MediaCard";
import { SectionHeading } from "@/features/home/components/sections/SectionHeading";
import type {
  DynamicSection,
  PublicHomeProduct,
} from "@/features/home/types/home.types";

type MarketplacePreviewSectionProps = {
  products: DynamicSection<PublicHomeProduct>;
};

export function MarketplacePreviewSection({
  products,
}: MarketplacePreviewSectionProps) {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <SectionHeading intro={marketplaceIntro} />

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {marketplaceCategories.map((category) => (
            <MediaCard card={category} key={category.title} ratio="square" />
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
                Featured Products
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[var(--color-brand-strong)]">
                Published catalog preview
              </h3>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
              href="/marketplace"
            >
              <ShoppingBag aria-hidden="true" size={17} />
              View marketplace
            </Link>
          </div>

          {products.status === "ready" ? (
            <div className="grid gap-4 md:grid-cols-4">
              {products.items.slice(0, 4).map((product) => (
                <article
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3"
                  key={product.id}
                >
                  <Link href={product.href}>
                    <div className="relative aspect-square overflow-hidden rounded-md bg-white">
                      {product.image ? (
                        <Image
                          alt={product.image.alt}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 42vw, 240px"
                          src={product.image.src}
                        />
                      ) : null}
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-[var(--color-brand-strong)]">
                      {product.name}
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {product.category}
                    </p>
                    {product.priceLabel ? (
                      <p className="mt-2 text-sm font-bold text-[var(--color-copper)]">
                        {product.priceLabel}
                      </p>
                    ) : null}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <DynamicStatusPanel
              actionHref="/marketplace"
              actionLabel="Preview marketplace"
              message={products.message}
              title="Product feed pending"
            />
          )}
        </div>
      </div>
    </section>
  );
}
