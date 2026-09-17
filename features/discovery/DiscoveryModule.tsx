"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/config";
import {
  BadgeCheck,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Copy,
  Heart,
  Home,
  Info,
  ListIcon,
  Lock,
  Map,
  MapPin,
  Navigation,
  Package,
  Search,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  User,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { siteConfig } from "@/config/site";
import {
  availabilityServices,
  discoveryCategories,
  discoveryProfessionals,
  featuredProfessional,
  filterDefaults,
  getProfessional,
  getService,
  type DiscoveryImage,
  type DiscoveryProfessional,
} from "@/features/discovery/discovery-data";

// The map (MapLibre GL JS + its own client-only DOM work) has no business
// being in the server-rendered payload or the initial client bundle - see
// the identical dynamic import in components/map/MapPageClient.tsx.
const RealMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="flex h-full w-full items-center justify-center bg-[#f3efe8]"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
    </div>
  ),
});

export type DiscoveryRouteSearch = {
  q?: string;
  location?: string;
  category?: string;
};

type ProfileSection = "overview" | "services" | "portfolio" | "credentials" | "reviews";

const brand = {
  burgundy: "var(--color-brand)",
  gold: "var(--color-gold)",
};

function formatPrice(value: number) {
  return `$${value}`;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getOfficialAppUrl() {
  const configured = siteConfig.url.replace(/\/$/, "");
  if (configured.startsWith("http://localhost")) {
    return `https://${siteConfig.domain}`;
  }
  return configured;
}

function ImageFrame({
  image,
  priority = false,
  className,
  sizes,
}: {
  image: DiscoveryImage;
  priority?: boolean;
  className?: string;
  sizes: string;
}) {
  return (
    <div className={classNames("relative overflow-hidden bg-[var(--color-brand-soft)]", className)}>
      <Image
        alt={image.alt}
        className="object-cover"
        fill
        priority={priority}
        sizes={sizes}
        src={image.src}
        style={{ objectPosition: image.position ?? "center" }}
      />
    </div>
  );
}

function BrandMark({ name = true }: { name?: boolean }) {
  return (
    <Link
      href="/for-clients"
      aria-label="Touch of Heaven home"
      className="flex min-w-0 items-center gap-3 text-[var(--color-text-primary)]"
    >
      <span className="relative grid h-12 w-16 shrink-0 place-items-center font-serif text-[2.15rem] leading-none text-[var(--color-gold)]">
        <span className="absolute left-1 top-0">T</span>
        <span className="absolute left-6 top-1">O</span>
        <span className="absolute left-9 top-4">H</span>
      </span>
      {name ? (
        <span className="hidden font-serif text-2xl font-semibold sm:inline">
          Touch of Heaven
        </span>
      ) : null}
    </Link>
  );
}

function HeaderIcon({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-primary)] transition hover:bg-white hover:text-[var(--color-brand)]"
    >
      {children}
      {badge ? (
        <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-brand)] px-1 text-[0.68rem] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function ClientShell({
  children,
  simple = false,
}: {
  children: React.ReactNode;
  simple?: boolean;
}) {
  const pathname = usePathname();
  const nav = [
    { label: "Home", href: "/for-clients", icon: Home },
    { label: "Explore", href: "/explore", icon: Search },
    { label: "Bookings", href: "/bookings", icon: Calendar },
    { label: "AI Studio", href: "/ai-studio", icon: Sparkles },
    { label: "Market", href: "/marketplace", icon: ShoppingBag },
    { label: "Profile", href: "/account", icon: User },
  ];
  const isExploreActive =
    pathname.startsWith("/explore") ||
    pathname.startsWith("/businesses") ||
    pathname.startsWith("/map") ||
    pathname.startsWith("/book-with");

  if (simple) {
    return (
      <div className="min-h-dvh bg-[var(--color-page)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-page)]/95">
          <div className="mx-auto flex min-h-[84px] max-w-7xl items-center justify-between px-5 md:px-10">
            <BrandMark />
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-brand)]"
            >
              <Search size={18} aria-hidden="true" />
              Explore
            </Link>
          </div>
        </header>
        {children}
        <div className="hidden lg:block">
          <PublicFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-page)] pb-28 text-[var(--color-text-primary)] lg:pb-0">
      <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[var(--color-page)]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <BrandMark />
          <nav className="hidden items-stretch gap-8 lg:flex" aria-label="Client navigation">
            {nav.slice(1, 4).map((item) => {
              const active =
                item.label === "Explore"
                  ? isExploreActive
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    "inline-flex min-h-[76px] items-center border-b-2 px-1 text-base font-semibold transition",
                    active
                      ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                      : "border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-brand)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <HeaderIcon href="/account/settings/beauty-profile?saved=professionals" label="Saved">
              <Heart size={24} aria-hidden="true" />
            </HeaderIcon>
            <Link
              href="/marketplace"
              aria-label="Market"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:px-4"
            >
              <ShoppingBag size={20} aria-hidden="true" />
              <span className="hidden xl:inline">Market</span>
            </Link>
            <HeaderIcon href="/account/settings/notifications" label="Notifications" badge="3">
              <Bell size={24} aria-hidden="true" />
            </HeaderIcon>
            <Link
              href="/account"
              className="hidden items-center gap-3 border-l border-[var(--color-border)] pl-4 md:flex"
            >
              <ImageFrame image={featuredProfessional.image} className="h-11 w-11 rounded-full" sizes="44px" />
              <span className="font-semibold">Maya</span>
              <ChevronDown size={18} aria-hidden="true" />
            </Link>
            <Link href="/account" aria-label="Profile" className="md:hidden">
              <ImageFrame image={featuredProfessional.image} className="h-10 w-10 rounded-full" sizes="40px" />
            </Link>
          </div>
        </div>
      </header>
      {children}
      <div className="hidden lg:block">
        <PublicFooter />
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-[var(--color-border)] bg-[var(--color-page)]/98 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_35px_rgba(43,23,36,0.08)] backdrop-blur-xl lg:hidden"
        aria-label="Mobile client navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
          {nav.filter((item) => item.label !== "Market").map((item) => {
            const Icon = item.icon;
            const active =
              item.label === "Explore"
                ? isExploreActive
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] text-[0.72rem] font-medium",
                  active ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]",
                )}
              >
                <Icon size={23} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SearchCard({
  initialQuery = "",
  initialLocation = "Washington, DC",
  compact = false,
}: {
  initialQuery?: string;
  initialLocation?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/businesses?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={classNames(
        "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)_auto] gap-0 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]",
        compact
          ? "p-1.5 sm:p-2 md:grid-cols-[1.1fr_1fr_auto]"
          : "p-1.5 sm:p-3 md:grid-cols-[1.2fr_1fr_auto]",
      )}
    >
      <label className="flex min-h-12 min-w-0 items-center gap-2 border-r border-[var(--color-border)] px-2 sm:min-h-14 sm:gap-3 sm:px-3">
        <Search className="shrink-0" size={19} aria-hidden="true" />
        <span className="sr-only">Service or professional</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Service or professional"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)] sm:text-base"
        />
      </label>
      <label className="flex min-h-12 min-w-0 items-center gap-2 border-r border-[var(--color-border)] px-2 sm:min-h-14 sm:gap-3 sm:px-3">
        <MapPin className="shrink-0" size={19} aria-hidden="true" />
        <span className="sr-only">Location</span>
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="City or ZIP"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)] sm:text-base"
        />
        <Navigation className="hidden shrink-0 sm:block" size={18} aria-hidden="true" />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-3 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)] sm:min-h-14 sm:px-8 sm:text-base"
      >
        Search
      </button>
    </form>
  );
}

