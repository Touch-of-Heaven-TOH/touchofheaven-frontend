"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Heart,
  HelpCircle,
  Home,
  ImageIcon,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Save,
  Scissors,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/shared/Button";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import {
  featuredProfessional,
  getProfessional,
  getService,
  type DiscoveryImage,
} from "@/features/discovery/discovery-data";

export type BookingStep =
  | "configure"
  | "extras"
  | "consultation"
  | "location"
  | "time"
  | "review"
  | "payment"
  | "processing"
  | "confirmation"
  | "details";

type ServiceVariationType =
  | "LENGTH"
  | "SIZE"
  | "COLOR"
  | "HAIR_INCLUSION"
  | "AGE_GROUP"
  | "ADD_ON"
  | "REMOVAL";

type BookingVariation = {
  id: string;
  variationType: ServiceVariationType | "PARTING";
  label: string;
  sublabel?: string;
  code?: string;
  priceDeltaCents: number;
  durationDeltaMins: number;
  isRequired?: boolean;
  sortOrder?: number;
  image?: DiscoveryImage;
  disabled?: boolean;
};

type BookingService = {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  basePriceCents: number;
  baseDurationMins: number;
  depositPercentage: number;
  cancellationPolicy: string;
  variations: BookingVariation[];
  media: DiscoveryImage[];
};

type BookingLocation = {
  id: string;
  locationType: "PUBLIC_SALON" | "PRIVATE_STUDIO" | "MOBILE";
  label: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ProviderProfile = {
  id: string;
  slug: string;
  name: string;
  businessName: string;
  category: string;
  location: string;
  neighborhood: string;
  distance: string;
  rating: number;
  reviews: number;
  respondsIn: string;
  image: DiscoveryImage;
  coverImage: DiscoveryImage;
};

type BookingCatalog = {
  provider: ProviderProfile;
  services: BookingService[];
  locations: BookingLocation[];
};

type PricingPreview = {
  priceCents: number;
  durationMins: number;
  depositCents: number;
};

type SlotOption = {
  startAt: string;
  label: string;
  disabled?: boolean;
};

type SlotHold = {
  id: string;
  startAt: string;
  endAt?: string;
  expiresAt?: string;
  computedPriceCents: number;
  depositCents: number;
};

type AppointmentRecord = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  computedPriceCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
};

type ConsultationDraft = {
  hairLength: "Short" | "Shoulder" | "Mid-back" | "Longer";
  protectiveStyle: "Yes" | "No";
  hasConcerns: "Yes" | "No concerns";
  concernDetails: string;
  desiredOutcome: string;
  photoConsent: boolean;
};

type ApiService = {
  id: string;
  name: string;
  description?: string | null;
  basePriceCents: number;
  baseDurationMins: number;
  depositPercentage: number;
  cancellationPolicy: string;
  variations?: BookingVariation[];
  media?: Array<{ url: string; altText?: string | null; sortOrder?: number | null }>;
};

type ApiLocation = {
  id: string;
  locationType: BookingLocation["locationType"];
  label: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ApiProfile = {
  braiderId: string;
  professionalName: string;
  rating?: { average: number | null; count: number };
  specialties?: string[];
};

type ApiMode = "loading" | "live" | "demo";

const routeSegmentByStep: Record<BookingStep, string> = {
  configure: "",
  extras: "extras",
  consultation: "consultation",
  location: "location",
  time: "time",
  review: "review",
  payment: "payment",
  processing: "processing",
  confirmation: "confirmation",
  details: "details",
};

const orderedSteps: BookingStep[] = [
  "configure",
  "extras",
  "consultation",
  "location",
  "time",
  "review",
  "payment",
  "processing",
  "confirmation",
  "details",
];

const checkoutSteps = [
  { key: "configure", label: "Service" },
  { key: "extras", label: "Optional extras" },
  { key: "consultation", label: "Your info" },
  { key: "location", label: "Location" },
  { key: "time", label: "Date & time" },
  { key: "review", label: "Review" },
  { key: "payment", label: "Payment" },
] satisfies Array<{ key: BookingStep; label: string }>;

const DEFAULT_CONSULTATION: ConsultationDraft = {
  hairLength: "Shoulder",
  protectiveStyle: "No",
  hasConcerns: "No concerns",
  concernDetails: "",
  desiredOutcome:
    "Neat, lightweight knotless braids that last. I'd like a natural look with minimal tension and long-lasting results.",
  photoConsent: false,
};

const demoAppointmentId = "TOH-260905-1842";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  );
}

