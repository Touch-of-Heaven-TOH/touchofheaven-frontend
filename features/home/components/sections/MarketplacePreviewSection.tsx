import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
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
    ratingText: "4.9 (128)",
    image: homeMediaAssets.marketplaceMixedProducts,
    imagePosition: "63% center",
  },
  {
    name: "Raw Shea Butter Cream",
    category: "Skincare",
    href: "/marketplace?product=raw-shea-butter",
    priceLabel: "$12.99",
    compareAt: "$16.99",
    saveLabel: "Save $4",
    badge: "New",
    ratingText: "4.8 (96)",
    image: homeMediaAssets.marketplaceMixedProducts,
    imagePosition: "72% center",
  },
  {
    name: "Cameroon Pepper Blend",
    category: "Spices & Foods",
    href: "/marketplace?product=cameroon-pepper-blend",
    priceLabel: "$8.99",
    compareAt: "$11.99",
    saveLabel: "Save $3",
    badge: "Spicy",
    ratingText: "4.7 (74)",
    image: homeMediaAssets.marketplaceMixedProducts,
    imagePosition: "38% 72%",
  },
  {
    name: "Braiding Prep Bundle",
    category: "Hair Essentials",
    href: "/marketplace?product=braiding-prep-bundle",
    priceLabel: "$34.99",
    compareAt: "$42.99",
    saveLabel: "Save $8",
    badge: "Bundle",
    ratingText: "4.9 (112)",
    image: homeMediaAssets.bookingMarketplace,
    imagePosition: "62% center",
  },
  {
    name: "Hibiscus Ginger Drink",
    category: "African Drinks",
    href: "/marketplace?product=hibiscus-ginger-drink",
    priceLabel: "$5.99",
    compareAt: "$7.99",
    saveLabel: "Save $2",
    badge: "Cold",
    ratingText: "4.8 (61)",
    image: homeMediaAssets.marketplaceMixedProducts,
    imagePosition: "7% center",
  },
  {
    name: "Pre-Stretched Braiding Hair",
    category: "Braiding Hair",
    href: "/marketplace?product=pre-stretched-braiding-hair",
    priceLabel: "$24.99",
    compareAt: "$29.99",
    saveLabel: "Save $5",
    badge: "Best Seller",
    ratingText: "4.9 (218)",
    image: homeMediaAssets.braidingDetail,
    imagePosition: "center center",
  },
  {
    name: "Ankara Market Tote",
    category: "African Fashion",
    href: "/marketplace?product=ankara-market-tote",
    priceLabel: "$49.99",
    compareAt: "$59.99",
    saveLabel: "Save $10",
    badge: "Limited",
    ratingText: "4.8 (87)",
    image: homeMediaAssets.marketplaceMixedProducts,
    imagePosition: "82% center",
  },
  {
    name: "Palm Nut Soup Spice Kit",
    category: "Groceries",
    href: "/marketplace?product=palm-nut-spice-kit",
    priceLabel: "$14.99",
    compareAt: "$18.99",
    saveLabel: "Save $4",
    badge: "Pantry",
    ratingText: "4.7 (54)",
    image: homeMediaAssets.marketplaceMixedProducts,
    imagePosition: "30% 70%",
  },
] as const;

const marketPromises = [
  {
    title: "Shipping",
    description: "Nationwide fulfillment for approved marketplace products.",
    icon: Truck,
  },
  {
    title: "Delivery",
    description: "Local delivery options appear for eligible nearby sellers.",
    icon: PackageCheck,
  },
  {
    title: "Pickup",
    description: "Pickup details are clear when a seller offers a local stop.",
    icon: ShoppingBag,
  },
  {
    title: "Support",
    description: "Marketplace questions stay organized outside stylist chat.",
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
      ? products.items.slice(0, 8).map((product) => ({
          name: product.name,
          category: product.category,
          href: product.href,
          priceLabel: product.priceLabel ?? "View price",
          compareAt: "",
          saveLabel: "Published",
          badge: "Live",
          ratingText: product.ratingAverage
            ? `${product.ratingAverage.toFixed(1)} (${product.ratingCount})`
            : "New",
          image: product.image,
          imagePosition: product.image?.focalPoint ?? "center center",
        }))
      : demoProductShelf;

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <SectionHeading intro={marketplaceIntro} />

        <div className="mt-6 grid overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-soft)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center p-5 md:p-7">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-[var(--color-copper)]">
              <ShoppingBag aria-hidden="true" size={15} />
              Marketplace preview
            </p>
            <h3 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-brand-strong)] md:text-4xl">
              Curated essentials for every style day.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
              Shop beauty, fashion, pantry, and aftercare finds in one place,
              with clear pricing, savings, and direct actions for repeat
              shopping.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Hair care", "African fashion", "Pantry goods", "Aftercare kits"].map(
                (tag) => (
                  <span
                    className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-bold text-[var(--color-brand)]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="relative min-h-[260px] overflow-hidden bg-white md:min-h-[340px]">
            <Image
              alt={homeMediaAssets.marketplaceMixedProducts.alt}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              src={homeMediaAssets.marketplaceMixedProducts.src}
              style={{ objectPosition: homeMediaAssets.marketplaceMixedProducts.focalPoint }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {promoCards.map((card) => (
            <Link
              className="rounded-md border border-[var(--color-border)] bg-white p-5 text-center shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-soft)]"
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

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
                Featured products
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[var(--color-brand-strong)]">
                Product shelf
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
                className="relative overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3 shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
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
                        style={{ objectPosition: product.imagePosition }}
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
                  <p className="mt-2 text-xs font-bold text-[var(--color-brand-strong)]">
                    ★ {product.ratingText}
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
                  <span className="btn-primary mt-4 w-full">Add to Cart</span>
                </Link>
              </article>
            ))}
          </div>

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