export function ExploreDiscoveryPage() {
  return (
    <ClientShell>
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="absolute inset-y-0 right-0 hidden w-[54%] md:block">
          <ImageFrame
            image={{
              src: "/images/home/images/booking-marketplace-lifestyle.png",
              alt: "A Touch of Heaven professional preparing for a beauty appointment.",
              position: "72% center",
            }}
            className="h-full w-full rounded-none"
            priority
            sizes="55vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-page)] via-[var(--color-page)]/72 to-transparent" />
        </div>
        <div className="relative mx-auto grid min-h-[440px] gap-7 px-4 py-10 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-14">
          <div className="flex max-w-xl flex-col justify-center">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Find beauty and wellness, your way
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--color-text-muted)]">
              Discover trusted professionals in Washington, DC and book with confidence.
            </p>
          </div>
          <div className="self-center md:pt-20">
            <SearchCard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {discoveryCategories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <ImageFrame image={category.image} className="h-32 w-full" sizes="(max-width: 768px) 45vw, 24vw" />
              <div className="flex min-h-16 items-center gap-3 px-5">
                <Sparkles className="text-[var(--color-gold)]" size={28} aria-hidden="true" />
                <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {category.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-10">
        <SectionHeading title="Recommended for you" href="/businesses" cta="See all" />
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {discoveryProfessionals.slice(0, 4).map((professional) => (
            <CompactProfessionalCard key={professional.slug} professional={professional} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-10">
        <SectionHeading
          title="Available this week"
          href="/businesses?availability=this-week"
          cta="View all availability"
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {availabilityServices.map((service) => (
            <Link
              key={service.name}
              href={service.href}
              className="grid grid-cols-[120px_1fr] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)]"
            >
              <ImageFrame image={service.image} className="h-full min-h-[120px]" sizes="140px" />
              <div className="grid content-between gap-3 p-4">
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{service.business}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>From {formatPrice(service.price)}</span>
                  <span className="rounded-[var(--radius-control)] border border-[var(--color-brand)] px-2 py-1 text-xs font-bold text-[var(--color-brand)]">
                    {service.time}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SafetyBanner />
    </ClientShell>
  );
}

function SectionHeading({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-serif text-2xl font-semibold text-[var(--color-text-primary)] md:text-3xl">
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-semibold text-[var(--color-brand)]"
      >
        {cta}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

function CompactProfessionalCard({ professional }: { professional: DiscoveryProfessional }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="relative grid grid-cols-[128px_1fr] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] lg:grid-cols-[140px_1fr]">
      <ImageFrame image={professional.image} className="h-full min-h-[150px]" sizes="160px" />
      <div className="grid gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {professional.name}
              {professional.verified ? (
                <BadgeCheck className="ml-1 inline fill-[var(--color-gold)] text-white" size={17} aria-label="Verified" />
              ) : null}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">{professional.category}</p>
          </div>
          <button
            type="button"
            aria-label={saved ? "Unsave professional" : "Save professional"}
            aria-pressed={saved}
            onClick={() => setSaved((value) => !value)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          >
            <Heart size={21} fill={saved ? brand.burgundy : "none"} aria-hidden="true" />
          </button>
        </div>
        <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={16} aria-hidden="true" />
          {professional.rating.toFixed(1)} ({professional.reviews}) - {professional.distance}
        </p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Calendar size={15} aria-hidden="true" />
          Next: {professional.nextAvailability}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <span className="text-sm">
            From <strong>{formatPrice(professional.startingPrice)}</strong>
          </span>
          <Link
            href={`/businesses/${professional.slug}`}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-[var(--color-brand)] px-4 text-sm font-bold text-[var(--color-brand)]"
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SearchResultsPage({
  initialSearch,
  initialView = "grid",
  showFiltersInitially = false,
}: {
  initialSearch?: DiscoveryRouteSearch;
  initialView?: "grid" | "map";
  showFiltersInitially?: boolean;
}) {
  const [filtersOpen, setFiltersOpen] = useState(showFiltersInitially);
  const [appliedFilters, setAppliedFilters] = useState(filterDefaults);
  const [selectedSlug, setSelectedSlug] = useState(featuredProfessional.slug);
  const [listView, setListView] = useState(initialView);
  const query = initialSearch?.q ?? (initialSearch?.category ? "Braids near Washington, DC" : "");
  const location = initialSearch?.location ?? "Washington, DC";
  const title = query ? `${query} near you` : "Professionals near you";
  const selectedProfessional = getProfessional(selectedSlug);
  const professionals = useMemo(() => {
    if (!initialSearch?.category) return discoveryProfessionals;
    if (initialSearch.category === "nails") {
      return discoveryProfessionals.filter((professional) => professional.category.includes("Nail"));
    }
    if (initialSearch.category === "barbering") {
      return discoveryProfessionals.filter((professional) => professional.category.includes("Barber"));
    }
    if (initialSearch.category === "spa-wellness") {
      return discoveryProfessionals.filter((professional) => professional.category.includes("Spa"));
    }
    return discoveryProfessionals;
  }, [initialSearch?.category]);

  return (
    <ClientShell>
      <div className="border-b border-[var(--color-border)] bg-white/72">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <SearchCard initialQuery={query} initialLocation={location} compact />
            <div className="flex gap-3 overflow-x-auto pb-1">
              <FilterButton icon={<Calendar size={18} />} label="Date" />
              <FilterButton icon={<CircleDollarSign size={18} />} label="Price" />
              <FilterButton icon={<Navigation size={18} />} label="Distance" />
              <FilterButton icon={<Star size={18} />} label="Rating" />
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-brand)] shadow-[var(--shadow-subtle)]"
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
                More filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-2 text-lg text-[var(--color-text-muted)]">
              {professionals.length === discoveryProfessionals.length ? "128" : professionals.length} professionals found
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/explore/map"
              onClick={() => setListView("map")}
              className={classNames(
                "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border px-4 text-sm font-semibold",
                listView === "map"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-brand)]",
              )}
            >
              <Map size={18} aria-hidden="true" />
              Map
            </Link>
            <Link
              href="/businesses"
              onClick={() => setListView("grid")}
              className={classNames(
                "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border px-4 text-sm font-semibold",
                listView === "grid"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-brand)]",
              )}
            >
              <ListIcon size={18} aria-hidden="true" />
              List view
            </Link>
            <label className="flex items-center gap-2 text-sm">
              <span>Sort by</span>
              <select className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3">
                <option>Recommended</option>
                <option>Highest rated</option>
                <option>Soonest available</option>
              </select>
            </label>
          </div>
        </div>

        {listView === "map" ? (
          <div className="grid min-h-[660px] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] lg:grid-cols-[420px_1fr]">
            <aside className="max-h-[680px] overflow-auto border-r border-[var(--color-border)] p-4">
              <h2 className="font-serif text-3xl font-semibold">Professionals near you</h2>
              <p className="mt-1 text-[var(--color-text-muted)]">128 professionals found</p>
              <div className="mt-5 grid gap-3">
                {professionals.slice(0, 4).map((professional) => (
                  <MapListCard
                    key={professional.slug}
                    professional={professional}
                    selected={selectedSlug === professional.slug}
                    onSelect={() => setSelectedSlug(professional.slug)}
                  />
                ))}
              </div>
            </aside>
            <div className="relative min-h-[560px]">
              <MapCanvas />
              <div className="absolute left-1/2 top-6 -translate-x-1/2">
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] bg-white px-5 font-bold text-[var(--color-brand)] shadow-[var(--shadow-soft)]"
                >
                  <Navigation size={20} aria-hidden="true" />
                  Search this area
                </button>
              </div>
              <article className="absolute bottom-8 left-8 hidden w-[360px] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)] md:block">
                <ImageFrame image={selectedProfessional.coverImage} className="h-36" sizes="360px" />
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{selectedProfessional.businessName}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={16} />
                    {selectedProfessional.rating.toFixed(1)} ({selectedProfessional.reviews}) - {selectedProfessional.distance}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <strong>From {formatPrice(selectedProfessional.startingPrice)}</strong>
                    <Link className="font-bold text-[var(--color-brand)]" href={`/businesses/${selectedProfessional.slug}`}>
                      View profile
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <aside className="hidden rounded-[var(--radius-control)] bg-[var(--color-brand-strong)] p-5 text-white lg:block">
              <p className="text-xs font-bold uppercase text-[var(--color-gold-light)]">
                Explore services
              </p>
              <nav className="mt-4 grid gap-2" aria-label="Service categories">
                {discoveryCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.href}
                    className="rounded-[var(--radius-control)] px-3 py-3 text-sm font-semibold hover:bg-white/10"
                  >
                    {category.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {professionals.map((professional) => (
                <LargeResultCard key={professional.slug} professional={professional} />
              ))}
            </div>
          </div>
        )}
      </div>

      <FiltersDialog
        open={filtersOpen}
        filters={appliedFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={(nextFilters) => {
          setAppliedFilters(nextFilters);
          setFiltersOpen(false);
        }}
      />
    </ClientShell>
  );
}

function FilterButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold shadow-[var(--shadow-subtle)]"
    >
      {icon}
      {label}
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}

function LargeResultCard({ professional }: { professional: DiscoveryProfessional }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
      <div className="relative">
        <ImageFrame image={professional.coverImage} className="h-48" sizes="(max-width: 1024px) 90vw, 30vw" />
        <button
          type="button"
          aria-label={saved ? "Unsave professional" : "Save professional"}
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-[var(--radius-control)] bg-white/85 text-[var(--color-brand)]"
        >
          <Heart size={24} fill={saved ? brand.burgundy : "none"} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 p-5">
        <div className="flex items-start gap-3">
          <ImageFrame image={professional.image} className="h-12 w-12 shrink-0 rounded-full" sizes="48px" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {professional.businessName}
              <BadgeCheck className="ml-1 inline fill-[var(--color-gold)] text-white" size={16} />
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">{professional.category}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {professional.neighborhood} - {professional.distance}
        </p>
        <p className="flex items-center gap-2 text-sm">
          <Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={16} />
          {professional.rating.toFixed(1)} ({professional.reviews})
        </p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Calendar size={15} /> Next: {professional.nextAvailability}
        </p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <strong>From {formatPrice(professional.startingPrice)}+</strong>
          <Link
            href={`/businesses/${professional.slug}`}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-[var(--color-brand)] px-4 text-sm font-bold text-[var(--color-brand)]"
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}

function MapListCard({
  professional,
  selected,
  onSelect,
}: {
  professional: DiscoveryProfessional;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={classNames(
        "grid grid-cols-[112px_1fr] gap-3 rounded-[var(--radius-control)] border bg-white p-3 text-left shadow-[var(--shadow-subtle)]",
        selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)]",
      )}
    >
      <ImageFrame image={professional.image} className="h-28 rounded-[var(--radius-control)]" sizes="120px" />
      <span>
        <span className="block font-semibold">{professional.businessName}</span>
        <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{professional.category}</span>
        <span className="mt-2 flex items-center gap-1 text-sm">
          <Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={15} />
          {professional.rating.toFixed(1)} ({professional.reviews})
        </span>
        <span className="mt-2 block text-sm font-bold text-[var(--color-brand)]">
          From {formatPrice(professional.startingPrice)}
        </span>
      </span>
    </button>
  );
}

// The mock discoveryProfessionals records (discovery-data.ts) have no
// latitude/longitude - only a free-text location/neighborhood string - so
// there's no real coordinate to plot a pin at yet. Rendering an empty real
// map (rather than fake ones) is the honest state until that data is wired
// to the backend's actual /api/v1/braiders/nearby response, which already
// carries real coordinates on every result - see NearbyBraider in
// lib/discovery/types.ts. `selected`/`onSelect` are accepted for a stable
// call-site signature but currently unused for the same reason.
function MapCanvas() {
  return (
    <div className="relative h-full min-h-[560px] overflow-hidden bg-[#f3efe8]">
      <RealMap braiders={[]} userCoordinates={DEFAULT_MAP_CENTER} />
    </div>
  );
}

function FiltersDialog({
  open,
  filters,
  onClose,
  onApply,
}: {
  open: boolean;
  filters: typeof filterDefaults;
  onClose: () => void;
  onApply: (filters: typeof filterDefaults) => void;
}) {
  const [draft, setDraft] = useState(filters);
  if (!open) return null;

  function toggleItem(field: "types" | "locations", value: string) {
    setDraft((current) => {
      const next = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value];
      return { ...current, [field]: next };
    });
  }

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] bg-black/45 lg:grid lg:grid-cols-[1fr_minmax(720px,940px)]">
      <button type="button" aria-label="Close filters" className="hidden lg:block" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        className="ml-auto flex h-dvh w-full flex-col bg-[var(--color-page)] shadow-[var(--shadow-soft)]"
      >
        <header className="flex min-h-[92px] items-center justify-between border-b border-[var(--color-border)] px-5 md:px-10">
          <button type="button" aria-label="Close filters" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-[var(--radius-control)]">
            <X size={32} />
          </button>
          <h2 id="filters-title" className="font-serif text-4xl font-semibold">
            Filters
          </h2>
          <button type="button" onClick={() => setDraft(filterDefaults)} className="min-h-11 rounded-[var(--radius-control)] px-3 font-semibold text-[var(--color-copper)]">
            Clear all
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
          <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white">
            <FilterSection icon={<Calendar size={24} />} title="Date & time">
              <div className="grid gap-4 md:grid-cols-2">
                <FakeSelect label={draft.date} icon={<Calendar size={20} />} />
                <FakeSelect label={draft.time} icon={<Clock size={20} />} />
              </div>
            </FilterSection>
            <FilterSection icon={<CircleDollarSign size={24} />} title="Price range">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <InputBox prefix="$" value={draft.minPrice} onChange={(value) => setDraft({ ...draft, minPrice: value })} />
                <span aria-hidden="true">-</span>
                <InputBox prefix="$" value={draft.maxPrice} onChange={(value) => setDraft({ ...draft, maxPrice: value })} />
              </div>
              <div className="mt-6 h-2 rounded-full bg-[var(--color-gold)]" />
              <div className="mt-3 flex justify-between text-sm text-[var(--color-text-muted)]">
                <span>$50</span>
                <span>$200+</span>
              </div>
            </FilterSection>
            <div className="grid md:grid-cols-2">
              <FilterSection icon={<MapPin size={24} />} title="Distance radius">
                <FakeSelect label={draft.distance} />
              </FilterSection>
              <FilterSection icon={<Star size={24} />} title="Minimum rating">
                <FakeSelect label={draft.rating} />
              </FilterSection>
            </div>
            <FilterSection icon={<User size={24} />} title="Professional type">
              <ChipGroup
                values={["Hair professional", "Nail technician", "Barber", "Spa"]}
                selected={draft.types}
                onToggle={(value) => toggleItem("types", value)}
              />
            </FilterSection>
            <div className="grid md:grid-cols-2">
              <FilterSection icon={<Store size={24} />} title="Service location">
                <ChipGroup
                  values={["At business", "Mobile service"]}
                  selected={draft.locations}
                  onToggle={(value) => toggleItem("locations", value)}
                />
              </FilterSection>
              <FilterSection icon={<Clock size={24} />} title="Availability">
                <FakeSelect label={draft.availability} />
              </FilterSection>
            </div>
            <FilterSection icon={<ShieldCheck size={24} />} title="Verified identity">
              <div className="flex items-center justify-between gap-4">
                <p className="max-w-sm text-[var(--color-text-muted)]">
                  Show only professionals with verified identity
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.verifiedOnly}
                  onClick={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}
                  className={classNames(
                    "relative h-8 w-16 rounded-full transition",
                    draft.verifiedOnly ? "bg-[var(--color-brand)]" : "bg-gray-300",
                  )}
                >
                  <span
                    className={classNames(
                      "absolute top-1 h-6 w-6 rounded-full bg-white transition",
                      draft.verifiedOnly ? "left-9" : "left-1",
                    )}
                  />
                </button>
              </div>
            </FilterSection>
            <FilterSection icon={<User size={24} />} title="Accessibility needs">
              <FakeSelect label={draft.accessibility} />
            </FilterSection>
          </div>
        </div>

        <footer className="grid grid-cols-[0.8fr_1.2fr] gap-4 border-t border-[var(--color-border)] bg-[var(--color-page)] p-5 md:px-8">
          <button type="button" onClick={() => setDraft(filterDefaults)} className="min-h-14 rounded-[var(--radius-control)] border border-[var(--color-text-muted)] bg-white text-lg font-semibold">
            Reset
          </button>
          <button type="button" onClick={() => onApply(draft)} className="min-h-14 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-lg font-bold text-white">
            Show 38 results
          </button>
        </footer>
      </section>
    </div>
  );
}

function FilterSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--color-border)] p-5 md:p-6">
      <h3 className="mb-5 flex items-center gap-3 text-xl font-semibold">
        <span className="text-[var(--color-copper)]">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function FakeSelect({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 text-left text-base">
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <ChevronDown size={18} aria-hidden="true" />
    </button>
  );
}

function InputBox({ prefix, value, onChange }: { prefix: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4">
      <span>{prefix}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" />
    </label>
  );
}

function ChipGroup({ values, selected, onToggle }: { values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(value)}
            className={classNames(
              "inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border px-4 text-base",
              active
                ? "border-[var(--color-copper)] text-[var(--color-brand)]"
                : "border-[var(--color-border)] text-[var(--color-text-primary)]",
            )}
          >
            {value}
            {active ? <Check size={18} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function ProfessionalProfilePage({ slug, section = "overview" }: { slug?: string; section?: ProfileSection }) {
  const professional = getProfessional(slug);
  const [saved, setSaved] = useState(false);
  const [shareNotice, setShareNotice] = useState("");

  async function shareProfile() {
    const url = `${window.location.origin}/businesses/${professional.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: professional.businessName, text: `Book with ${professional.businessName} on ${siteConfig.name}.`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNotice("Profile link copied");
    } catch {
      setShareNotice("Profile link ready to copy from the address bar");
    }
  }

  return (
    <ClientShell>
      <section className="relative border-b border-[var(--color-border)] bg-white">
        <ImageFrame image={professional.coverImage} className="h-52 rounded-none md:h-64" priority sizes="100vw" />
        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 md:grid-cols-[auto_1fr_auto] md:px-10">
          <ImageFrame image={professional.image} className="-mt-20 h-36 w-36 rounded-full border-4 border-white shadow-[var(--shadow-soft)] md:h-44 md:w-44" sizes="176px" />
          <div className="min-w-0">
            <h1 className="font-serif text-4xl font-semibold">
              {professional.name}
              <BadgeCheck className="ml-2 inline fill-[var(--color-gold)] text-white" size={24} />
            </h1>
            <p className="mt-1 text-xl text-[var(--color-text-muted)]">{professional.businessName}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
              <span className="flex items-center gap-2"><Calendar size={18} /> {professional.category}</span>
              <span className="flex items-center gap-2"><MapPin size={18} /> {professional.location}</span>
              <span>{professional.distance}</span>
              <span className="flex items-center gap-2"><Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={18} />{professional.rating.toFixed(1)} ({professional.reviews} verified reviews)</span>
              <span className="flex items-center gap-2"><Clock size={18} /> Responds within {professional.respondsIn}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => setSaved((value) => !value)} aria-pressed={saved} className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-5 font-semibold">
              <Heart size={19} fill={saved ? brand.burgundy : "none"} />
              Save
            </button>
            <button type="button" onClick={() => void shareProfile()} className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-5 font-semibold">
              <Share2 size={19} />
              Share
            </button>
            <Link href={`/book/${professional.slug}`} className="hidden min-h-12 items-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-8 font-bold text-white lg:inline-flex">
              Book now
            </Link>
          </div>
        </div>
        {shareNotice ? (
          <p className="mx-auto max-w-[1500px] px-4 pb-3 text-sm font-semibold text-[var(--color-brand)] sm:px-6 md:px-10">
            {shareNotice}
          </p>
        ) : null}
        <ProfileTabs professional={professional} section={section} />
      </section>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10">
        {section === "overview" ? <OverviewSection professional={professional} /> : null}
        {section === "services" ? <ServicesSection professional={professional} /> : null}
        {section === "portfolio" ? <PortfolioSection professional={professional} /> : null}
        {section === "credentials" ? <CredentialsSection professional={professional} /> : null}
        {section === "reviews" ? <ReviewsSection professional={professional} /> : null}
      </div>
      <StickyBookingBar professional={professional} />
    </ClientShell>
  );
}

function ProfileTabs({ professional, section }: { professional: DiscoveryProfessional; section: ProfileSection }) {
  const tabs: Array<[ProfileSection | "location", string, string]> = [
    ["overview", "Overview", `/businesses/${professional.slug}`],
    ["services", "Services", `/businesses/${professional.slug}/services`],
    ["portfolio", "Portfolio", `/businesses/${professional.slug}/portfolio`],
    ["credentials", "Credentials", `/businesses/${professional.slug}/credentials`],
    ["reviews", `Reviews (${professional.reviews})`, `/businesses/${professional.slug}/reviews`],
    ["location", "Location", `/businesses/${professional.slug}#location`],
  ];
  return (
    <nav className="border-t border-[var(--color-border)]" aria-label="Professional profile sections">
      <div className="mx-auto flex max-w-[1500px] gap-3 overflow-x-auto px-4 sm:px-6 md:px-10">
        {tabs.map(([id, label, href]) => (
          <Link
            key={id}
            href={href}
            className={classNames(
              "inline-flex min-h-14 shrink-0 items-center border-b-2 px-2 text-sm font-semibold md:px-5",
              id === section ? "border-[var(--color-brand)] text-[var(--color-brand)]" : "border-transparent",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function OverviewSection({ professional }: { professional: DiscoveryProfessional }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="grid gap-6">
        <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
          <h2 className="font-serif text-3xl font-semibold">About Amara</h2>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--color-text-muted)]">
            With over 8 years of experience, Amara specializes in protective styles that are beautiful, long-lasting, and tailored to your hair goals. Healthy hair, happy you.
          </p>
          <h3 className="mt-6 font-semibold">Specialties</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {professional.specialties.map((specialty) => (
              <span key={specialty} className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm">
                {specialty}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold">Top services</h2>
            <Link href={`/businesses/${professional.slug}/services`} className="font-semibold text-[var(--color-brand)]">
              View all services
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {professional.services.map((service) => (
              <Link key={service.slug} href={`/businesses/${professional.slug}/services/${service.slug}`} className="grid grid-cols-[92px_1fr_auto] items-center gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
                <ImageFrame image={service.image} className="h-20 rounded-[var(--radius-control)]" sizes="100px" />
                <span>
                  <span className="block font-semibold">{service.shortName}</span>
                  <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{service.duration}</span>
                  <span className="mt-1 block text-sm">From {formatPrice(service.price)}</span>
                </span>
                <ChevronRight size={22} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoTile icon={<Store />} title="Service locations" items={["In studio", "Mobile within 8 miles"]} />
          <InfoTile icon={<Star />} title="Amenities" items={professional.amenities} />
          <InfoTile icon={<MapPin />} title="Languages" items={professional.languages} />
          <section id="location" className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
            <h3 className="flex items-center gap-3 text-xl font-semibold"><Clock className="text-[var(--color-gold)]" />Business hours</h3>
            <dl className="mt-3 grid grid-cols-[70px_1fr] gap-x-3 gap-y-1 text-sm">
              {professional.hours.map(([day, hours]) => (
                <div key={day} className="contents">
                  <dt>{day}</dt>
                  <dd className="text-[var(--color-text-muted)]">{hours}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <aside className="grid gap-5 self-start rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
        <h2 className="font-serif text-3xl font-semibold">Ready to book?</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Next availability</p>
        <p className="flex items-center gap-2 font-semibold text-[var(--color-brand)]"><Calendar size={18} />{professional.nextAvailability}</p>
        <Link href={`/businesses/${professional.slug}/services`} className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 font-bold text-white">
          View services
        </Link>
        <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
          <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="text-[var(--color-gold)]" />Booking Protection</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Your payment is secure and protected with Touch of Heaven.</p>
          <Link href="/legal/booking-protection" className="mt-3 inline-block text-sm font-semibold text-[var(--color-brand)]">Learn more</Link>
        </div>
        <div>
          <p className="font-semibold">Studio location</p>
          <p className="text-sm text-[var(--color-text-muted)]">{professional.location}</p>
          <div className="mt-3 h-32 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)]">
            <MapCanvas />
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Exact address shared after booking</p>
        </div>
      </aside>
    </div>
  );
}

function InfoTile({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
      <h3 className="flex items-center gap-3 text-xl font-semibold"><span className="text-[var(--color-gold)]">{icon}</span>{title}</h3>
      <ul className="mt-3 grid gap-1 text-sm text-[var(--color-text-muted)]">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function ServicesSection({ professional }: { professional: DiscoveryProfessional }) {
  return (
    <section>
      <h2 className="font-serif text-4xl font-semibold">Services</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {professional.services.map((service) => (
          <Link key={service.slug} href={`/businesses/${professional.slug}/services/${service.slug}`} className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
            <ImageFrame image={service.image} className="h-44" sizes="(max-width: 768px) 90vw, 30vw" />
            <div className="p-5">
              <h3 className="text-xl font-semibold">{service.name}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{service.duration}</p>
              <p className="mt-3 font-bold">From {formatPrice(service.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PortfolioSection({ professional }: { professional: DiscoveryProfessional }) {
  const [filter, setFilter] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const filters = ["All", "Knotless braids", "Boho braids", "Cornrows", "Locs"];
  const media = filter === "All" ? professional.portfolio : professional.portfolio.filter((item) => item.category === filter);
  const selected = selectedIndex === null ? null : media[selectedIndex];

  function move(delta: number) {
    setSelectedIndex((current) => {
      if (current === null || media.length === 0) return current;
      return (current + delta + media.length) % media.length;
    });
  }

  return (
    <section>
      <h2 className="font-serif text-4xl font-semibold">Portfolio</h2>
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setFilter(item); setSelectedIndex(null); }}
            className={classNames(
              "min-h-11 shrink-0 rounded-[var(--radius-control)] border px-5 text-sm font-semibold",
              filter === item ? "border-[var(--color-brand)] bg-white text-[var(--color-brand)]" : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)]",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-label={`Open ${item.label}`}
            onClick={() => setSelectedIndex(index)}
            className="group relative overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] text-left shadow-[var(--shadow-subtle)]"
          >
            <ImageFrame image={item} className="h-60" sizes="(max-width: 768px) 90vw, 31vw" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-black/45 px-4 py-3 text-white">
              <span className="font-semibold">{item.label}</span>
              <Heart size={22} aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <div role="dialog" aria-modal="true" aria-label="Portfolio image viewer" className="fixed inset-0 z-[var(--z-overlay)] grid place-items-center bg-black/65 p-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-control)] bg-white shadow-[var(--shadow-soft)]">
            <button type="button" aria-label="Close image viewer" onClick={() => setSelectedIndex(null)} className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white shadow-[var(--shadow-subtle)]"><X size={24} /></button>
            <button type="button" aria-label="Previous portfolio image" onClick={() => move(-1)} className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[var(--shadow-subtle)]"><ChevronLeft size={24} /></button>
            <button type="button" aria-label="Next portfolio image" onClick={() => move(1)} className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[var(--shadow-subtle)]"><ChevronRight size={24} /></button>
            <ImageFrame image={selected} className="h-[56dvh] rounded-none" sizes="90vw" />
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold">{selected.label}</h3>
              <Link href={`/businesses/${professional.slug}/services/${selected.serviceSlug}`} className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-6 font-bold text-white">
                View this service
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CredentialsSection({ professional }: { professional: DiscoveryProfessional }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="font-serif text-4xl font-semibold">Credentials & trust</h2>
        <p className="mt-2 text-[var(--color-text-muted)]">Verification confirms the checks shown below; it is not a guarantee of service results.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {professional.credentials.map((credential) => (
            <details key={credential.title} className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    {credential.title}
                    {credential.kind === "verified" ? <BadgeCheck className="fill-[var(--color-success)] text-white" size={18} /> : <Info size={18} />}
                  </span>
                  <span className="mt-2 block text-sm text-[var(--color-text-muted)]">{credential.detail}</span>
                </span>
                <ChevronDown size={20} />
              </summary>
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">{credential.status}</p>
              {credential.facts ? (
                <ul className="mt-3 grid gap-1 text-sm text-[var(--color-success)]">
                  {credential.facts.map((fact) => (
                    <li key={fact} className="flex items-center gap-2"><Check size={15} />{fact}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-4 text-sm font-semibold text-[var(--color-brand)]">What this means</p>
            </details>
          ))}
        </div>
      </div>
      <aside className="self-start rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
        <ShieldCheck className="mx-auto text-[var(--color-gold)]" size={58} />
        <h3 className="mt-4 text-center font-serif text-2xl font-semibold">Touch of Heaven verification</h3>
        <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">We confirm important details about professionals so you can book with confidence.</p>
        <ul className="mt-5 grid gap-2 text-sm text-[var(--color-text-muted)]">
          {["We check identity and business information", "We review experience and service standards", "We monitor platform performance"].map((item) => (
            <li key={item} className="flex gap-2"><Check className="text-[var(--color-gold)]" size={16} />{item}</li>
          ))}
        </ul>
        <Link href={`/book/${professional.slug}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] font-bold text-white">
          <Calendar size={19} />Book now
        </Link>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]"><Lock size={14} />You will not be charged yet</p>
      </aside>
    </section>
  );
}

function ReviewsSection({ professional }: { professional: DiscoveryProfessional }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_330px]">
      <div>
        <h2 className="font-serif text-4xl font-semibold">Reviews</h2>
        <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
          <div className="grid gap-6 md:grid-cols-[240px_1fr_1fr] md:items-center">
            <div className="text-center">
              <p className="font-serif text-7xl text-[var(--color-brand)]">{professional.rating.toFixed(1)}</p>
              <StarRow rating={5} className="mt-2 justify-center" />
              <p className="mt-2 text-[var(--color-text-muted)]">{professional.reviews} verified reviews</p>
            </div>
            <div className="grid gap-2">
              {[114, 10, 2, 1, 1].map((count, index) => (
                <div key={count + index} className="grid grid-cols-[30px_1fr_35px] items-center gap-3 text-sm">
                  <span>{5 - index}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[var(--color-skeleton)]"><span className="block h-full rounded-full bg-[var(--color-gold)]" style={{ width: `${Math.max(8, (count / 114) * 100)}%` }} /></span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-3 text-sm">
              {[["Service", "4.9"], ["Communication", "4.9"], ["Cleanliness", "4.8"], ["Value", "4.8"]].map(([label, value]) => (
                <p key={label} className="flex justify-between gap-4"><span>{label}</span><strong>{value}</strong></p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {["All reviews", "Most recent", "Service type"].map((filter) => (
            <button key={filter} type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold">
              {filter}<ChevronDown size={16} />
            </button>
          ))}
          <label className="inline-flex min-h-11 items-center gap-2 px-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[var(--color-brand)]" />With photos</label>
        </div>
        <div className="mt-5 grid gap-4">
          {professional.reviewsList.map((review) => (
            <article key={review.name} className="grid gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)] md:grid-cols-[220px_1fr_132px]">
              <div className="flex gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--color-surface-strong)] font-serif text-xl">{review.initials}</span>
                <div>
                  <h3 className="font-semibold">{review.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-[var(--color-gold)]">Verified booking</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{review.service}</p>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap gap-x-4 gap-y-2"><StarRow rating={review.rating} /><span className="text-sm text-[var(--color-text-muted)]">{review.date}</span></div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-primary)]">{review.body}</p>
                {review.response ? (
                  <div className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-4">
                    <h4 className="font-semibold">Response from Amara</h4>
                    <p className="mt-2 text-sm">{review.response.body}</p>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">{review.response.date}</p>
                  </div>
                ) : null}
              </div>
              <div className="grid content-between gap-3">
                {review.image ? <ImageFrame image={review.image} className="h-28 rounded-[var(--radius-control)]" sizes="140px" /> : null}
                <button type="button" className="justify-self-end text-sm">Helpful</button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside className="grid gap-6 self-start">
        <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
          <h3 className="font-serif text-2xl font-semibold">What clients mention</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {[["Neat parts", 89], ["Professional", 85], ["On time", 72], ["Welcoming", 68]].map(([label, count]) => (
              <span key={label} className="rounded-[var(--radius-control)] border border-[var(--color-border)] px-4 py-2 text-sm">{label} <span className="ml-3 text-[var(--color-text-muted)]">{count}</span></span>
            ))}
          </div>
        </section>
        <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
          <h3 className="flex items-center gap-3 text-xl font-semibold"><ShieldCheck className="text-[var(--color-gold)]" />Every review is verified</h3>
          <p className="mt-4 text-[var(--color-text-muted)]">Reviews come from completed bookings on Touch of Heaven. We verify each booking so you can book with confidence.</p>
          <Link href="/legal/reviews" className="mt-5 inline-block font-semibold text-[var(--color-brand)]">Learn more about reviews</Link>
        </section>
      </aside>
    </section>
  );
}

function StarRow({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={classNames("flex items-center gap-1 text-[var(--color-gold)]", className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={18} fill={index < rating ? brand.gold : "none"} aria-hidden="true" />
      ))}
    </span>
  );
}

function StickyBookingBar({ professional }: { professional: DiscoveryProfessional }) {
  return (
    <div className="fixed inset-x-0 bottom-[88px] z-20 border-t border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-[0_-8px_24px_rgba(43,23,36,0.08)] md:hidden">
      <Link href={`/book/${professional.slug}`} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-lg font-bold text-white">
        <Calendar size={21} />Book now
      </Link>
    </div>
  );
}

export function ServiceDetailsPage({ slug, serviceSlug }: { slug?: string; serviceSlug?: string }) {
  const professional = getProfessional(slug);
  const service = getService(professional, serviceSlug);
  const [mainImage, setMainImage] = useState(service.gallery[0] ?? service.image);
  const [size, setSize] = useState(service.selectedSize);
  const [length, setLength] = useState(service.selectedLength);
  const bookingHref = `/book/${professional.slug}?serviceId=${service.slug}&size=${encodeURIComponent(size)}&length=${encodeURIComponent(length)}`;

  return (
    <ClientShell>
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_1fr_370px] lg:px-10">
        <section>
          <div className="hidden pb-5 text-sm md:block">
            <Link href="/explore" className="text-[var(--color-brand)]">Explore</Link><span className="px-2">/</span>
            <Link href={`/businesses/${professional.slug}`} className="text-[var(--color-brand)]">{professional.businessName}</Link><span className="px-2">/</span><span>{service.name}</span>
          </div>
          <ImageFrame image={mainImage} className="h-[480px] rounded-[var(--radius-control)]" priority sizes="(max-width: 1024px) 100vw, 38vw" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {service.gallery.map((image) => (
              <button type="button" key={image.src} onClick={() => setMainImage(image)} className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)]">
                <ImageFrame image={image} className="h-24" sizes="120px" />
              </button>
            ))}
          </div>
          <article className="mt-5 grid grid-cols-[92px_1fr_auto] items-center gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)]">
            <ImageFrame image={professional.image} className="h-20 rounded-full" sizes="90px" />
            <span>
              <span className="block text-xl font-semibold">{professional.name}<BadgeCheck className="ml-1 inline fill-[var(--color-gold)] text-white" size={18} /></span>
              <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{professional.category}</span>
              <span className="mt-1 block text-sm text-[var(--color-brand)]">{professional.businessName}</span>
            </span>
            <Link href={`/businesses/${professional.slug}`} className="hidden rounded-[var(--radius-control)] border border-[var(--color-brand)] px-4 py-2 text-sm font-bold text-[var(--color-brand)] md:inline-flex">
              View profile
            </Link>
          </article>
        </section>

        <section>
          <h1 className="font-serif text-4xl font-semibold md:text-5xl">{service.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-[var(--color-brand)]"><Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={18} />{professional.rating.toFixed(1)} ({professional.reviews} verified reviews)</p>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-xl"><strong className="text-[var(--color-brand)]">{formatPrice(service.price)}</strong><span className="h-7 border-l border-[var(--color-border)]" /><span className="flex items-center gap-2 text-[var(--color-text-muted)]"><Clock size={20} />{service.duration}</span></div>
          <p className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 leading-7 text-[var(--color-text-muted)] shadow-[var(--shadow-subtle)]">{service.description}</p>

          <section className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
            <h2 className="text-xl font-semibold">What&apos;s included</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.included.map((item) => <p key={item} className="flex items-center gap-2 text-sm"><Check className="text-[var(--color-gold)]" size={17} />{item}</p>)}
            </div>
          </section>

          <section className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
            <OptionGroup title="Select size" values={service.sizes} selected={size} onSelect={setSize} />
            <OptionGroup title="Select length" values={service.lengths} selected={length} onSelect={setLength} />
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{length} length is perfect for a polished finish.</p>
          </section>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DetailItem icon={<Clock />} title="Preparation" body={service.preparation} />
            <DetailItem icon={<Package />} title="Aftercare" body={service.aftercare} />
            <DetailItem icon={<Sparkles />} title="Hair included" body={service.materials} />
            <DetailItem icon={<MapPin />} title="Service location" body={`In studio, ${professional.location} - ${professional.distance}`} />
            <DetailItem icon={<Calendar />} title="Cancellation policy" body={service.cancellation} />
            <DetailItem icon={<Info />} title="Important information" body="Please review important details about this service before choosing a time." />
          </div>
        </section>

        <aside className="self-start rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-soft)] lg:sticky lg:top-24">
          <p className="text-3xl font-bold text-[var(--color-brand)]">{formatPrice(service.price)}</p>
          <p className="mt-4 flex items-center gap-2 text-[var(--color-text-muted)]"><Clock size={18} />{service.duration}</p>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">Deposit {formatPrice(service.deposit)} due today</p>
          <div className="my-6 border-t border-[var(--color-border)]" />
          <OptionGroup compact title="Select size" values={service.sizes} selected={size} onSelect={setSize} />
          <OptionGroup compact title="Select length" values={service.lengths} selected={length} onSelect={setLength} />
          <div className="my-6 border-t border-[var(--color-border)]" />
          <p className="font-semibold">Next availability</p>
          <p className="mt-2 flex items-center gap-2 text-[var(--color-brand)]"><Calendar size={18} />{service.nextAvailability}</p>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
            {["Fri\nMay 30", "Sat\nMay 31", "Sun\nJun 1", "Mon\nJun 2", "Tue\nJun 3"].map((day, index) => (
              <button key={day} type="button" className={classNames("min-h-14 rounded-[var(--radius-control)] border px-2", index === 0 ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-border)]")}>
                {day.split("\n").map((part) => <span key={part} className="block">{part}</span>)}
              </button>
            ))}
          </div>
          <Link href={bookingHref} className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] text-lg font-bold text-white">
            Choose a time
          </Link>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]"><Lock size={14} />You will not be charged yet</p>
          <div className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
            <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="text-[var(--color-gold)]" />Booking Protection</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Your payment is secure and protected with Touch of Heaven.</p>
          </div>
        </aside>
      </div>
    </ClientShell>
  );
}

function OptionGroup({ title, values, selected, onSelect, compact = false }: { title: string; values: string[]; selected: string; onSelect: (value: string) => void; compact?: boolean }) {
  return (
    <div className={classNames("mt-4 first:mt-0", compact && "text-sm")}>
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="grid grid-cols-3 gap-3">
        {values.map((value) => (
          <button key={value} type="button" onClick={() => onSelect(value)} className={classNames("min-h-11 rounded-[var(--radius-control)] border px-3 font-semibold", selected === value ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)]")}>
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
      <h3 className="flex items-center gap-3 font-semibold"><span className="text-[var(--color-gold)]">{icon}</span>{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{body}</p>
    </section>
  );
}

export function DirectBookingPage({ slug }: { slug?: string }) {
  const professional = getProfessional(slug);
  const officialUrl = getOfficialAppUrl();
  const canonicalUrl = `${officialUrl}/book/${professional.slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&color=7a0021&bgcolor=fffaf7&data=${encodeURIComponent(canonicalUrl)}`;
  const [notice, setNotice] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setNotice("Booking link copied");
    } catch {
      setNotice("Copy from the address bar if your browser blocks clipboard access");
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Book with ${professional.businessName}`, text: `Open ${professional.businessName} on Touch of Heaven.`, url: canonicalUrl });
        return;
      }
      await copyLink();
    } catch {
      setNotice("Share was cancelled");
    }
  }

  return (
    <ClientShell simple>
      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
        <section className="text-center">
          <h1 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight md:text-5xl">You&apos;re one step away from your next appointment</h1>
          <div className="mx-auto my-4 h-px w-56 bg-[var(--color-gold)]" />
          <p className="text-lg text-[var(--color-text-muted)]">Book safely, confidently, and on your time.</p>
        </section>

        <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="min-w-0 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
            <ImageFrame image={professional.coverImage} className="h-52" priority sizes="(max-width: 1024px) 100vw, 55vw" />
            <div className="px-6 pb-6 text-center">
              <ImageFrame image={professional.image} className="mx-auto -mt-20 h-40 w-40 rounded-full border-4 border-white shadow-[var(--shadow-soft)]" sizes="160px" />
              <p className="mt-3 text-[var(--color-text-muted)]">You&apos;re booking with</p>
              <h2 className="break-words font-serif text-4xl font-semibold">{professional.businessName}</h2>
              <p className="mt-2 text-lg text-[var(--color-text-muted)]">{professional.category}</p>
              <p className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-[var(--color-text-muted)]">
                <span className="flex items-center gap-2"><Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={18} />{professional.rating.toFixed(1)} ({professional.reviews} verified reviews)</span>
                <span className="flex items-center gap-2"><MapPin size={18} />{professional.location}</span>
                <span>{professional.distance}</span>
              </p>
              <div className="mx-auto mt-6 max-w-xl rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-5 text-left">
                <p className="flex items-center gap-3 font-semibold text-[var(--color-brand)]"><Calendar size={22} />Next availability</p>
                <p className="mt-1 pl-9">{professional.nextAvailability}</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={`/businesses/${professional.slug}/services`} className="inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] font-bold text-[var(--color-brand)]">View services</Link>
                <Link href={`/book/${professional.slug}`} className="inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] font-bold text-white">Book now</Link>
              </div>
            </div>
          </article>

          <article className="min-w-0 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-subtle)]">
            <h2 className="font-serif text-3xl font-semibold">Scan to book with Amara</h2>
            <div className="mx-auto mt-5 w-fit rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-[var(--shadow-subtle)]">
              <Image alt={`QR code for ${professional.businessName} booking link`} width={320} height={320} src={qrSrc} unoptimized />
            </div>
            <p className="mt-5 flex min-w-0 flex-wrap items-center justify-center gap-2 text-sm font-semibold text-[var(--color-brand)] sm:text-base">
              <Send size={17} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 break-all">
                {new URL(canonicalUrl).hostname}/{professional.slug}
              </span>
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] font-semibold"><Copy size={19} />Copy link</button>
              <button type="button" onClick={() => void shareLink()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] font-semibold"><Share2 size={19} />Share</button>
            </div>
            {notice ? <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">{notice}</p> : null}
            <div className="mt-6 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] text-left">
              <SafeLine icon={<ShieldCheck />} text="This official Touch of Heaven link opens the verified profile." />
              <SafeLine icon={<Lock />} text="Booking Protection applies only when booking is completed on the platform." />
              <SafeLine icon={<Map />} text={`Check the ${new URL(officialUrl).hostname} domain before paying.`} />
            </div>
          </article>
        </div>
      </main>
    </ClientShell>
  );
}

function SafeLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-start gap-4 p-4 text-[var(--color-text-muted)]">
      <span className="text-[var(--color-gold)]">{icon}</span>
      {text}
    </p>
  );
}

function SafetyBanner() {
  return (
    <section className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 sm:flex-row sm:items-center">
        <ShieldCheck className="shrink-0 text-[var(--color-gold)]" size={38} />
        <div>
          <h2 className="font-semibold">Bookings made here include Touch of Heaven Booking Protection.</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your payment is secure and protected.{" "}
            <Link href="/legal/booking-protection" className="font-semibold text-[var(--color-brand)]">Learn more</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