function money(cents: number, decimals = false) {
  const value = cents / 100;
  return `$${decimals ? value.toFixed(2) : String(Math.round(value))}`;
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function inputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateFromYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function nextSaturdayFromToday() {
  const today = new Date();
  const day = today.getDay();
  const offset = (6 - day + 7) % 7 || 3;
  return inputDate(addDays(today, offset));
}

function formatDateLong(value: string) {
  return dateFromYmd(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(value: string) {
  return dateFromYmd(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function slotLabel(startAt: string) {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return startAt;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function slotForDate(date: string, hour: number, minute = 0): string {
  const suffix = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return `${date}T${suffix}`;
}

function screenIndex(step: BookingStep) {
  return Math.max(1, orderedSteps.indexOf(step) + 1);
}

function checkoutIndex(step: BookingStep) {
  const index = checkoutSteps.findIndex((item) => item.key === step);
  if (index >= 0) return index + 1;
  return 7;
}

function routeFor(braiderId: string, step: BookingStep, search = "") {
  const segment = routeSegmentByStep[step];
  const base = segment ? `/book/${braiderId}/${segment}` : `/book/${braiderId}`;
  return search ? `${base}?${search}` : base;
}

function colorImage(src: string, label: string, position = "center") {
  return { src, alt: `${label} braid color swatch`, position };
}

function normalizeApiService(service: ApiService, fallback: BookingService): BookingService {
  const media =
    service.media
      ?.slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item) => ({
        src: item.url,
        alt: item.altText ?? service.name,
      }))
      .filter((item) => Boolean(item.src)) ?? [];

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    basePriceCents: service.basePriceCents,
    baseDurationMins: service.baseDurationMins,
    depositPercentage: service.depositPercentage,
    cancellationPolicy: service.cancellationPolicy,
    variations: service.variations ?? [],
    media: media.length > 0 ? media : fallback.media,
  };
}

function normalizeApiLocation(location: ApiLocation): BookingLocation {
  return {
    id: location.id,
    locationType: location.locationType,
    label: location.label,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function buildDemoCatalog(braiderId: string, serviceSlug?: string | null): BookingCatalog {
  const discoveryProfile = getProfessional(braiderId);
  const discoveryService = getService(discoveryProfile, serviceSlug ?? undefined);
  const portfolio = discoveryProfile.portfolio;
  const gallery = discoveryService.gallery.length > 0 ? discoveryService.gallery : [discoveryService.image];

  const service: BookingService = {
    id: discoveryService.slug,
    slug: discoveryService.slug,
    name: discoveryService.name,
    description: discoveryService.description,
    basePriceCents: discoveryService.price * 100,
    baseDurationMins: 270,
    depositPercentage: 25,
    cancellationPolicy: "Cancel or reschedule at least 48 hours before your appointment.",
    media: gallery,
    variations: [
      { id: "demo-size-small", variationType: "SIZE", label: "Small", priceDeltaCents: 2000, durationDeltaMins: 45, isRequired: true, sortOrder: 1 },
      { id: "demo-size-medium", variationType: "SIZE", label: "Medium", priceDeltaCents: 0, durationDeltaMins: 0, isRequired: true, sortOrder: 2 },
      { id: "demo-size-large", variationType: "SIZE", label: "Large", priceDeltaCents: -1500, durationDeltaMins: -30, isRequired: true, sortOrder: 3 },
      { id: "demo-length-shoulder", variationType: "LENGTH", label: "Shoulder", priceDeltaCents: -2500, durationDeltaMins: -30, isRequired: true, sortOrder: 1 },
      { id: "demo-length-mid-back", variationType: "LENGTH", label: "Mid-back", priceDeltaCents: 0, durationDeltaMins: 0, isRequired: true, sortOrder: 2 },
      { id: "demo-length-waist", variationType: "LENGTH", label: "Waist", priceDeltaCents: 4000, durationDeltaMins: 60, isRequired: true, sortOrder: 3 },
      {
        id: "demo-color-natural-black",
        variationType: "COLOR",
        label: "Natural Black",
        code: "1B",
        priceDeltaCents: 0,
        durationDeltaMins: 0,
        isRequired: true,
        sortOrder: 1,
        image: colorImage("/images/ai-studio/catalog/knotless-small-midback-back.jpg", "Natural Black", "center 30%"),
      },
      {
        id: "demo-color-jet-black",
        variationType: "COLOR",
        label: "Jet Black",
        code: "1",
        priceDeltaCents: 0,
        durationDeltaMins: 0,
        isRequired: true,
        sortOrder: 2,
        image: colorImage("/images/ai-studio/catalog/french-small-midback-back.jpg", "Jet Black", "center 30%"),
      },
      {
        id: "demo-color-dark-brown",
        variationType: "COLOR",
        label: "Dark Brown",
        code: "2",
        priceDeltaCents: 0,
        durationDeltaMins: 0,
        isRequired: true,
        sortOrder: 3,
        image: colorImage("/images/ai-studio/catalog/boho-medium-midback-back.jpg", "Dark Brown", "center 30%"),
      },
      {
        id: "demo-color-warm-brown",
        variationType: "COLOR",
        label: "Warm Brown",
        code: "30",
        priceDeltaCents: 0,
        durationDeltaMins: 0,
        isRequired: true,
        sortOrder: 4,
        image: colorImage("/images/ai-studio/catalog/passion-large-waist-back.jpg", "Warm Brown", "center 30%"),
      },
      { id: "demo-parting-standard", variationType: "PARTING", label: "Standard", priceDeltaCents: 0, durationDeltaMins: 0, sortOrder: 1 },
      { id: "demo-parting-triangle", variationType: "PARTING", label: "Triangle", priceDeltaCents: 0, durationDeltaMins: 15, sortOrder: 2 },
      { id: "demo-parting-freestyle", variationType: "PARTING", label: "Freestyle", priceDeltaCents: 0, durationDeltaMins: 15, sortOrder: 3 },
      {
        id: "demo-extra-boho",
        variationType: "ADD_ON",
        label: "Boho curl finish",
        sublabel: "Add soft, curly ends for a boho look and extra movement.",
        priceDeltaCents: 3500,
        durationDeltaMins: 30,
        sortOrder: 1,
        image: portfolio[1] ?? gallery[0],
      },
      {
        id: "demo-extra-beads",
        variationType: "ADD_ON",
        label: "Decorative beads",
        sublabel: "Add beads for a personalized touch and extra flair.",
        priceDeltaCents: 1500,
        durationDeltaMins: 15,
        sortOrder: 2,
        image: { src: "/images/ai-studio/catalog/knotless-small-waist-back.jpg", alt: "Decorative braid beads.", position: "center 38%" },
      },
      {
        id: "demo-extra-scalp",
        variationType: "ADD_ON",
        label: "Scalp cleanse",
        sublabel: "Deep cleanse to remove buildup and refresh your scalp.",
        priceDeltaCents: 2000,
        durationDeltaMins: 20,
        sortOrder: 3,
        image: { src: "/images/home/images/community-salon-clients.png", alt: "A relaxing scalp cleanse in the salon.", position: "center 45%" },
      },
      {
        id: "demo-extra-trim",
        variationType: "ADD_ON",
        label: "Trim and shape",
        sublabel: "Neaten ends and shape for a polished, long-lasting finish.",
        priceDeltaCents: 1000,
        durationDeltaMins: 10,
        sortOrder: 4,
        image: { src: "/images/ai-studio/catalog/boho-wavy-waist-side.png", alt: "Trimming finished braid ends.", position: "center 35%" },
      },
    ],
  };

  return {
    provider: {
      id: discoveryProfile.slug,
      slug: discoveryProfile.slug,
      name: discoveryProfile.name,
      businessName: discoveryProfile.businessName,
      category: discoveryProfile.category,
      location: discoveryProfile.location,
      neighborhood: discoveryProfile.neighborhood,
      distance: discoveryProfile.distance,
      rating: discoveryProfile.rating,
      reviews: discoveryProfile.reviews,
      respondsIn: discoveryProfile.respondsIn,
      image: discoveryProfile.image,
      coverImage: discoveryProfile.coverImage,
    },
    services: [service],
    locations: [
      {
        id: "demo-studio-location",
        locationType: "PRIVATE_STUDIO",
        label: "At Amara's studio",
        address: "Shaw, Washington, DC",
        latitude: 38.9124,
        longitude: -77.0219,
      },
      {
        id: "demo-mobile-location",
        locationType: "MOBILE",
        label: "Mobile service at your address",
        address: null,
        latitude: null,
        longitude: null,
      },
    ],
  };
}

function pickDefaultLabel(options: BookingVariation[], preferred: string | null, fallback: string) {
  if (preferred) {
    const match = options.find((option) => option.label.toLowerCase() === preferred.toLowerCase());
    if (match) return match.label;
  }
  return options.find((option) => option.label === fallback)?.label ?? options[0]?.label ?? fallback;
}

function variationsFor(service: BookingService | null, type: BookingVariation["variationType"]) {
  return (service?.variations ?? [])
    .filter((variation) => variation.variationType === type)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function selectedVariation(service: BookingService | null, type: BookingVariation["variationType"], label: string) {
  return variationsFor(service, type).find((variation) => variation.label === label) ?? null;
}

function defaultExtraIdsFor(service: BookingService) {
  const boho = variationsFor(service, "ADD_ON").find((variation) =>
    variation.label.toLowerCase().includes("boho"),
  );
  return boho ? [boho.id] : [];
}

function initialSelectedVariationsFor(
  service: BookingService,
  selectedSizeParam: string | null,
  selectedLengthParam: string | null,
) {
  const sizeLabel = pickDefaultLabel(variationsFor(service, "SIZE"), selectedSizeParam, "Medium");
  const lengthLabel = pickDefaultLabel(variationsFor(service, "LENGTH"), selectedLengthParam, "Mid-back");
  const colorLabel = pickDefaultLabel(variationsFor(service, "COLOR"), null, "Natural Black");
  const partingLabel = pickDefaultLabel(variationsFor(service, "PARTING"), null, "Standard");
  return [
    selectedVariation(service, "SIZE", sizeLabel),
    selectedVariation(service, "LENGTH", lengthLabel),
    selectedVariation(service, "COLOR", colorLabel),
    selectedVariation(service, "PARTING", partingLabel),
    ...defaultExtraIdsFor(service).map((id) => service.variations.find((variation) => variation.id === id) ?? null),
  ].filter((variation): variation is BookingVariation => variation !== null);
}

function computeLocalPrice(service: BookingService, selected: BookingVariation[]): PricingPreview {
  const priceCents =
    service.basePriceCents + selected.reduce((total, variation) => total + variation.priceDeltaCents, 0);
  const durationMins =
    service.baseDurationMins + selected.reduce((total, variation) => total + variation.durationDeltaMins, 0);
  return {
    priceCents: Math.max(0, priceCents),
    durationMins: Math.max(15, durationMins),
    depositCents: Math.ceil((Math.max(0, priceCents) * service.depositPercentage) / 100),
  };
}

function fallbackSlotsFor(date: string): SlotOption[] {
  return [
    { startAt: slotForDate(date, 9), label: "9:00 AM" },
    { startAt: slotForDate(date, 10), label: "10:00 AM" },
    { startAt: slotForDate(date, 11), label: "11:00 AM" },
    { startAt: slotForDate(date, 13, 30), label: "1:30 PM" },
    { startAt: slotForDate(date, 14), label: "2:00 PM" },
    { startAt: slotForDate(date, 15), label: "3:00 PM", disabled: true },
  ];
}

function LogoMark({ withName = true }: { withName?: boolean }) {
  return (
    <Link href="/for-clients" aria-label="Touch of Heaven home" className="flex items-center gap-3">
      <span className="relative grid h-11 w-16 shrink-0 place-items-center font-serif text-[2.15rem] leading-none text-[var(--color-gold)]">
        <span className="absolute left-1 top-0">T</span>
        <span className="absolute left-6 top-1">O</span>
        <span className="absolute left-9 top-4">H</span>
      </span>
      {withName ? <span className="hidden font-serif text-2xl font-semibold sm:inline">Touch of Heaven</span> : null}
    </Link>
  );
}

function ImageFrame({
  image,
  className,
  priority,
  sizes,
}: {
  image: DiscoveryImage;
  className?: string;
  priority?: boolean;
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

function HeaderIcon({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge?: string;
  children: ReactNode;
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

function DesktopClientHeader() {
  const pathname = usePathname();
  const nav = [
    { label: "Home", href: "/for-clients" },
    { label: "Explore", href: "/explore" },
    { label: "Bookings", href: "/bookings" },
    { label: "AI Studio", href: "/ai-studio" },
  ];

  return (
    <header className="sticky top-0 z-[var(--z-header)] hidden border-b border-[var(--color-border)] bg-[var(--color-page)]/95 backdrop-blur-xl lg:block">
      <div className="mx-auto flex min-h-[78px] max-w-[1500px] items-center justify-between gap-4 px-10">
        <LogoMark />
        <nav className="flex items-stretch gap-8" aria-label="Client navigation">
          {nav.map((item) => {
            const active =
              item.label === "Bookings"
                ? pathname.startsWith("/book") || pathname.startsWith("/bookings")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={classNames(
                  "inline-flex min-h-[78px] items-center border-b-2 px-1 text-base font-semibold transition",
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
        <div className="flex items-center gap-3">
          <HeaderIcon href="/account/settings/beauty-profile?saved=professionals" label="Saved">
            <Heart size={24} aria-hidden="true" />
          </HeaderIcon>
          <Link
            href="/marketplace"
            aria-label="Market"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            <ShoppingBag size={20} aria-hidden="true" />
            Market
          </Link>
          <HeaderIcon href="/account/settings/notifications" label="Notifications" badge="3">
            <Bell size={24} aria-hidden="true" />
          </HeaderIcon>
          <Link href="/account" className="flex items-center gap-3 border-l border-[var(--color-border)] pl-4">
            <ImageFrame image={featuredProfessional.image} className="h-11 w-11 rounded-full" sizes="44px" />
            <span className="font-semibold">Maya</span>
            <ChevronDown size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function MobileBookingHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[var(--color-page)]/96 backdrop-blur lg:hidden">
      <div className="grid min-h-[72px] grid-cols-[1fr_auto_1fr] items-center px-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)]"
        >
          <ChevronLeft size={30} aria-hidden="true" />
        </button>
        <LogoMark withName={false} />
        <Link href="/explore" className="justify-self-end font-semibold text-[var(--color-brand)]">
          Save & exit
        </Link>
      </div>
    </header>
  );
}

function MobileBottomNav({ active = "Bookings" }: { active?: string }) {
  const items = [
    { label: "Home", href: "/for-clients", icon: Home },
    { label: "Explore", href: "/explore", icon: Search },
    { label: "Bookings", href: "/bookings", icon: Calendar },
    { label: "AI Studio", href: "/ai-studio", icon: Sparkles },
    { label: "Profile", href: "/account", icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-[var(--color-border)] bg-[var(--color-page)]/98 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_35px_rgba(43,23,36,0.08)] backdrop-blur-xl lg:hidden"
      aria-label="Mobile client navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={classNames(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] text-[0.72rem] font-medium",
                isActive ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]",
              )}
            >
              <Icon size={23} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopStepper({ step }: { step: BookingStep }) {
  const activeIndex = checkoutIndex(step);

  return (
    <div className="hidden lg:block">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-semibold text-[var(--color-copper)]">{screenIndex(step)} of 10</span>
        <ol className="flex min-w-0 flex-1 items-center gap-3" aria-label="Booking progress">
          {checkoutSteps.map((item, index) => {
            const number = index + 1;
            const complete = number < activeIndex;
            const active = number === activeIndex;
            return (
              <li key={item.key} className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={classNames(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                    active || complete
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)]",
                  )}
                >
                  {complete ? <Check size={16} aria-hidden="true" /> : number}
                </span>
                <span
                  className={classNames(
                    "truncate text-xs font-semibold",
                    active ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]",
                  )}
                >
                  {item.label}
                </span>
                {index < checkoutSteps.length - 1 ? <span className="h-px min-w-6 flex-1 bg-[var(--color-border)]" /> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function MobileProgress({ step }: { step: BookingStep }) {
  const index = screenIndex(step);
  const stage = checkoutIndex(step);
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between text-lg">
        <span className="font-semibold text-[var(--color-copper)]">{index} of 10</span>
        {step !== "confirmation" && step !== "details" ? (
          <span className="text-[var(--color-text-muted)]">Step {stage} of 7</span>
        ) : null}
      </div>
      <div className="mt-5 grid grid-cols-7 gap-3" aria-hidden="true">
        {checkoutSteps.map((item, itemIndex) => (
          <span
            key={item.key}
            className={classNames(
              "h-1.5 rounded-full",
              itemIndex + 1 <= stage ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function StepIntro({
  eyebrow,
  title,
  body,
  icon,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      {eyebrow ? <p className="text-base font-semibold text-[var(--color-brand)]">{eyebrow}</p> : null}
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)] lg:text-5xl">
        {title} {icon ? <span className="inline-flex align-middle text-[var(--color-gold)]">{icon}</span> : null}
      </h1>
      {body ? <p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--color-text-muted)]">{body}</p> : null}
    </div>
  );
}

function SelectButton({
  selected,
  disabled,
  children,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={classNames(
        "relative inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border px-4 text-center font-semibold transition",
        selected
          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-[var(--shadow-subtle)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]",
        disabled && "cursor-not-allowed opacity-45 hover:border-[var(--color-border)]",
      )}
    >
      {children}
      {selected ? (
        <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white p-0.5 text-[var(--color-brand)] sm:inline-flex">
          <Check size={16} aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}

function ServiceSummaryCard({
  provider,
  service,
  pricing,
  compact = false,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  compact?: boolean;
}) {
  const image = service.media[0] ?? provider.image;

  return (
    <article className="grid gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)] sm:grid-cols-[150px_1fr_auto] sm:items-center">
      <ImageFrame image={image} className="h-40 rounded-[var(--radius-control)] sm:h-36" sizes="160px" priority={!compact} />
      <div className="min-w-0">
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-text-primary)]">{service.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-[var(--color-text-muted)]">
          {provider.name}
          <BadgeCheck className="fill-[var(--color-gold)] text-white" size={18} aria-label="Verified professional" />
        </p>
        <p className="mt-1 font-semibold text-[var(--color-brand)]">{provider.businessName}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={17} aria-hidden="true" />
            {provider.rating.toFixed(1)} ({provider.reviews} verified reviews)
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={17} aria-hidden="true" />
            {provider.location}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 sm:grid sm:justify-items-end">
        <p className="font-serif text-4xl font-semibold text-[var(--color-brand)]">{money(pricing.priceCents)}</p>
        <p className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Clock size={20} aria-hidden="true" />
          {durationLabel(pricing.durationMins)}
        </p>
      </div>
    </article>
  );
}

function BookingSummaryCard({
  provider,
  service,
  pricing,
  size,
  length,
  color,
  parting,
  selectedExtras,
  selectedDate,
  selectedSlot,
  step,
  onContinue,
  onBack,
  busy,
  error,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  size: string;
  length: string;
  color: string;
  parting: string;
  selectedExtras: BookingVariation[];
  selectedDate: string;
  selectedSlot: SlotOption | null;
  step: BookingStep;
  onContinue: () => void;
  onBack: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const showAppointment = step === "time" || step === "review" || step === "payment" || step === "processing";
  return (
    <aside className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-28">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold">Your booking</h2>
        {step !== "configure" ? <button type="button" className="text-sm font-semibold text-[var(--color-brand)]">Edit</button> : null}
      </div>

      <div className="mt-5 grid grid-cols-[82px_1fr] gap-4">
        <ImageFrame image={service.media[0] ?? provider.image} className="h-24 rounded-[var(--radius-control)]" sizes="90px" />
        <div className="min-w-0">
          <p className="font-semibold">{service.name}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {provider.name} <BadgeCheck className="ml-1 inline fill-[var(--color-gold)] text-white" size={15} aria-label="Verified" />
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-brand)]">{provider.businessName}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <MapPin size={14} aria-hidden="true" /> {provider.location}
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-[var(--color-border)]" />

      <dl className="grid gap-2 text-sm">
        {[
          ["Braid size", size],
          ["Length", length],
          ["Color", color],
          ["Parting", parting],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
        {selectedExtras.length > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">Extras</dt>
            <dd className="text-right font-medium text-[var(--color-brand)]">
              {selectedExtras.map((extra) => extra.label).join(", ")}
            </dd>
          </div>
        ) : null}
      </dl>

      {showAppointment ? (
        <div className="mt-5 rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-4">
          <p className="flex items-center gap-2 font-semibold text-[var(--color-brand)]">
            <Calendar size={18} aria-hidden="true" />
            Selected appointment
          </p>
          <p className="mt-2 text-sm">{formatDateLong(selectedDate)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{selectedSlot?.label ?? "Choose a time"}</p>
        </div>
      ) : null}

      <div className="my-5 border-t border-[var(--color-border)]" />

      <dl className="grid gap-3">
        <div className="flex justify-between">
          <dt>Service</dt>
          <dd>{money(service.basePriceCents)}</dd>
        </div>
        {selectedExtras.length > 0 ? (
          <div className="flex justify-between text-[var(--color-brand)]">
            <dt>Extras</dt>
            <dd>{money(selectedExtras.reduce((sum, extra) => sum + extra.priceDeltaCents, 0))}</dd>
          </div>
        ) : null}
        <div className="border-t border-[var(--color-border)] pt-3">
          <div className="flex items-center justify-between">
            <dt className="font-semibold">Estimated total</dt>
            <dd className="font-serif text-3xl font-semibold text-[var(--color-brand)]">{money(pricing.priceCents)}</dd>
          </div>
        </div>
        <div className="flex justify-between text-[var(--color-brand)]">
          <dt>Deposit due today</dt>
          <dd className="font-semibold">{money(pricing.depositCents)}</dd>
        </div>
        <div className="flex justify-between text-[var(--color-text-muted)]">
          <dt>Remaining due at appointment</dt>
          <dd>{money(pricing.priceCents - pricing.depositCents)}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page)] p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="text-[var(--color-gold)]" size={24} aria-hidden="true" />
          Booking Protection
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Your payment is secure and protected with Touch of Heaven.
        </p>
      </div>

      {error ? <p role="alert" className="mt-4 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}

      <div className="mt-5 hidden gap-3 lg:grid">
        {step !== "configure" ? (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button loading={busy} onClick={onContinue}>
          {step === "payment" ? `Pay ${money(pricing.depositCents)} securely` : step === "time" ? `Continue with ${selectedSlot?.label ?? "time"}` : "Continue"}
        </Button>
        <p className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Lock size={14} aria-hidden="true" />
          Secure checkout
        </p>
      </div>
    </aside>
  );
}

function StickyMobileActions({
  step,
  pricing,
  selectedSlot,
  onBack,
  onContinue,
  busy,
}: {
  step: BookingStep;
  pricing: PricingPreview;
  selectedSlot: SlotOption | null;
  onBack: () => void;
  onContinue: () => void;
  busy?: boolean;
}) {
  if (step === "processing" || step === "confirmation" || step === "details") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-[var(--color-border)] bg-[var(--color-page)]/98 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-10px_35px_rgba(43,23,36,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-[0.8fr_1.2fr] gap-3">
        {step === "configure" ? (
          <div className="text-sm">
            <p className="text-xl font-semibold text-[var(--color-text-primary)]">
              {money(pricing.priceCents)} <span className="text-[var(--color-text-muted)]">- {durationLabel(pricing.durationMins)}</span>
            </p>
            <p className="font-semibold text-[var(--color-brand)]">{money(pricing.depositCents)} deposit today</p>
          </div>
        ) : (
          <Button variant="secondary" onClick={onBack} className="min-h-14 text-base">
            Back
          </Button>
        )}
        <Button loading={busy} onClick={onContinue} className="min-h-14 text-base">
          {step === "payment" ? `Pay ${money(pricing.depositCents)} securely` : step === "time" ? `Continue with ${selectedSlot?.label ?? "time"}` : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function OptionSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)]">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--color-text-primary)] text-base">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ConfigureStep({
  provider,
  service,
  pricing,
  size,
  setSize,
  length,
  setLength,
  color,
  setColor,
  parting,
  setParting,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  size: string;
  setSize: (value: string) => void;
  length: string;
  setLength: (value: string) => void;
  color: string;
  setColor: (value: string) => void;
  parting: string;
  setParting: (value: string) => void;
}) {
  const sizes = variationsFor(service, "SIZE");
  const lengths = variationsFor(service, "LENGTH");
  const colors = variationsFor(service, "COLOR");
  const partings = variationsFor(service, "PARTING");

  return (
    <div className="grid gap-5">
      <StepIntro
        eyebrow="Configure your service"
        title="Configure your service"
        body="Personalise your style. Your price and duration update with your choices."
      />
      <ServiceSummaryCard provider={provider} service={service} pricing={pricing} />
      <OptionSection number={1} title="Braid size">
        <div className="grid gap-3 sm:grid-cols-3">
          {sizes.map((option) => (
            <SelectButton key={option.id} selected={size === option.label} onClick={() => setSize(option.label)}>
              {option.label}
            </SelectButton>
          ))}
        </div>
      </OptionSection>
      <OptionSection number={2} title="Length">
        <div className="grid gap-3 sm:grid-cols-3">
          {lengths.map((option) => (
            <SelectButton key={option.id} selected={length === option.label} disabled={option.disabled} onClick={() => setLength(option.label)}>
              {option.label}
            </SelectButton>
          ))}
        </div>
      </OptionSection>
      <OptionSection number={3} title="Color">
        <div className="grid gap-4 sm:grid-cols-4">
          {colors.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={color === option.label}
              onClick={() => setColor(option.label)}
              className="group min-w-0 text-center"
            >
              <span
                className={classNames(
                  "relative block aspect-square overflow-hidden rounded-[var(--radius-control)] border-2 bg-[var(--color-surface-strong)] p-1 transition",
                  color === option.label ? "border-[var(--color-brand)]" : "border-transparent group-hover:border-[var(--color-border)]",
                )}
              >
                {option.image ? (
                  <ImageFrame image={option.image} className="h-full rounded-[6px]" sizes="160px" />
                ) : (
                  <span className="block h-full rounded-[6px] bg-[linear-gradient(135deg,#141414,#2f201b)]" />
                )}
                {color === option.label ? (
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--color-brand)] shadow-[var(--shadow-subtle)]">
                    <Check size={18} aria-hidden="true" />
                  </span>
                ) : null}
              </span>
              <span className="mt-2 block font-medium">
                {option.label} {option.code}
              </span>
            </button>
          ))}
        </div>
      </OptionSection>
      <OptionSection number={4} title="Parting">
        <div className="grid gap-3 sm:grid-cols-3">
          {partings.map((option) => (
            <SelectButton key={option.id} selected={parting === option.label} onClick={() => setParting(option.label)}>
              {option.label}
            </SelectButton>
          ))}
        </div>
      </OptionSection>
      <p className="flex items-center gap-3 text-[var(--color-text-muted)]">
        <Info className="text-[var(--color-gold)]" size={22} aria-hidden="true" />
        Your price and duration update with your choices.
      </p>
    </div>
  );
}

function ExtrasStep({
  selectedExtras,
  setSelectedExtras,
  service,
  pricing,
  provider,
}: {
  selectedExtras: string[];
  setSelectedExtras: (value: string[]) => void;
  service: BookingService;
  pricing: PricingPreview;
  provider: ProviderProfile;
}) {
  const extras = variationsFor(service, "ADD_ON");

  function toggle(id: string) {
    setSelectedExtras(selectedExtras.includes(id) ? selectedExtras.filter((item) => item !== id) : [...selectedExtras, id]);
  }

  return (
    <div className="grid gap-5">
      <StepIntro
        eyebrow={`${service.name} > ${provider.name} > ${provider.neighborhood}, DC`}
        title="Make it yours"
        body="Personalize your style with add-ons you'll love."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {extras.map((extra) => {
          const selected = selectedExtras.includes(extra.id);
          return (
            <button
              key={extra.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(extra.id)}
              className={classNames(
                "grid min-h-[168px] grid-cols-[116px_1fr_auto] gap-5 rounded-[var(--radius-control)] border bg-white p-4 text-left shadow-[var(--shadow-subtle)] transition",
                selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)] hover:border-[var(--color-brand)]",
              )}
            >
              <ImageFrame image={extra.image ?? service.media[0] ?? provider.image} className="h-32 rounded-[var(--radius-control)]" sizes="120px" />
              <span className="grid min-w-0 content-between gap-3">
                <span>
                  <span className="block text-xl font-semibold">{extra.label}</span>
                  <span className="mt-2 block leading-6 text-[var(--color-text-muted)]">{extra.sublabel}</span>
                </span>
                <span className="flex flex-wrap gap-x-6 gap-y-2">
                  <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    <Clock className="text-[var(--color-gold)]" size={18} aria-hidden="true" />
                    +{extra.durationDeltaMins} min
                  </span>
                  <span className="font-semibold text-[var(--color-brand)]">+{money(extra.priceDeltaCents)}</span>
                </span>
              </span>
              <span
                className={classNames(
                  "grid h-9 w-9 place-items-center rounded-[var(--radius-control)] border",
                  selected ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-text-muted)] text-transparent",
                )}
              >
                <Check size={20} aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-gold)] text-[var(--color-gold)]">
            <Scissors size={28} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">Hair included</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Premium braiding hair is included in the price.</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--color-copper)]">Included</span>
      </div>
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)] lg:hidden">
        <h2 className="text-xl font-semibold">Your booking summary</h2>
        <div className="mt-4 flex items-center justify-between">
          <span>Estimated total</span>
          <span className="font-serif text-3xl font-semibold text-[var(--color-brand)]">{money(pricing.priceCents)}</span>
        </div>
        <p className="mt-2 text-[var(--color-brand)]">{money(pricing.depositCents)} deposit due today</p>
      </div>
    </div>
  );
}

function ConsultationStep({
  consultation,
  setConsultation,
}: {
  consultation: ConsultationDraft;
  setConsultation: (value: ConsultationDraft) => void;
}) {
  function update<K extends keyof ConsultationDraft>(key: K, value: ConsultationDraft[K]) {
    setConsultation({ ...consultation, [key]: value });
  }

  return (
    <div className="grid gap-5">
      <StepIntro
        eyebrow="CONSULTATION - STEP 3 OF 7"
        title="Tell Amara about your hair"
        body="Your answers are shared only with Amara for this booking and are never posted publicly."
        icon={<Lock size={34} aria-hidden="true" />}
      />
      <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
        <div className="flex justify-between gap-4">
          <h2 className="text-lg font-semibold">Current hair length</h2>
          <span className="text-sm font-semibold text-[var(--color-brand)]">Required</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            ["Short", "Above chin"],
            ["Shoulder", "At or near shoulders"],
            ["Mid-back", "Below shoulders"],
            ["Longer", "Below mid-back"],
          ].map(([label, sublabel]) => (
            <SelectButton key={label} selected={consultation.hairLength === label} onClick={() => update("hairLength", label as ConsultationDraft["hairLength"])}>
              <span>
                <span className="block">{label}</span>
                <span className="block text-sm font-normal opacity-80">{sublabel}</span>
              </span>
            </SelectButton>
          ))}
        </div>
      </section>

      <ConsultationBinary
        title="Are you wearing a protective style now?"
        selected={consultation.protectiveStyle}
        values={["Yes", "No"]}
        onSelect={(value) => update("protectiveStyle", value as ConsultationDraft["protectiveStyle"])}
      />

      <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
        <div className="flex justify-between gap-4">
          <h2 className="max-w-2xl text-lg font-semibold">Any scalp sensitivity, allergies, recent treatments or concerns Amara should know?</h2>
          <span className="text-sm font-semibold text-[var(--color-brand)]">Required</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["Yes", "No concerns"] as const).map((value) => (
            <SelectButton key={value} selected={consultation.hasConcerns === value} onClick={() => update("hasConcerns", value)}>
              {value}
            </SelectButton>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-[var(--color-text-muted)]">
            Optional - share any details (e.g., psoriasis, braids removed recently)
          </span>
          <input
            value={consultation.concernDetails}
            onChange={(event) => update("concernDetails", event.target.value)}
            placeholder="Type here (optional)"
            className="mt-2 min-h-12 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 outline-none focus-ring"
          />
        </label>
      </section>

      <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
        <div className="flex justify-between gap-4">
          <h2 className="text-lg font-semibold">What&apos;s your desired outcome?</h2>
          <span className="text-sm font-semibold text-[var(--color-brand)]">Required</span>
        </div>
        <label className="mt-4 block">
          <span className="sr-only">Desired outcome</span>
          <textarea
            value={consultation.desiredOutcome}
            onChange={(event) => update("desiredOutcome", event.target.value.slice(0, 250))}
            className="min-h-28 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 leading-7 outline-none focus-ring"
          />
          <span className="mt-1 block text-right text-sm text-[var(--color-text-muted)]">{consultation.desiredOutcome.length}/250</span>
        </label>
      </section>

      <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
        <div className="flex justify-between gap-4">
          <h2 className="text-lg font-semibold">Reference photo (optional)</h2>
          <span className="text-sm text-[var(--color-text-muted)]">Optional</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <button
            type="button"
            className="flex min-h-28 items-center justify-center gap-4 rounded-[var(--radius-control)] border border-dashed border-[var(--color-gold)] bg-white p-5 text-left"
          >
            <ImageIcon className="text-[var(--color-gold)]" size={46} aria-hidden="true" />
            <span>
              <span className="block text-lg font-semibold">Add a reference photo</span>
              <span className="mt-1 block text-sm text-[var(--color-text-muted)]">JPG or PNG - Max 10MB</span>
            </span>
          </button>
          <div className="grid gap-3">
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white font-semibold">
              <Camera size={19} aria-hidden="true" />
              Camera
            </button>
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white font-semibold">
              <ImageIcon size={19} aria-hidden="true" />
              Photo library
            </button>
          </div>
        </div>
      </section>
      <label className="flex items-start gap-4 text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={consultation.photoConsent}
          onChange={(event) => update("photoConsent", event.target.checked)}
          className="mt-1 h-6 w-6 rounded-[var(--radius-control)] border-[var(--color-border)]"
        />
        <span>I consent to sharing uploaded consultation photos with Amara for this appointment only.</span>
      </label>
    </div>
  );
}

function ConsultationBinary({
  title,
  selected,
  values,
  onSelect,
}: {
  title: string;
  selected: string;
  values: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm font-semibold text-[var(--color-brand)]">Required</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {values.map((value) => (
          <SelectButton key={value} selected={selected === value} onClick={() => onSelect(value)}>
            {value}
          </SelectButton>
        ))}
      </div>
    </section>
  );
}

function LocationStep({
  locations,
  locationId,
  setLocationId,
  arrivalNotes,
  setArrivalNotes,
  stepFree,
  setStepFree,
}: {
  locations: BookingLocation[];
  locationId: string | null;
  setLocationId: (value: string) => void;
  arrivalNotes: string;
  setArrivalNotes: (value: string) => void;
  stepFree: boolean;
  setStepFree: (value: boolean) => void;
}) {
  const studio = locations.find((location) => location.locationType !== "MOBILE") ?? locations[0]!;
  const mobile = locations.find((location) => location.locationType === "MOBILE");

  return (
    <div className="grid gap-5">
      <StepIntro
        eyebrow="Service location"
        title="Where will your appointment take place?"
        body="Choose the location that works best for you."
      />
      <div className="grid gap-3">
        <LocationChoice
          location={studio}
          selected={locationId === studio.id}
          icon={MapPin}
          title="At Amara's studio"
          lines={[studio.address ?? "Shaw, Washington, DC - 1.8 mi", "Exact address shared after confirmation", "No travel fee"]}
          onSelect={() => setLocationId(studio.id)}
        />
        <LocationChoice
          location={mobile}
          selected={mobile ? locationId === mobile.id : false}
          icon={Home}
          title="Mobile service at your address"
          lines={["Available within 8 miles", "Travel fee calculated from address"]}
          onSelect={() => mobile && setLocationId(mobile.id)}
          disabled={!mobile}
        />
      </div>
      <MapPreview />
      <label className="block">
        <span className="flex justify-between gap-4 text-lg font-semibold">
          Accessibility or arrival needs <span className="text-sm font-normal text-[var(--color-text-muted)]">Optional</span>
        </span>
        <textarea
          value={arrivalNotes}
          maxLength={200}
          onChange={(event) => setArrivalNotes(event.target.value)}
          placeholder="Tell us about parking, building access, or other needs..."
          className="mt-3 min-h-24 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 outline-none focus-ring"
        />
        <span className="mt-1 block text-right text-sm text-[var(--color-text-muted)]">{arrivalNotes.length}/200</span>
      </label>
      <label className="flex items-center gap-4 text-lg text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={stepFree}
          onChange={(event) => setStepFree(event.target.checked)}
          className="h-6 w-6 rounded-[var(--radius-control)] border-[var(--color-border)]"
        />
        I need step-free access
      </label>
      <div className="flex gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page)] p-5">
        <ShieldCheck className="shrink-0 text-[var(--color-gold)]" size={42} aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Your privacy is our priority</h2>
          <p className="mt-1 text-[var(--color-text-muted)]">
            Exact private addresses are only shared after your booking is confirmed. We never share your location publicly.
          </p>
        </div>
      </div>
    </div>
  );
}

function LocationChoice({
  location,
  selected,
  icon: Icon,
  title,
  lines,
  onSelect,
  disabled,
}: {
  location?: BookingLocation;
  selected: boolean;
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  lines: string[];
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      onClick={onSelect}
      className={classNames(
        "grid grid-cols-[42px_1fr] gap-4 rounded-[var(--radius-control)] border bg-white p-5 text-left shadow-[var(--shadow-subtle)] transition",
        selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)] hover:border-[var(--color-brand)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className={classNames("mt-1 grid h-8 w-8 place-items-center rounded-full border-2", selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)]")}>
        <span className={classNames("h-4 w-4 rounded-full", selected ? "bg-[var(--color-brand)]" : "bg-transparent")} />
      </span>
      <span>
        <span className="flex items-center gap-3 text-xl font-semibold">
          <Icon className="text-[var(--color-gold)]" size={28} aria-hidden={true} />
          {location?.label ?? title}
        </span>
        {lines.map((line) => (
          <span key={line} className="mt-2 block text-[var(--color-text-muted)]">
            {line}
          </span>
        ))}
      </span>
    </button>
  );
}

function MapPreview() {
  return (
    <div className="relative h-64 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[#edf1e8] shadow-[var(--shadow-subtle)]">
      <div className="absolute inset-0 opacity-85">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,.95)_25px,transparent_26px),linear-gradient(0deg,transparent_24px,rgba(255,255,255,.95)_25px,transparent_26px)] bg-[length:54px_54px]" />
        <div className="absolute left-1/4 top-0 h-full w-16 -rotate-12 bg-white/80" />
        <div className="absolute left-0 top-2/3 h-16 w-full rotate-6 bg-white/80" />
        <div className="absolute right-20 top-10 h-28 w-28 rounded-full bg-[#cfe4c8]/70" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand)]/12" />
      <MapPin className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full fill-[var(--color-brand)] text-[var(--color-brand)]" size={52} aria-hidden="true" />
      <span className="absolute left-5 bottom-5 rounded-[var(--radius-control)] bg-white px-4 py-2 text-sm font-semibold shadow-[var(--shadow-subtle)]">
        Approximate area
      </span>
      <span className="absolute left-[48%] top-[58%] text-2xl font-semibold tracking-wide text-[var(--color-text-muted)]">SHAW</span>
    </div>
  );
}

function TimeStep({
  provider,
  service,
  pricing,
  selectedDate,
  setSelectedDate,
  slots,
  slotsFailed,
  selectedSlot,
  setSelectedSlot,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  slots: SlotOption[];
  slotsFailed: boolean;
  selectedSlot: SlotOption | null;
  setSelectedSlot: (value: SlotOption) => void;
}) {
  const calendarDays = useMemo(() => {
    const first = new Date(2026, 8, 1);
    return Array.from({ length: 35 }, (_, index) => addDays(first, index));
  }, []);

  return (
    <div className="grid gap-5">
      <StepIntro title="Choose a date and time" body="We'll confirm your appointment and send the details." />
      <ServiceSummaryCard provider={provider} service={service} pricing={pricing} compact />
      <section className="grid gap-6 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)] xl:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] hover:bg-[var(--color-brand-soft)]">
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <h2 className="text-2xl font-semibold">September 2026</h2>
            <button type="button" aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] hover:bg-[var(--color-brand-soft)]">
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-7 border-t border-[var(--color-border)] pt-4 text-center text-sm font-semibold text-[var(--color-text-muted)]">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-y-3 text-center">
            {calendarDays.map((day) => {
              const value = inputDate(day);
              const selected = selectedDate === value;
              const muted = day.getMonth() !== 8;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedDate(value)}
                  className={classNames(
                    "mx-auto grid h-14 w-14 place-items-center rounded-full text-xl font-semibold transition",
                    selected
                      ? "bg-[var(--color-brand)] text-white"
                      : muted
                        ? "text-[var(--color-text-muted)]/45 hover:bg-[var(--color-brand-soft)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]",
                  )}
                >
                  <span>{day.getDate()}</span>
                  <span className={classNames("h-1.5 w-1.5 rounded-full", selected ? "bg-white" : "bg-[var(--color-brand)]")} />
                </button>
              );
            })}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            Available dates
          </p>
        </div>
        <div className="border-t border-[var(--color-border)] pt-5 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
          <h2 className="font-serif text-2xl font-semibold">Available times</h2>
          <div className="mt-5 flex gap-3">
            <SelectButton selected onClick={() => undefined}>Morning</SelectButton>
            <SelectButton selected={false} onClick={() => undefined}>Afternoon</SelectButton>
          </div>
          {slots.length === 0 ? (
            <p
              role="status"
              className="mt-5 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] px-4 py-5 text-[var(--color-text-muted)]"
            >
              {slotsFailed
                ? "We couldn't load this provider's times just now. Please try again in a moment."
                : "No times are free on this day. Try another date, or join the waitlist below."}
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots.map((slot) => (
                <SelectButton
                  key={slot.startAt}
                  selected={selectedSlot?.startAt === slot.startAt}
                  disabled={slot.disabled}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.label}
                </SelectButton>
              ))}
            </div>
          )}
          <p className="mt-5 flex items-center gap-2 text-[var(--color-text-muted)]">
            <Clock className="text-[var(--color-gold)]" size={21} aria-hidden="true" />
            {durationLabel(pricing.durationMins)} appointment - Ends around 3:00 PM
          </p>
          <div className="my-6 border-t border-[var(--color-border)]" />
          <p className="flex items-start gap-3 text-[var(--color-text-muted)]">
            <Info className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={22} aria-hidden="true" />
            Times are held only after deposit payment.
          </p>
          <Link href="/support" className="mt-4 inline-flex font-semibold text-[var(--color-brand)] underline">
            No suitable time? Join the waitlist
          </Link>
        </div>
      </section>
    </div>
  );
}

function ReviewStep({
  provider,
  service,
  pricing,
  size,
  length,
  color,
  parting,
  selectedExtras,
  selectedDate,
  selectedSlot,
  agreed,
  setAgreed,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  size: string;
  length: string;
  color: string;
  parting: string;
  selectedExtras: BookingVariation[];
  selectedDate: string;
  selectedSlot: SlotOption | null;
  agreed: boolean;
  setAgreed: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-5">
      <StepIntro title="Review your booking" body="Check everything before payment." />
      <ReviewRow image={service.media[0] ?? provider.image} title={provider.name} subtitle={provider.businessName} meta={`${provider.rating.toFixed(1)} (${provider.reviews} verified reviews)`} action={<ChevronRight size={30} />} />
      <ReviewIconRow icon={<Scissors />} title={service.name} action="Edit">
        {size} - {length} - {color} - {parting} parting
        {selectedExtras.length > 0 ? <span className="block text-[var(--color-brand)]">+ {selectedExtras.map((extra) => extra.label).join(", ")}</span> : null}
      </ReviewIconRow>
      <ReviewIconRow icon={<Calendar />} title={formatDateLong(selectedDate)} action="Edit">
        {selectedSlot?.label ?? "No time selected"} - {durationLabel(pricing.durationMins)}
      </ReviewIconRow>
      <ReviewIconRow icon={<MapPin />} title={provider.businessName} action={<ChevronRight size={30} />}>
        {provider.location}
        <span className="block text-sm"><Lock className="mr-1 inline" size={15} aria-hidden="true" /> Exact address shared after booking</span>
      </ReviewIconRow>
      <ReviewIconRow icon={<Calendar />} title="Consultation complete">
        All details confirmed
      </ReviewIconRow>
      <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
        <dl className="grid gap-2 text-lg">
          <div className="flex justify-between">
            <dt>Service</dt>
            <dd>{money(service.basePriceCents)}</dd>
          </div>
          {selectedExtras.map((extra) => (
            <div key={extra.id} className="flex justify-between">
              <dt>{extra.label}</dt>
              <dd>{money(extra.priceDeltaCents)}</dd>
            </div>
          ))}
          <div className="mt-2 border-t border-[var(--color-border)] pt-3">
            <div className="flex justify-between">
              <dt className="font-semibold">Total</dt>
              <dd className="font-serif text-3xl font-semibold text-[var(--color-brand)]">{money(pricing.priceCents)}</dd>
            </div>
          </div>
          <div className="flex justify-between text-[var(--color-brand)]">
            <dt>Deposit due now</dt>
            <dd>{money(pricing.depositCents)}</dd>
          </div>
          <div className="flex justify-between text-[var(--color-text-muted)]">
            <dt>Remaining at appointment</dt>
            <dd>{money(pricing.priceCents - pricing.depositCents)}</dd>
          </div>
        </dl>
      </section>
      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
        <PolicyRow title="Cancellation policy" body="Cancel or reschedule up to 48 hours before your appointment." />
        <PolicyRow title="Booking Protection" body="Eligible appointments are protected in case of emergencies." />
      </div>
      <label className="flex items-start gap-4 text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1 h-6 w-6 rounded-[var(--radius-control)] border-[var(--color-border)]"
        />
        <span>
          I agree to Amara&apos;s <span className="font-semibold text-[var(--color-brand)]">cancellation policy</span> and the Touch of Heaven{" "}
          <span className="font-semibold text-[var(--color-brand)]">booking terms</span>.
        </span>
      </label>
    </div>
  );
}

function ReviewRow({
  image,
  title,
  subtitle,
  meta,
  action,
}: {
  image: DiscoveryImage;
  title: string;
  subtitle: string;
  meta: string;
  action?: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[90px_1fr_auto] items-center gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)]">
      <ImageFrame image={image} className="h-24 rounded-[var(--radius-control)]" sizes="90px" />
      <div>
        <h2 className="font-serif text-2xl font-semibold">{title} <BadgeCheck className="inline fill-[var(--color-gold)] text-white" size={18} /></h2>
        <p className="mt-1 text-[var(--color-text-muted)]">{subtitle}</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{meta}</p>
      </div>
      {action ? <span className="text-[var(--color-brand)]">{action}</span> : null}
    </section>
  );
}

function ReviewIconRow({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="grid grid-cols-[68px_1fr_auto] items-center gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-subtle)]">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-surface-strong)] text-[var(--color-brand)]">{icon}</span>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-[var(--color-text-muted)]">{children}</p>
      </div>
      {action ? <span className="font-semibold text-[var(--color-brand)]">{action}</span> : null}
    </section>
  );
}

