import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { brandAssets } from "@/config/site";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export const metadata: Metadata = {
  title: "For Clients",
  description:
    "Find trusted braiders, beauty professionals, barbers, nail techs, and authentic African products with Touch of Heaven.",
};

const heroLooks = [
  "/images/ai-studio/catalog/knotless-small-waist-front.jpg",
  "/images/ai-studio/catalog/boho-medium-waist-front.jpg",
  "/images/ai-studio/catalog/passion-large-shoulder-front.jpg",
  "/images/ai-studio/catalog/french-small-waist-front.jpg",
] as const;

const serviceCategories = [
  {
    label: "Hair Braiding",
    detail: "Knotless, boho, cornrows, loc care",
    href: "/braiders",
    image: "/images/ai-studio/catalog/knotless-small-midback-front.jpg",
  },
  {
    label: "Nail Techs",
    detail: "Clean profiles and future booking support",
    href: "/for-clients#coming-next",
    image: homeMediaAssets.communitySalon.src,
  },
  {
    label: "Barbers",
    detail: "Profiles for grooming pros as the network expands",
    href: "/for-clients#coming-next",
    image: homeMediaAssets.studioBooking.src,
  },
  {
    label: "African Marketplace",
    detail: "Hair, spices, drinks, care products",
    href: "/marketplace",
    image: homeMediaAssets.marketplaceMixedProducts.src,
  },
] as const;

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

const activity = [
  "Amara booked medium knotless braids",
  "Grace found a braider 1.2 mi away",
  "Brianna added shea butter to cart",
  "Tasha saved a boho braids look",
  "Nia viewed weekend appointments",
] as const;

const steps = [
  {
    title: "Search what you need",
    copy: "Look for braids, beauty services, barbers, nail techs, or products in one place.",
  },
  {
    title: "Compare trusted profiles",
    copy: "Check specialties, reviews, locations, pricing, and availability before you choose.",
  },
  {
    title: "Book or shop with confidence",
    copy: "Reserve your service, save favorites, or buy marketplace products from the same account.",
  },
] as const;

