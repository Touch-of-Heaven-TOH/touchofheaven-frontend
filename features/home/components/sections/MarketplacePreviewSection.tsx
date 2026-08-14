import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  Globe2,
  Headphones,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  marketplaceCategories,
  marketplaceIntro,
} from "@/features/home/config/home-content";
import { homeMediaAssets } from "@/features/home/config/hero-media";
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

const demoProductShelf = [
  {
    name: "Chebe Hair Growth Oil",
    category: "Hair & Beauty",
    href: "/marketplace?product=chebe-hair-growth-oil",
    priceLabel: "$18.99",
    compareAt: "$24.99",
    saveLabel: "Save $6",
    badge: "Popular",
    image: homeMediaAssets.naturalHairCare,
  },
  {
    name: "Raw Shea Butter Cream",
    category: "Skincare",
    href: "/marketplace?product=raw-shea-butter",
    priceLabel: "$12.99",
    compareAt: "$16.99",
    saveLabel: "Save $4",
    badge: "New",
    image: homeMediaAssets.bookingMarketplace,
  },
  {
    name: "Ankara Market Tote",
    category: "African Fashion",
    href: "/marketplace?product=ankara-market-tote",
    priceLabel: "$49.99",
    compareAt: "$59.99",
    saveLabel: "Save $10",
    badge: "Limited",
    image: homeMediaAssets.brandPoster,
  },
  {
    name: "Braiding Prep Bundle",
    category: "Hair Essentials",
    href: "/marketplace?product=braiding-prep-bundle",
    priceLabel: "$34.99",
    compareAt: "$42.99",
    saveLabel: "Save $8",
    badge: "Bundle",
    image: homeMediaAssets.braidingDetail,
  },
] as const;

const originMarkets = ["Jamaica", "Nigeria", "Ivory Coast", "Kenya"] as const;

const marketPromises = [
  {
    title: "Shipping",
    description: "Nationwide fulfillment for approved marketplace products.",
    icon: Truck,
  },
  {
    title: "Delivery",
    description: "Local delivery rules stay separated from appointment booking.",
    icon: PackageCheck,
  },
  {
    title: "Pickup",
    description: "Pickup options can appear when a seller enables a location.",
    icon: ShoppingBag,
  },
  {
    title: "Support",
    description: "Help flows route product questions away from stylist chat.",
    icon: Headphones,
  },
] as const;

const promoCards = [
  {
    label: "Join our beauty community",
    action: "Get first access",
    href: "/sign-up",
  },
  {
    label: "Seller spotlight",
    action: "Meet marketplace vendors",
    href: "/marketplace",
  },
  {
    label: "Style + shop bundles",
    action: "Build your aftercare kit",
    href: "/book",
  },
] as const;

export function MarketplacePreviewSection({
  products,
}: MarketplacePreviewSectionProps) {
  const featuredProducts =
    products.status === "ready"
      ? products.items.slice(0, 4).map((product) => ({
          name: product.name,
          category: product.category,
          href: product.href,
          priceLabel: product.priceLabel ?? "View price",
          compareAt: "",
          saveLabel: "Published",
          badge: "Live",
          image: product.image,
        }))
      : demoProductShelf;

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <SectionHeading intro={marketplaceIntro} />

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {promoCards.map((card) => (
            <Link
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-5 text-center shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)]"
              href={card.href}
              key={card.label}
            >
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[var(--color-copper)]">
                <BadgePercent aria-hidden="true" size={15} />
                Community offer
              </p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-[var(--color-brand-strong)]">
                {card.label}
              </h3>
              <span className="mt-5 inline-flex rounded-full border border-[var(--color-brand)] px-5 py-2 text-sm font-bold text-[var(--color-brand)]">
                {card.action}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {marketplaceCategories.map((category) => (
            <MediaCard card={category} key={category.title} ratio="square" />
          ))}
        </div>

        <div className="mt-8 rounded-md bg-[var(--color-sage-soft)] px-4 py-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {originMarkets.map((origin, index) => (
              <div className="text-center" key={origin}>
                <span className="mx-auto grid size-28 place-items-center rounded-full bg-white text-[var(--color-brand)] shadow-[var(--shadow-subtle)]">
                  <Globe2 aria-hidden="true" size={34 + index * 2} />
                </span>
                <p className="mt-3 text-sm font-bold text-[var(--color-brand-strong)]">
                  {origin}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
                Featured Products
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[var(--color-brand-strong)]">
                Demo product shelf
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
                <article
                  className="relative overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3 shadow-[var(--shadow-subtle)]"
                  key={product.name}
                >
                  <span className="absolute right-3 top-3 z-10 rounded-sm bg-[var(--color-brand)] px-3 py-1 text-xs font-bold uppercase text-white">
                    {product.saveLabel}
                  </span>
                  <span className="absolute left-0 top-0 z-10 rounded-br-md bg-[var(--color-copper)] px-4 py-2 text-xs font-bold uppercase text-white">
                    {product.badge}
                  </span>
                  <Link
                    aria-label={`View ${product.name} in the marketplace`}
                    className="block h-full"
                    href={product.href}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md bg-white">
                      {product.image ? (
                        <Image
                          alt={product.image.alt}
                          className="object-cover transition duration-300 hover:scale-[1.03]"
                          fill
                          sizes="(max-width: 768px) 88vw, (max-width: 1024px) 44vw, 260px"
                          src={product.image.src}
                          style={{ objectPosition: product.image.focalPoint }}
                        />
                      ) : (
                        <span className="grid h-full place-items-center p-4 text-center text-sm font-bold text-[var(--color-brand)]">
                          Product image coming soon
                        </span>
                      )}
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-[var(--color-brand-strong)]">
                      {product.name}
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {product.category}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-[var(--color-brand-strong)]">
                        {product.priceLabel}
                      </span>
                      {product.compareAt ? (
                        <span className="text-[var(--color-text-muted)] line-through">
                          {product.compareAt}
                        </span>
                      ) : null}
                    </p>
                    <span className="btn-primary mt-4 w-full">
                      Buy now
                    </span>
                  </Link>
                </article>
              ))}
          </div>

          {products.status !== "ready" ? (
            <div className="mt-4">
              <DynamicStatusPanel
                actionHref="/marketplace"
                actionLabel="Preview marketplace"
                message={products.message}
                title="Live product feed is being connected"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {marketPromises.map((promise) => {
            const Icon = promise.icon;

            return (
              <article
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-5 text-center"
                key={promise.title}
              >
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-white text-[var(--color-brand)] shadow-[var(--shadow-subtle)]">
                  <Icon aria-hidden="true" size={25} />
                </span>
                <h3 className="mt-4 text-base font-bold text-[var(--color-brand-strong)]">
                  {promise.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {promise.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