function PolicyRow({ title, body }: { title: string; body: string }) {
  return (
    <button type="button" className="grid w-full grid-cols-[52px_1fr_auto] items-center gap-4 p-4 text-left">
      <ShieldCheck className="text-[var(--color-gold)]" size={36} aria-hidden="true" />
      <span>
        <span className="block text-lg font-semibold">{title}</span>
        <span className="mt-1 block text-[var(--color-text-muted)]">{body}</span>
      </span>
      <ChevronDown size={24} aria-hidden="true" />
    </button>
  );
}

function PaymentStep({
  provider,
  service,
  pricing,
  authorized,
  setAuthorized,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  authorized: boolean;
  setAuthorized: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-5">
      <StepIntro
        eyebrow="DEPOSIT PAYMENT"
        title="Secure your appointment"
        body="Pay the deposit to confirm your time."
        icon={<Lock size={34} aria-hidden="true" />}
      />
      <section className="grid gap-5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)] md:grid-cols-[1fr_1fr] md:items-center">
        <div className="flex items-center gap-5">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[var(--color-brand)] text-white">
            <CreditCard size={40} aria-hidden="true" />
          </span>
          <p className="font-serif text-6xl font-semibold text-[var(--color-brand)]">
            {money(pricing.depositCents)}
            <span className="block font-sans text-2xl font-normal">due now</span>
          </p>
        </div>
        <dl className="grid gap-3 text-lg">
          <div className="flex justify-between border-b border-[var(--color-border)] pb-3">
            <dt>Total</dt>
            <dd className="font-semibold text-[var(--color-brand)]">{money(pricing.priceCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Remaining due at appointment</dt>
            <dd className="font-semibold text-[var(--color-brand)]">{money(pricing.priceCents - pricing.depositCents)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Payment method</h2>
        <div className="mt-3 grid gap-3">
          <PaymentMethod selected label="Visa ending in 4242" detail="Expires 12/28" badge="Default" />
          <PaymentMethod label="Apple Pay" />
          <PaymentMethod label="Google Pay" />
          <PaymentMethod label="Add another card" icon={<Plus size={22} aria-hidden="true" />} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Billing address</h2>
        <button type="button" className="mt-3 grid w-full grid-cols-[42px_1fr_auto] items-center gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 text-left shadow-[var(--shadow-subtle)]">
          <User size={28} aria-hidden="true" />
          <span>
            <span className="block font-semibold">Maya Johnson</span>
            <span className="text-[var(--color-text-muted)]">Shaw, Washington, DC</span>
          </span>
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      </section>

      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
        {[
          ["Your payment is encrypted and secure.", Lock],
          ["Your deposit is held according to our cancellation policy.", ShieldCheck],
          ["Tips are never preselected.", CircleDollarSign],
        ].map(([text, Icon]) => {
          const IconComponent = Icon as ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
          return (
            <p key={String(text)} className="flex items-center gap-4 p-4 text-[var(--color-text-muted)]">
              <IconComponent className="text-[var(--color-gold)]" size={28} aria-hidden={true} />
              {text as string}
            </p>
          );
        })}
      </div>

      <label className="flex items-start gap-4 text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={authorized}
          onChange={(event) => setAuthorized(event.target.checked)}
          className="mt-1 h-7 w-7 rounded-[var(--radius-control)] border-[var(--color-border)] accent-[var(--color-brand)]"
        />
        <span>
          I authorize Touch of Heaven to charge {money(pricing.depositCents)} to the selected payment method to confirm my appointment.
        </span>
      </label>
      <p className="sr-only">
        You are booking {service.name} with {provider.name}.
      </p>
    </div>
  );
}

function PaymentMethod({
  selected,
  label,
  detail,
  badge,
  icon,
}: {
  selected?: boolean;
  label: string;
  detail?: string;
  badge?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={classNames(
        "grid min-h-16 w-full grid-cols-[42px_1fr_auto] items-center gap-4 rounded-[var(--radius-control)] border bg-white p-4 text-left shadow-[var(--shadow-subtle)]",
        selected ? "border-[var(--color-brand)]" : "border-[var(--color-border)]",
      )}
    >
      <span className={classNames("grid h-6 w-6 place-items-center rounded-full border", selected ? "border-[var(--color-brand)]" : "border-[var(--color-text-muted)]")}>
        {selected ? <span className="h-3 w-3 rounded-full bg-[var(--color-brand)]" /> : icon}
      </span>
      <span>
        <span className="block text-lg font-semibold">{label}</span>
        {detail ? <span className="text-[var(--color-text-muted)]">{detail}</span> : null}
      </span>
      {badge ? <span className="rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-sm font-semibold text-[var(--color-success)]">{badge}</span> : null}
    </button>
  );
}

function ProcessingStep({
  provider,
  service,
  pricing,
  selectedDate,
  selectedSlot,
  size,
  length,
  color,
  parting,
  selectedExtras,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  selectedDate: string;
  selectedSlot: SlotOption | null;
  size: string;
  length: string;
  color: string;
  parting: string;
  selectedExtras: BookingVariation[];
}) {
  return (
    <div className="mx-auto grid max-w-3xl justify-items-center gap-6 text-center">
      <div className="w-full text-left">
        <MobileProgress step="processing" />
      </div>
      <p className="font-semibold text-[var(--color-brand)]">Secure authorization in progress</p>
      <div className="relative grid h-64 w-64 place-items-center rounded-full border-4 border-[var(--color-brand)]/70">
        <span className="absolute inset-8 rounded-full border border-dashed border-[var(--color-gold)]" />
        <ShieldCheck className="fill-[var(--color-brand)] text-[var(--color-gold-light)] drop-shadow" size={120} aria-hidden="true" />
      </div>
      <StepIntro title="Securing your appointment" body={`We're authorizing your ${money(pricing.depositCents)} deposit and confirming the ${selectedSlot?.label ?? "selected"} time with ${provider.name}.`} />
      <section className="w-full divide-y divide-[var(--color-border)] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-4 text-left shadow-[var(--shadow-subtle)]">
        <ProcessingRow complete number={1} title="Payment details protected" status="Complete" />
        <ProcessingRow number={2} title="Deposit authorization" body={`Authorizing your ${money(pricing.depositCents)} deposit...`} status="In progress" />
        <ProcessingRow number={3} title="Booking confirmation" body="Confirming your appointment..." status="Waiting" muted />
      </section>
      <div className="w-full rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-5 text-left">
        <p className="flex gap-3">
          <Lock className="shrink-0 text-[var(--color-gold)]" size={30} aria-hidden="true" />
          <span>
            <span className="block font-semibold">Please keep this page open.</span>
            <span className="text-[var(--color-text-muted)]">You won&apos;t be charged twice if it refreshes.</span>
          </span>
        </p>
      </div>
      <section className="grid w-full gap-4 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 text-left shadow-[var(--shadow-subtle)] sm:grid-cols-[150px_1fr]">
        <ImageFrame image={service.media[0] ?? provider.image} className="h-40 rounded-[var(--radius-control)]" sizes="160px" />
        <div>
          <h2 className="font-serif text-2xl font-semibold">{service.name}</h2>
          <p className="mt-1 text-[var(--color-text-muted)]">
            with {provider.name} <BadgeCheck className="ml-1 inline fill-[var(--color-gold)] text-white" size={16} />
          </p>
          <p className="font-semibold text-[var(--color-brand)]">{provider.businessName}</p>
          <p className="mt-3 text-[var(--color-text-muted)]">
            {formatDateShort(selectedDate)} | {selectedSlot?.label ?? "10:00 AM"} | {durationLabel(pricing.durationMins)}
          </p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <span>Size: {size}</span>
            <span>Add-on: {selectedExtras.map((extra) => extra.label).join(", ") || "None"}</span>
            <span>Length: {length}</span>
            <span>Total: {money(pricing.priceCents)}</span>
            <span>Color: {color}</span>
            <span>Deposit: {money(pricing.depositCents)} due now</span>
            <span>Parting: {parting}</span>
            <span>Remaining: {money(pricing.priceCents - pricing.depositCents)} due at appointment</span>
          </div>
        </div>
      </section>
      <Link href="/support" className="inline-flex items-center gap-2 font-semibold text-[var(--color-brand)]">
        <HelpCircle size={20} aria-hidden="true" />
        Having trouble?
      </Link>
    </div>
  );
}

function ProcessingRow({
  complete,
  number,
  title,
  body,
  status,
  muted,
}: {
  complete?: boolean;
  number: number;
  title: string;
  body?: string;
  status: string;
  muted?: boolean;
}) {
  return (
    <div className="grid grid-cols-[54px_1fr_auto] items-center gap-4 py-4 first:pt-1 last:pb-1">
      <span
        className={classNames(
          "grid h-10 w-10 place-items-center rounded-full border-2 font-semibold",
          complete
            ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
            : muted
              ? "border-[var(--color-border)] text-[var(--color-text-muted)]"
              : "border-[var(--color-brand)] text-[var(--color-brand)]",
        )}
      >
        {complete ? <Check size={20} aria-hidden="true" /> : number}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        {body ? <span className="text-[var(--color-text-muted)]">{body}</span> : null}
      </span>
      <span className={classNames("font-semibold", complete ? "text-[var(--color-success)]" : muted ? "text-[var(--color-text-muted)]" : "text-[var(--color-brand)]")}>
        {status}
      </span>
    </div>
  );
}

function ConfirmationStep({
  provider,
  service,
  pricing,
  selectedDate,
  selectedSlot,
  appointmentId,
  size,
  length,
  color,
  parting,
}: {
  provider: ProviderProfile;
  service: BookingService;
  pricing: PricingPreview;
  selectedDate: string;
  selectedSlot: SlotOption | null;
  appointmentId: string;
  size: string;
  length: string;
  color: string;
  parting: string;
}) {
  return (
    <div className="mx-auto max-w-6xl py-8 text-center lg:py-14">
      <div className="hidden lg:flex lg:justify-center">
        <LogoMark withName={false} />
      </div>
      <div className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full border-4 border-[var(--color-gold)] bg-[var(--color-brand)] text-[var(--color-gold-light)] shadow-[var(--shadow-soft)]">
        <Check size={64} aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-serif text-4xl font-semibold text-[var(--color-brand)] lg:text-5xl">
        Your appointment is confirmed
      </h1>
      <p className="mt-3 text-lg text-[var(--color-text-muted)]">Amara has received the same booking details.</p>
      <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-success-soft)] px-4 py-2 font-semibold text-[var(--color-success)]">
        <Check size={18} aria-hidden="true" />
        Confirmed
      </p>

      <div className="mt-8 grid gap-6 text-left lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr_160px] sm:items-start">
            <ImageFrame image={provider.image} className="h-36 rounded-[var(--radius-control)]" sizes="160px" />
            <div>
              <h2 className="font-serif text-3xl font-semibold">Maya Johnson</h2>
              <p className="mt-1 text-lg font-semibold text-[var(--color-brand)]">{service.name}</p>
              <p className="mt-1">
                with {provider.name} <BadgeCheck className="ml-1 inline fill-[var(--color-gold)] text-white" size={17} />
              </p>
              <p className="mt-1 font-semibold text-[var(--color-brand)]">{provider.businessName}</p>
              <p className="mt-1 text-[var(--color-text-muted)]">{provider.location}</p>
            </div>
            <ImageFrame image={service.media[1] ?? service.media[0] ?? provider.image} className="hidden h-36 rounded-[var(--radius-control)] sm:block" sizes="160px" />
          </div>
          <div className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-5 text-lg">
            <p className="flex items-center gap-3"><Calendar size={24} />{formatDateLong(selectedDate)}</p>
            <p className="flex items-center gap-3"><Clock size={24} />{selectedSlot?.label ?? "10:00 AM"} - 3:00 PM ({durationLabel(pricing.durationMins)})</p>
            <p className="flex items-center gap-3"><MapPin size={24} />In studio in Shaw, Washington, DC</p>
            <p className="flex items-center gap-3"><Info size={24} />Booking reference: <span className="font-semibold text-[var(--color-brand)]">{appointmentId}</span></p>
          </div>
          <dl className="mt-5 grid gap-2 border-t border-[var(--color-border)] pt-5 text-sm sm:grid-cols-2">
            <div><dt className="text-[var(--color-text-muted)]">Length</dt><dd>{length}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">Hair length</dt><dd>{length}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">Hair color</dt><dd>{color}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">Parting</dt><dd>{parting}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">Size</dt><dd>{size}</dd></div>
          </dl>
        </section>

        <section className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-subtle)]">
          <h2 className="font-serif text-2xl font-semibold">Payment summary</h2>
          <div className="mt-5 divide-y divide-[var(--color-border)]">
            <PaymentLine icon={<CreditCard />} title="Deposit paid" detail="Paid today" value={money(pricing.depositCents)} success />
            <PaymentLine icon={<CircleDollarSign />} title="Remaining due at appointment" detail="Pay in studio" value={money(pricing.priceCents - pricing.depositCents)} />
          </div>
          <p className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-5 text-2xl font-semibold">
            <span>Total</span>
            <span>{money(pricing.priceCents)}</span>
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-3 text-[var(--color-brand)] sm:grid-cols-2 lg:grid-cols-4">
        <ActionLink href="/bookings" icon={<Calendar />} label="Add to calendar" />
        <ActionLink href="/map" icon={<MapPin />} label="Get directions" />
        <ActionLink href="/messages" icon={<MessageCircle />} label="Message Amara" />
        <ActionLink href="/bookings" icon={<Share2 />} label="Share details" />
      </div>
      <div className="mt-6 grid gap-3 lg:ml-auto lg:max-w-[420px]">
        <Link href={`/bookings/${appointmentId}`} className="inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 text-lg font-semibold text-white">
          View appointment
        </Link>
        <Link href="/for-clients" className="inline-flex min-h-14 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] px-5 text-lg font-semibold text-[var(--color-brand)]">
          Back to Home
        </Link>
      </div>
      <div className="mt-6 grid gap-4 rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-5 text-left text-[var(--color-text-muted)] lg:grid-cols-2">
        <p className="flex items-center gap-3"><Navigation className="text-[var(--color-gold)]" />Exact studio directions are available in your appointment details.</p>
        <p className="flex items-center gap-3"><Bell className="text-[var(--color-gold)]" />You&apos;ll get reminders before your appointment.</p>
      </div>
    </div>
  );
}