function HeroLookRail({ reverse = false }: { reverse?: boolean }) {
  const images = reverse ? [...heroLooks].reverse() : heroLooks;
  const track = [...images, ...images];

  return (
    <div className="h-[410px] overflow-hidden rounded-md md:h-[520px]">
      <div
        className={`flex flex-col gap-4 ${reverse ? "animate-slide-down" : "animate-slide-up"}`}
      >
        {track.map((src, index) => (
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/16 bg-white/8 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
            key={`${src}-${index}`}
          >
            <Image
              alt="Real braided hairstyle inspiration"
              className="object-cover"
              fill
              priority={index < heroLooks.length}
              sizes="(max-width: 768px) 42vw, 230px"
              src={src}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPanel() {
  return (
    <form
      action="/map"
      className="grid gap-3 rounded-md border border-[var(--color-border)] bg-white p-3 shadow-[0_26px_70px_rgba(43,23,36,0.16)] lg:grid-cols-[1.2fr_1fr_0.9fr_auto]"
      method="get"
    >
      <label className="grid gap-1 rounded-md bg-[var(--color-page)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        What
        <input
          className="min-h-10 bg-transparent text-base font-semibold normal-case tracking-normal text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          name="service"
          placeholder="Braids, nails, barber"
          type="search"
        />
      </label>
      <label className="grid gap-1 rounded-md bg-[var(--color-page)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        Where
        <input
          className="min-h-10 bg-transparent text-base font-semibold normal-case tracking-normal text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          name="location"
          placeholder="Atlanta, Macon, near me"
          type="search"
        />
      </label>
      <label className="grid gap-1 rounded-md bg-[var(--color-page)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        When
        <input
          className="min-h-10 bg-transparent text-base font-semibold normal-case tracking-normal text-[var(--color-text-primary)] outline-none"
          name="date"
          type="date"
        />
      </label>
      <button
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[var(--color-brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)]"
        type="submit"
      >
        <Search aria-hidden="true" size={18} />
        Search
      </button>
    </form>
  );
}

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
      <section className="overflow-hidden bg-[var(--color-brand-strong)] text-white">
        <div className="page-container grid gap-10 py-12 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gold-light)]">
              <Sparkles aria-hidden="true" size={15} />
              Client discovery
            </p>
            <h1 className="mt-7 max-w-3xl font-serif text-[2.65rem] font-semibold leading-[0.98] sm:text-5xl md:text-7xl md:leading-[0.96]">
              Book beauty, braids, barber care, and shop African essentials.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 md:text-lg">
              One polished place to find trusted providers, compare real work,
              choose a time, and shop products that support your look.
            </p>
            <div className="mt-8">
              <SearchPanel />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/78">
              {[
                "Knotless braids",
                "Barber care",
                "Nail techs",
                "African products",
              ].map((term) => (
                <Link
                  className="rounded-full border border-white/18 px-3 py-2 transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold-light)]"
                  href={`/map?service=${encodeURIComponent(term)}`}
                  key={term}
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[0.9fr_1.1fr] gap-4 md:gap-6">
            <HeroLookRail />
            <div className="grid gap-4 md:gap-6">
              <HeroLookRail reverse />
              <div className="rounded-md border border-white/14 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-bold text-[var(--color-gold-light)]">
                  Live activity
                </p>
                <div className="mt-3 h-20 overflow-hidden">
                  <div className="animate-slide-up space-y-3">
                    {[...activity, ...activity].map((item, index) => (
                      <p
                        className="text-sm text-white/76"
                        key={`${item}-${index}`}
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="page-container grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["4.9/5", "Average provider rating"],
            ["24/7", "Book whenever you are ready"],
            ["Same account", "Book services and shop products"],
            ["Georgia first", "Built for local beauty discovery"],
          ].map(([value, label]) => (
            <div
              className="rounded-md border border-[var(--color-border)] bg-white p-5 text-center shadow-[var(--shadow-subtle)]"
              key={value}
            >
              <p className="font-serif text-3xl font-semibold text-[var(--color-brand-strong)]">
                {value}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container py-14 md:py-18">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
              Explore
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[var(--color-brand-strong)] md:text-5xl">
              Find the right service faster.
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
            href="/map"
          >
            View all services <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map((category) => (
            <Link
              className="group overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
              href={category.href}
              key={category.label}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-brand-soft)]">
                <Image
                  alt=""
                  className="object-cover transition duration-500 group-hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 92vw, 260px"
                  src={category.image}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-[var(--color-brand-strong)]">
                  {category.label}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  {category.detail}
                </p>
              </div>
            </Link>
          ))}
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
            <div className="mt-6 grid gap-3">
              {[
                "Find nearby professionals on the map",
                "Compare ratings, services, and appointment times",
                "Save favorites before you are ready to book",
              ].map((item) => (
                <p
                  className="flex items-center gap-3 text-sm font-semibold text-[var(--color-brand-strong)]"
                  key={item}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-[var(--color-success)]"
                    size={18}
                  />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <ClientPhonePreview />
        </div>
      </section>

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
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
            href="/braiders"
          >
            Browse braiders <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featuredProviders.map((provider) => (
            <article
              className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]"
              key={provider.name}
            >
              <div className="relative aspect-[16/10] bg-[var(--color-brand-soft)]">
                <Image
                  alt={`Finished style from ${provider.name}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 92vw, 360px"
                  src={provider.image}
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[var(--color-brand)]">
                  Verified
                </span>
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
                <Link className="btn-primary mt-5 w-full" href="/braiders">
                  View profile
                </Link>
              </div>
            </article>
          ))}
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

      <section id="coming-next" className="page-container py-14 md:py-18">
        <div className="grid gap-6 rounded-md border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <div className="relative min-h-[260px] overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
            <Image
              alt={homeMediaAssets.bookingMarketplace.alt}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 92vw, 420px"
              src={homeMediaAssets.bookingMarketplace.src}
            />
          </div>
          <div className="self-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
              Built to expand
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight text-[var(--color-brand-strong)]">
              Starting with braiders, ready for nail techs, barbers, and more.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
              The client homepage introduces those categories now, while the
              platform can keep adding real provider profiles as those services
              are onboarded.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/map">
                Find providers
              </Link>
              <Link className="btn-secondary" href="/">
                Grow your business
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-brand-strong)] py-14 text-white md:py-18">
        <div className="page-container grid gap-8 md:grid-cols-[1fr_1fr_1fr] md:items-start">
          {steps.map((step, index) => (
            <div
              className="rounded-md border border-white/14 bg-white/8 p-5"
              key={step.title}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-gold)] text-sm font-black text-[var(--color-brand-strong)]">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/72">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14 md:py-18">
        <div className="page-container grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
              <CalendarCheck2 aria-hidden="true" size={17} />
              Ready when you are
            </p>
            <h2 className="mt-2 max-w-3xl font-serif text-4xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-5xl">
              Search services first, then book with confidence.
            </h2>
          </div>
          <Link className="btn-primary" href="/map">
            Start searching <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
