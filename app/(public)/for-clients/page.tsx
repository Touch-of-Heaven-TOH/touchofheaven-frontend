import type { Metadata } from "next";
import Image from "next/image";
import { ProviderRail } from "@/features/home/components/ProviderRail";
import Link from "next/link";
import {
  MapPin,
  ShoppingBag,
  Star,
} from "lucide-react";
import { brandAssets } from "@/config/site";

export const metadata: Metadata = {
  title: "For Clients",
  description:
    "Find trusted beauty businesses, barbers, nail techs, and authentic African products with Touch of Heaven.",
};

const featuredProviders = [
  {
    name: "Touched by Tee",
    service: "Knotless braids specialist",
    location: "Warner Robins, GA",
    rating: "4.9",
    reviews: "128",
    image: "/images/ai-studio/catalog/boho-medium-waist-front.jpg",
  },
  {
    name: "Hair by Milly",
    service: "Boho braids and passion twists",
    location: "Atlanta, GA",
    rating: "4.8",
    reviews: "96",
    image: "/images/ai-studio/catalog/faux-medium-waist-front.jpg",
  },
  {
    name: "Braids by LaLa",
    service: "Cornrows and feed-ins",
    location: "Macon, GA",
    rating: "4.9",
    reviews: "176",
    image: "/images/ai-studio/catalog/knotless-small-waist-front.jpg",
  },
] as const;

const productCards = [
  {
    name: "Chebe Hair Growth Oil",
    price: "$16.99",
    image: "/images/home/images/hairoil.png",
  },
  {
    name: "African Spices Bundle",
    price: "$12.99",
    image: "/images/home/images/spice1.png",
  },
  {
    name: "Grocery Essentials",
    price: "$24.99",
    image: "/images/home/images/grocries.png",
  },
  {
    name: "Premium Hair Care Set",
    price: "$29.99",
    image: "/images/home/images/prodgrocrey.png",
  },
] as const;






function ClientPhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[310px] rounded-[38px] border-[10px] border-[#1f1720] bg-[#1f1720] p-2 shadow-[0_28px_80px_rgba(43,23,36,0.28)]">
      <div className="overflow-hidden rounded-[28px] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <Image alt="" height={32} src={brandAssets.logoMark} width={32} />
          <span className="text-xs font-bold text-[var(--color-text-muted)]">
            9:41
          </span>
        </div>
        <div className="grid gap-3 p-4">
          <div className="rounded-md bg-[var(--color-brand-strong)] p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-gold-light)]">
              Today near you
            </p>
            <h3 className="mt-2 text-xl font-bold">Boho braids</h3>
            <p className="mt-1 text-sm text-white/72">
              4 openings this afternoon
            </p>
          </div>
          {featuredProviders.slice(0, 2).map((provider) => (
            <div
              className="flex items-center gap-3 rounded-md border border-[var(--color-border)] p-3"
              key={provider.name}
            >
              <div className="relative size-14 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="56px"
                  src={provider.image}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--color-brand-strong)]">
                  {provider.name}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {provider.location}
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-success-soft)] px-2 py-1 text-xs font-bold text-[var(--color-success)]">
                Open
              </span>
            </div>
          ))}
          <Link className="btn-primary w-full" href="/map">
            Open map
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForClientsPage() {
  return (
    <div className="bg-[var(--color-page)]">
     
      <section className="page-container py-14 md:py-18">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
              Trusted providers
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[var(--color-brand-strong)] md:text-5xl">
              Top professionals near you.
            </h2>
          </div>
          <ProviderRail>
          {featuredProviders.map((provider) => (
            <li
              className="w-[82%] shrink-0 snap-start sm:w-[48%] lg:w-[calc((100%-2rem)/3)]"
              key={provider.name}
            >
            <article className="h-full overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
              <div className="relative aspect-[16/10] bg-[var(--color-brand-soft)]">
                <Image
                  alt={`Finished style from ${provider.name}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 92vw, 360px"
                  src={provider.image}
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-[var(--color-brand-strong)]">
                  {provider.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {provider.service}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden="true" size={15} />
                    {provider.location}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[var(--color-brand-strong)]">
                    <Star
                      aria-hidden="true"
                      className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                      size={15}
                    />
                    {provider.rating} ({provider.reviews})
                  </span>
                </div>
                <Link className="btn-primary mt-5 w-full" href="/businesses">
                  View profile
                </Link>
              </div>
            </article>
            </li>
          ))}
          </ProviderRail>
        </div>
      </section>
      
      <section className="bg-white py-14 md:py-18">
        <div className="page-container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
              Search like a concierge
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-5xl">
              Choose by service, location, time, or the look you already saved.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
              The client side is designed for fast discovery: clear provider
              cards, strong search filters, direct booking paths, and product
              shopping without bouncing between different apps.
            </p>
           
          </div>
          <ClientPhonePreview />
        </div>
      </section>

      <section className="bg-white py-14 md:py-18">
        <div className="page-container">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
                Marketplace
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-5xl">
                Shop the products that support your appointment.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
                Hair bundles, oils, bonnets, spices, drinks, and everyday
                African essentials sit beside booking so the whole beauty
                routine feels connected.
              </p>
              <Link className="btn-primary mt-6" href="/marketplace">
                Shop marketplace <ShoppingBag aria-hidden="true" size={17} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {productCards.map((product) => (
                <article
                  className="grid grid-cols-[108px_1fr] items-center gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-3 shadow-[var(--shadow-subtle)]"
                  key={product.name}
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-white">
                    <Image
                      alt={product.name}
                      className="object-contain p-2"
                      fill
                      sizes="108px"
                      src={product.image}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-brand-strong)]">
                      {product.name}
                    </h3>
                    <p className="mt-2 font-bold text-[var(--color-text-primary)]">
                      {product.price}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Star
                        aria-hidden="true"
                        className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                        size={13}
                      />
                      4.8 average
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