function PaymentLine({ icon, title, detail, value, success }: { icon: ReactNode; title: string; detail: string; value: string; success?: boolean }) {
  return (
    <div className="grid grid-cols-[54px_1fr_auto] items-center gap-4 py-5">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-brand)] text-white">{icon}</span>
      <span>
        <span className="block text-lg font-semibold">{title}</span>
        <span className="text-[var(--color-text-muted)]">{detail}</span>
      </span>
      <span className={classNames("text-xl font-semibold", success && "text-[var(--color-success)]")}>{value}</span>
    </div>
  );
}

function ActionLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-16 items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 font-semibold shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)]">
      {icon}
      {label}
    </Link>
  );
}

function toConsultationPayload(consultation: ConsultationDraft) {
  const hairLengthMap: Record<ConsultationDraft["hairLength"], string> = {
    Short: "SHORT",
    Shoulder: "MEDIUM",
    "Mid-back": "LONG",
    Longer: "VERY_LONG",
  };

  const payload: Record<string, string | boolean> = {
    recipientType: "SELF",
    currentHairLength: hairLengthMap[consultation.hairLength],
    currentStyle:
      consultation.protectiveStyle === "Yes"
        ? "Currently wearing a protective style."
        : "No current protective style.",
    scalpSensitivity: consultation.hasConcerns === "Yes",
  };

  if (consultation.hasConcerns === "Yes") {
    payload.tenderness = consultation.concernDetails || consultation.desiredOutcome;
  }

  return payload;
}

function bookingStateKey(braiderId: string) {
  return `toh-booking-draft:${braiderId}`;
}

function lastAppointmentKey(id: string) {
  return `toh-appointment:${id}`;
}

export function BookingFlow({
  braiderId,
  initialStep = "configure",
}: {
  braiderId: string;
  initialStep?: BookingStep;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get("serviceId");
  const selectedSizeParam = searchParams.get("size");
  const selectedLengthParam = searchParams.get("length");
  const [apiMode, setApiMode] = useState<ApiMode>(() => (isUuid(braiderId) ? "loading" : "demo"));
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const initialCatalog = useMemo(() => buildDemoCatalog(braiderId, serviceSlug), [braiderId, serviceSlug]);
  const initialService = initialCatalog.services[0]!;
  const [catalog, setCatalog] = useState<BookingCatalog>(initialCatalog);
  const [serviceId, setServiceId] = useState(initialService.id);
  const selectedService = catalog.services.find((service) => service.id === serviceId) ?? catalog.services[0]!;

  const [size, setSize] = useState("Medium");
  const [length, setLength] = useState("Mid-back");
  const [color, setColor] = useState("Natural Black");
  const [parting, setParting] = useState("Standard");
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(() => defaultExtraIdsFor(initialService));
  const [consultation, setConsultation] = useState<ConsultationDraft>(DEFAULT_CONSULTATION);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [arrivalNotes, setArrivalNotes] = useState("");
  const [stepFree, setStepFree] = useState(false);
  const [selectedDate, setSelectedDate] = useState(nextSaturdayFromToday);
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>(() => fallbackSlotsFor(nextSaturdayFromToday()));
  const [slotsFailed, setSlotsFailed] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(() => fallbackSlotsFor(nextSaturdayFromToday())[1] ?? null);
  const [pricing, setPricing] = useState<PricingPreview>(() =>
    computeLocalPrice(
      initialService,
      initialSelectedVariationsFor(initialService, selectedSizeParam, selectedLengthParam),
    ),
  );
  const [hold, setHold] = useState<SlotHold | null>(null);
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reviewAgreed, setReviewAgreed] = useState(false);
  const [paymentAuthorized, setPaymentAuthorized] = useState(true);

  const selectedVariations = useMemo(() => {
    const items = [
      selectedVariation(selectedService, "SIZE", size),
      selectedVariation(selectedService, "LENGTH", length),
      selectedVariation(selectedService, "COLOR", color),
      selectedVariation(selectedService, "PARTING", parting),
      ...selectedExtraIds
        .map((id) => selectedService.variations.find((variation) => variation.id === id) ?? null)
        .filter((variation): variation is BookingVariation => variation !== null),
    ].filter((variation): variation is BookingVariation => variation !== null);
    return items;
  }, [color, length, parting, selectedExtraIds, selectedService, size]);

  const backendVariationIds = useMemo(
    () =>
      selectedVariations
        .filter((variation) => variation.variationType !== "PARTING" && isUuid(variation.id))
        .map((variation) => variation.id),
    [selectedVariations],
  );

  const selectedExtras = useMemo(
    () =>
      selectedExtraIds
        .map((id) => selectedService.variations.find((variation) => variation.id === id))
        .filter((variation): variation is BookingVariation => Boolean(variation)),
    [selectedExtraIds, selectedService.variations],
  );

  const search = searchParams.toString();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      if (!isUuid(braiderId)) {
        const demo = buildDemoCatalog(braiderId, serviceSlug);
        if (!cancelled) {
          setCatalog(demo);
          setServiceId(demo.services[0]!.id);
          setLocationId(demo.locations[0]!.id);
          setApiMode("demo");
        }
        return;
      }

      const demo = buildDemoCatalog(braiderId, serviceSlug);
      try {
        const [profileResult, serviceResult, locationResult] = await Promise.all([
          browserApiFetch<ApiProfile>(`/api/v1/braiders/${braiderId}`),
          browserApiFetch<{ services: ApiService[] }>(`/api/v1/braiders/${braiderId}/services`),
          browserApiFetch<{ locations: ApiLocation[] }>(`/api/v1/braiders/${braiderId}/locations`),
        ]);
        if (cancelled) return;
        const services = serviceResult.services.map((service) => normalizeApiService(service, demo.services[0]!));
        const locations = locationResult.locations.map(normalizeApiLocation);
        const profile: ProviderProfile = {
          ...demo.provider,
          id: profileResult.braiderId,
          slug: profileResult.braiderId,
          name: profileResult.professionalName,
          businessName: profileResult.professionalName,
          rating: profileResult.rating?.average ?? demo.provider.rating,
          reviews: profileResult.rating?.count ?? demo.provider.reviews,
          category: profileResult.specialties?.[0] ?? demo.provider.category,
          location: locations[0]?.address ?? locations[0]?.label ?? demo.provider.location,
        };
        const liveCatalog = { provider: profile, services: services.length ? services : demo.services, locations: locations.length ? locations : demo.locations };
        setCatalog(liveCatalog);
        setServiceId(services.find((service) => service.id === serviceSlug)?.id ?? services[0]?.id ?? demo.services[0]!.id);
        setLocationId(locations[0]?.id ?? demo.locations[0]!.id);
        setApiMode("live");
      } catch (error) {
        if (cancelled) return;
        setCatalog(demo);
        setServiceId(demo.services[0]!.id);
        setLocationId(demo.locations[0]!.id);
        setApiMode("demo");
        setApiNotice(error instanceof ApiClientError ? error.message : "Live booking data is unavailable, so the design demo is running.");
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [braiderId, serviceSlug]);

  useEffect(() => {
    const state = window.localStorage.getItem(bookingStateKey(braiderId));
    if (!state) return;
    try {
      const parsed = JSON.parse(state) as Partial<{
        serviceId: string;
        size: string;
        length: string;
        color: string;
        parting: string;
        selectedExtraIds: string[];
        consultation: ConsultationDraft;
        locationId: string;
        arrivalNotes: string;
        stepFree: boolean;
        selectedDate: string;
        selectedSlot: SlotOption;
        hold: SlotHold;
        appointment: AppointmentRecord;
      }>;
      if (parsed.serviceId) setServiceId(parsed.serviceId);
      if (parsed.size) setSize(parsed.size);
      if (parsed.length) setLength(parsed.length);
      if (parsed.color) setColor(parsed.color);
      if (parsed.parting) setParting(parsed.parting);
      if (Array.isArray(parsed.selectedExtraIds)) setSelectedExtraIds(parsed.selectedExtraIds);
      if (parsed.consultation) setConsultation(parsed.consultation);
      if (parsed.locationId) setLocationId(parsed.locationId);
      if (parsed.arrivalNotes) setArrivalNotes(parsed.arrivalNotes);
      if (typeof parsed.stepFree === "boolean") setStepFree(parsed.stepFree);
      if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
      if (parsed.selectedSlot) setSelectedSlot(parsed.selectedSlot);
      if (parsed.hold) setHold(parsed.hold);
      if (parsed.appointment) setAppointment(parsed.appointment);
    } catch {
      window.localStorage.removeItem(bookingStateKey(braiderId));
    }
  }, [braiderId]);

  useEffect(() => {
    const sizeOptions = variationsFor(selectedService, "SIZE");
    const lengthOptions = variationsFor(selectedService, "LENGTH");
    const colorOptions = variationsFor(selectedService, "COLOR");
    const partingOptions = variationsFor(selectedService, "PARTING");
    setSize((current) => pickDefaultLabel(sizeOptions, selectedSizeParam ?? current, "Medium"));
    setLength((current) => pickDefaultLabel(lengthOptions, selectedLengthParam ?? current, "Mid-back"));
    setColor((current) => pickDefaultLabel(colorOptions, current, "Natural Black"));
    setParting((current) => pickDefaultLabel(partingOptions, current, "Standard"));
    const extras = variationsFor(selectedService, "ADD_ON");
    setSelectedExtraIds((current) => current.filter((id) => extras.some((extra) => extra.id === id)));
  }, [selectedLengthParam, selectedService, selectedSizeParam]);

  useEffect(() => {
    window.localStorage.setItem(
      bookingStateKey(braiderId),
      JSON.stringify({
        serviceId,
        size,
        length,
        color,
        parting,
        selectedExtraIds,
        consultation,
        locationId,
        arrivalNotes,
        stepFree,
        selectedDate,
        selectedSlot,
        hold,
        appointment,
      }),
    );
  }, [
    appointment,
    arrivalNotes,
    braiderId,
    color,
    consultation,
    hold,
    length,
    locationId,
    parting,
    selectedDate,
    selectedExtraIds,
    selectedSlot,
    serviceId,
    size,
    stepFree,
  ]);

  useEffect(() => {
    let cancelled = false;
    const local = computeLocalPrice(selectedService, selectedVariations);

    if (apiMode !== "live" || !isUuid(selectedService.id)) {
      setPricing(local);
      return;
    }

    browserApiFetch<{ computed: PricingPreview }>(`/api/v1/services/${selectedService.id}/preview-price`, {
      method: "POST",
      body: { variationIds: backendVariationIds },
    })
      .then((result) => {
        if (!cancelled) setPricing(result.computed);
      })
      .catch(() => {
        if (!cancelled) setPricing(local);
      });

    return () => {
      cancelled = true;
    };
  }, [apiMode, backendVariationIds, selectedService, selectedVariations]);

  useEffect(() => {
    let cancelled = false;
    const fallback = fallbackSlotsFor(selectedDate);

    if (apiMode !== "live" || !isUuid(braiderId) || !isUuid(selectedService.id)) {
      // Preview mode: the URL carries a slug, not a real business, so this
      // grid is a showcase rather than anyone's actual availability.
      setSlotsFailed(false);
      setSlotOptions(fallback);
      setSelectedSlot((current) => current && current.startAt.startsWith(selectedDate) ? current : fallback[1] ?? fallback[0] ?? null);
      return;
    }

    const query = new URLSearchParams({
      serviceId: selectedService.id,
      date: selectedDate,
    });
    if (backendVariationIds.length > 0) query.set("variationIds", backendVariationIds.join(","));

    browserApiFetch<{ slots: string[] }>(`/api/v1/braiders/${braiderId}/availability/slots?${query.toString()}`)
      .then((result) => {
        if (cancelled) return;
        const liveSlots = result.slots.map((slot) => ({ startAt: slot, label: slotLabel(slot) }));
        // No invented times for a real business. A day with nothing free
        // is shown as having nothing free - substituting a demo grid here
        // would let someone pick an hour this provider never offered.
        setSlotsFailed(false);
        setSlotOptions(liveSlots);
        setSelectedSlot((current) =>
          current && liveSlots.some((slot) => slot.startAt === current.startAt)
            ? current
            : liveSlots[0] ?? null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setSlotsFailed(true);
          setSlotOptions([]);
          setSelectedSlot(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiMode, backendVariationIds, braiderId, selectedDate, selectedService.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (initialStep !== "processing") return;
    const timer = window.setTimeout(() => {
      router.push(routeFor(braiderId, "confirmation", search));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [braiderId, initialStep, router, search]);

  function goTo(step: BookingStep) {
    setActionError(null);
    router.push(routeFor(braiderId, step, search));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    const index = orderedSteps.indexOf(initialStep);
    if (index <= 0) {
      router.push(`/businesses/${braiderId}`);
      return;
    }
    goTo(orderedSteps[index - 1]!);
  }

  async function ensureHold() {
    if (hold && selectedSlot && hold.startAt === selectedSlot.startAt) return hold;
    if (!selectedSlot) throw new Error("Choose a time before continuing.");
    if (apiMode === "live" && isUuid(selectedService.id)) {
      const result = await browserApiFetch<{ hold: SlotHold }>("/api/v1/availability/holds", {
        method: "POST",
        body: {
          serviceId: selectedService.id,
          startAt: selectedSlot.startAt,
          variationIds: backendVariationIds,
        },
      });
      setHold(result.hold);
      return result.hold;
    }
    const fakeHold: SlotHold = {
      id: `hold_demo_${Date.now()}`,
      startAt: selectedSlot.startAt,
      computedPriceCents: pricing.priceCents,
      depositCents: pricing.depositCents,
    };
    setHold(fakeHold);
    return fakeHold;
  }

  async function ensureAppointment() {
    if (appointment) return appointment;
    const activeHold = await ensureHold();
    if (apiMode === "live" && isUuid(selectedService.id) && isUuid(locationId)) {
      const result = await browserApiFetch<{
        appointment: AppointmentRecord;
        clientSecret: string | null;
        depositDueCents: number;
      }>("/api/v1/bookings", {
        method: "POST",
        body: {
          holdId: activeHold.id,
          serviceId: selectedService.id,
          locationId,
          variationIds: backendVariationIds,
        },
      });
      setAppointment(result.appointment);
      setClientSecret(result.clientSecret);
      try {
        await browserApiFetch(`/api/v1/bookings/${result.appointment.id}/consultation`, {
          method: "POST",
          body: toConsultationPayload(consultation),
        });
      } catch (error) {
        setApiNotice(error instanceof ApiClientError ? error.message : "Consultation could not be saved yet.");
      }
      return result.appointment;
    }

    const fakeAppointment: AppointmentRecord = {
      id: demoAppointmentId,
      status: "CONFIRMED",
      startAt: selectedSlot?.startAt ?? slotForDate(selectedDate, 10),
      endAt: slotForDate(selectedDate, 15),
      computedPriceCents: pricing.priceCents,
      depositPaidCents: pricing.depositCents,
      balanceDueCents: pricing.priceCents - pricing.depositCents,
    };
    setAppointment(fakeAppointment);
    window.localStorage.setItem(
      lastAppointmentKey(fakeAppointment.id),
      JSON.stringify({
        provider: catalog.provider,
        service: selectedService,
        pricing,
        selectedDate,
        selectedSlot,
        size,
        length,
        color,
        parting,
        selectedExtras,
        appointment: fakeAppointment,
      }),
    );
    return fakeAppointment;
  }

  async function handleContinue() {
    setActionError(null);
    setBusy(true);
    try {
      if (initialStep === "configure") goTo("extras");
      if (initialStep === "extras") goTo("consultation");
      if (initialStep === "consultation") goTo("location");
      if (initialStep === "location") goTo("time");
      if (initialStep === "time") {
        await ensureHold();
        goTo("review");
      }
      if (initialStep === "review") {
        if (!reviewAgreed) {
          setActionError("Please agree to the booking terms before continuing.");
          return;
        }
        await ensureAppointment();
        goTo("payment");
      }
      if (initialStep === "payment") {
        if (!paymentAuthorized) {
          setActionError("Please authorize the deposit charge before paying.");
          return;
        }
        const activeAppointment = await ensureAppointment();
        if (apiMode === "live" && isUuid(activeAppointment.id)) {
          try {
            await browserApiFetch(`/api/v1/bookings/${activeAppointment.id}/mock-confirm`, {
              method: "POST",
              body: {},
            });
          } catch (error) {
            if (clientSecret) throw error;
            setApiNotice(error instanceof ApiClientError ? error.message : "Payment confirmation is waiting on the webhook.");
          }
        }
        window.localStorage.setItem(
          lastAppointmentKey(activeAppointment.id),
          JSON.stringify({
            provider: catalog.provider,
            service: selectedService,
            pricing,
            selectedDate,
            selectedSlot,
            size,
            length,
            color,
            parting,
            selectedExtras,
            appointment: {
              ...activeAppointment,
              status: "CONFIRMED",
              depositPaidCents: pricing.depositCents,
              balanceDueCents: pricing.priceCents - pricing.depositCents,
            },
          }),
        );
        goTo("processing");
      }
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "We could not continue this booking.");
    } finally {
      setBusy(false);
    }
  }

  const main = (() => {
    if (initialStep === "extras") {
      return (
        <ExtrasStep
          selectedExtras={selectedExtraIds}
          setSelectedExtras={setSelectedExtraIds}
          service={selectedService}
          provider={catalog.provider}
          pricing={pricing}
        />
      );
    }
    if (initialStep === "consultation") {
      return <ConsultationStep consultation={consultation} setConsultation={setConsultation} />;
    }
    if (initialStep === "location") {
      return (
        <LocationStep
          locations={catalog.locations}
          locationId={locationId}
          setLocationId={setLocationId}
          arrivalNotes={arrivalNotes}
          setArrivalNotes={setArrivalNotes}
          stepFree={stepFree}
          setStepFree={setStepFree}
        />
      );
    }
    if (initialStep === "time") {
      return (
        <TimeStep
          provider={catalog.provider}
          service={selectedService}
          pricing={pricing}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          slots={slotOptions}
          slotsFailed={slotsFailed}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
        />
      );
    }
    if (initialStep === "review") {
      return (
        <ReviewStep
          provider={catalog.provider}
          service={selectedService}
          pricing={pricing}
          size={size}
          length={length}
          color={color}
          parting={parting}
          selectedExtras={selectedExtras}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          agreed={reviewAgreed}
          setAgreed={setReviewAgreed}
        />
      );
    }
    if (initialStep === "payment") {
      return (
        <PaymentStep
          provider={catalog.provider}
          service={selectedService}
          pricing={pricing}
          authorized={paymentAuthorized}
          setAuthorized={setPaymentAuthorized}
        />
      );
    }
    if (initialStep === "processing") {
      return (
        <ProcessingStep
          provider={catalog.provider}
          service={selectedService}
          pricing={pricing}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          size={size}
          length={length}
          color={color}
          parting={parting}
          selectedExtras={selectedExtras}
        />
      );
    }
    if (initialStep === "confirmation") {
      return (
        <ConfirmationStep
          provider={catalog.provider}
          service={selectedService}
          pricing={pricing}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          appointmentId={appointment?.id ?? demoAppointmentId}
          size={size}
          length={length}
          color={color}
          parting={parting}
        />
      );
    }
    return (
      <ConfigureStep
        provider={catalog.provider}
        service={selectedService}
        pricing={pricing}
        size={size}
        setSize={setSize}
        length={length}
        setLength={setLength}
        color={color}
        setColor={setColor}
        parting={parting}
        setParting={setParting}
      />
    );
  })();

  const fullScreen = initialStep === "processing" || initialStep === "confirmation";
  const selectedColorCode = selectedVariation(selectedService, "COLOR", color)?.code;

  return (
    <div className="min-h-dvh bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <MobileBookingHeader onBack={initialStep === "confirmation" ? () => goTo("payment") : goBack} />
      <DesktopClientHeader />
      <main className={classNames("mx-auto w-full max-w-[1500px] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-12", fullScreen && "max-w-[1200px]")}>
        {!fullScreen ? (
          <div className="mb-6 grid gap-5">
            <MobileProgress step={initialStep} />
            <DesktopStepper step={initialStep} />
            <div className="hidden justify-end lg:flex">
              <Link href="/explore" className="inline-flex items-center gap-2 font-semibold text-[var(--color-brand)]">
                <Save size={18} aria-hidden="true" />
                Save & exit
              </Link>
            </div>
          </div>
        ) : null}

        {apiNotice ? (
          <div className="mb-5 rounded-[var(--radius-control)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
            {apiNotice}
          </div>
        ) : null}

        {fullScreen ? (
          main
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0">{main}</div>
            <BookingSummaryCard
              provider={catalog.provider}
              service={selectedService}
              pricing={pricing}
              size={size}
              length={length}
              color={selectedColorCode ? `${color} ${selectedColorCode}` : color}
              parting={parting}
              selectedExtras={selectedExtras}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              step={initialStep}
              onContinue={() => void handleContinue()}
              onBack={goBack}
              busy={busy || apiMode === "loading"}
              error={actionError}
            />
          </div>
        )}
      </main>
      <StickyMobileActions
        step={initialStep}
        pricing={pricing}
        selectedSlot={selectedSlot}
        onBack={goBack}
        onContinue={() => void handleContinue()}
        busy={busy}
      />
      {initialStep === "confirmation" ? <MobileBottomNav active="Bookings" /> : null}
      <div className="hidden lg:block">
        <PublicFooter />
      </div>
    </div>
  );
}
