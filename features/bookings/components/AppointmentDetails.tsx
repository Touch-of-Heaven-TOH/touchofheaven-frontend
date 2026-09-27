"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { brandAssets } from "@/config/site";
import { AfterAppointment } from "@/features/bookings/components/AfterAppointment";
import { AppointmentChangeRequests } from "@/features/bookings/components/AppointmentChangeRequests";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import {
  featuredProfessional,
  getService,
  type DiscoveryImage,
} from "@/features/discovery/discovery-data";

type PendingChangeRequest = {
  id: string;
  type: "RESCHEDULE" | "CANCELLATION";
  requestedStartAt: string | null;
  reason: string;
  createdAt: string;
};

type ApiAppointment = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  computedPriceCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  checkInCode?: string | null;
  canRequestChange?: boolean;
  pendingChangeRequest?: PendingChangeRequest | null;
  business?: { id: string; name: string; professionalName: string; phone: string | null } | null;
  location?: { label: string; locationType: string } | null;
  cancellationPolicy?: { key: string; label: string; description: string } | null;
  snapshot?: {
    serviceName?: string | null;
    braiderName?: string | null;
    braiderLocationDescription?: string | null;
    variationSelections?: unknown;
  } | null;
};

type StoredAppointment = {
  provider?: {
    name?: string;
    businessName?: string;
    location?: string;
    rating?: number;
    reviews?: number;
    image?: DiscoveryImage;
  };
  service?: {
    name?: string;
    media?: DiscoveryImage[];
  };
  pricing?: {
    priceCents?: number;
    durationMins?: number;
    depositCents?: number;
  };
  selectedDate?: string;
  selectedSlot?: {
    startAt?: string;
    label?: string;
  } | null;
  size?: string;
  length?: string;
  color?: string;
  parting?: string;
  selectedExtras?: Array<{ label?: string; priceDeltaCents?: number }>;
  appointment?: ApiAppointment;
};

type SnapshotVariation = {
  variationType?: string;
  label?: string;
  priceDeltaCents?: number;
};

type AppointmentView = {
  id: string;
  status: string;
  providerName: string;
  businessName: string;
  location: string;
  rating: number;
  reviews: number;
  serviceName: string;
  providerImage: DiscoveryImage;
  serviceImage: DiscoveryImage;
  startAt: string;
  endAt: string;
  priceCents: number;
  depositCents: number;
  balanceCents: number;
  size: string;
  length: string;
  color: string;
  parting: string;
  extras: string[];
  checkInCode: string | null;
  canRequestChange: boolean;
  pendingChangeRequest: PendingChangeRequest | null;
  cancellationPolicy: { label: string; description: string } | null;
  isLive: boolean;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function lastAppointmentKey(id: string) {
  return `toh-appointment:${id}`;
}

function fallbackStartAt() {
  return "2026-09-05T10:00:00";
}

function fallbackEndAt() {
  return "2026-09-05T15:00:00";
}

function formatDateLong(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saturday, September 5, 2026";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "10:00 AM";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function durationLabel(startAt: string, endAt: string, fallbackMins = 300) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const mins =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? fallbackMins
      : Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

function daysUntil(value: string) {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "In 3 days";
  const now = new Date();
  const dayMs = 86_400_000;
  const diff = Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / dayMs);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function snapshotVariations(snapshot: ApiAppointment["snapshot"]) {
  const raw = snapshot?.variationSelections;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is SnapshotVariation => {
    return Boolean(item) && typeof item === "object" && "label" in item;
  });
}

function firstVariationLabel(
  snapshot: ApiAppointment["snapshot"],
  variationType: string,
  fallback: string,
) {
  return (
    snapshotVariations(snapshot).find((item) => item.variationType === variationType)?.label ??
    fallback
  );
}

function extraLabels(snapshot: ApiAppointment["snapshot"], stored: StoredAppointment | null) {
  const snapshotExtras = snapshotVariations(snapshot)
    .filter((item) => item.variationType === "ADD_ON")
    .map((item) => item.label)
    .filter((label): label is string => Boolean(label));
  if (snapshotExtras.length > 0) return snapshotExtras;
  return (
    stored?.selectedExtras
      ?.map((extra) => extra.label)
      .filter((label): label is string => Boolean(label)) ?? ["Boho curl finish"]
  );
}

function buildView(
  appointmentId: string,
  apiAppointment: ApiAppointment | null,
  stored: StoredAppointment | null,
): AppointmentView {
  const demoService = getService(featuredProfessional, "medium-knotless-braids");
  const appointment = apiAppointment ?? stored?.appointment ?? null;
  const snapshot = appointment?.snapshot ?? null;
  const provider = stored?.provider;
  const service = stored?.service;
  const startAt =
    appointment?.startAt ?? stored?.selectedSlot?.startAt ?? fallbackStartAt();
  const endAt = appointment?.endAt ?? fallbackEndAt();
  const fallbackPriceCents = 25_500;
  const fallbackDepositCents = 6_400;
  const priceCents =
    appointment?.computedPriceCents ??
    stored?.pricing?.priceCents ??
    fallbackPriceCents;
  const depositCents =
    appointment?.depositPaidCents && appointment.depositPaidCents > 0
      ? appointment.depositPaidCents
      : stored?.pricing?.depositCents ?? fallbackDepositCents;
  const balanceCents =
    appointment?.balanceDueCents ??
    Math.max(0, priceCents - depositCents);

  return {
    id: appointment?.id ?? appointmentId,
    status: appointment?.status ?? "CONFIRMED",
    providerName:
      apiAppointment?.business?.professionalName ??
      snapshot?.braiderName ??
      provider?.name ??
      featuredProfessional.name,
    businessName:
      apiAppointment?.business?.name ?? provider?.businessName ?? featuredProfessional.businessName,
    location:
      apiAppointment?.location?.label ??
      snapshot?.braiderLocationDescription ??
      provider?.location ??
      featuredProfessional.location,
    rating: provider?.rating ?? featuredProfessional.rating,
    reviews: provider?.reviews ?? featuredProfessional.reviews,
    serviceName: snapshot?.serviceName ?? service?.name ?? demoService.name,
    providerImage: provider?.image ?? featuredProfessional.image,
    serviceImage:
      service?.media?.[1] ??
      service?.media?.[0] ??
      demoService.gallery[1] ??
      demoService.image,
    startAt,
    endAt,
    priceCents,
    depositCents,
    balanceCents,
    size: firstVariationLabel(snapshot, "SIZE", stored?.size ?? "Medium"),
    length: firstVariationLabel(snapshot, "LENGTH", stored?.length ?? "Mid-back"),
    color: firstVariationLabel(snapshot, "COLOR", stored?.color ?? "Natural Black 1B"),
    parting: stored?.parting ?? "Standard",
    extras: extraLabels(snapshot, stored),
    checkInCode: apiAppointment?.checkInCode ?? null,
    canRequestChange: apiAppointment?.canRequestChange ?? false,
    pendingChangeRequest: apiAppointment?.pendingChangeRequest ?? null,
    cancellationPolicy: apiAppointment?.cancellationPolicy ?? null,
    isLive: Boolean(apiAppointment),
  };
}

function Header() {
  const nav = [
    { label: "Home", href: "/for-clients" },
    { label: "Explore", href: "/explore" },
    { label: "Bookings", href: "/bookings" },
    { label: "AI Studio", href: "/ai-studio" },
    { label: "Market", href: "/marketplace" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/94 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-5 px-5 lg:px-10">
        <Link href="/for-clients" className="flex items-center gap-4">
          <Image
            alt="Touch of Heaven"
            className="object-contain"
            height={54}
            src={brandAssets.logoMark}
            width={54}
          />
          <span className="hidden font-serif text-2xl font-semibold sm:inline">
            Touch of Heaven
          </span>
        </Link>
        <nav className="hidden items-center gap-9 text-base font-semibold lg:flex">
          {nav.map((item) => (
            <Link
              aria-current={item.label === "Bookings" ? "page" : undefined}
              className={classNames(
                "border-b-2 px-1 py-7 transition-colors",
                item.label === "Bookings"
                  ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                  : "border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-brand)]",
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            aria-label="Saved"
            className="hidden size-10 place-items-center rounded-full border border-transparent transition hover:border-[var(--color-border)] lg:grid"
            href="/account/saved"
          >
            <Heart size={22} aria-hidden="true" />
          </Link>
          <Link
            aria-label="Market"
            className="hidden min-h-10 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 font-semibold text-[var(--color-brand)] transition hover:border-[var(--color-brand)] xl:inline-flex"
            href="/marketplace"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            Market
          </Link>
          <Link
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-full border border-transparent transition hover:border-[var(--color-border)]"
            href="/account/notifications"
          >
            <Bell size={22} aria-hidden="true" />
            <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-white">
              3
            </span>
          </Link>
          <Link href="/account" className="flex items-center gap-2 font-semibold">
            <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
              <Image alt="Maya Johnson" fill sizes="40px" src={featuredProfessional.image.src} />
            </span>
            <span className="hidden sm:inline">Maya</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function DetailPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={classNames(
        "rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--color-surface-strong)] text-[var(--color-brand)]">
      {children}
    </span>
  );
}

function InfoRow({
  icon,
  title,
  detail,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <DetailPanel>
      <div className="flex items-center gap-4">
        <IconCircle>{icon}</IconCircle>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-[var(--color-text-muted)]">{detail}</p>
        </div>
        {action ?? <ChevronRight className="text-[var(--color-text-muted)]" aria-hidden="true" />}
      </div>
    </DetailPanel>
  );
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 font-semibold text-[var(--color-brand)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--color-brand)]"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileBottomNav() {
  const nav = [
    { label: "Home", icon: Home, href: "/for-clients" },
    { label: "Explore", icon: Search, href: "/explore" },
    { label: "Market", icon: ShoppingBag, href: "/marketplace", featured: true },
    { label: "AI Studio", icon: Sparkles, href: "/ai-studio" },
    { label: "Profile", icon: User, href: "/account" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_34px_rgba(43,23,36,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.label}
              className={classNames(
                "grid justify-items-center gap-1 py-2 text-xs font-semibold text-[var(--color-text-muted)]",
                item.featured && "-mt-7 text-[var(--color-brand)]",
              )}
            >
              <span
                className={classNames(
                  "grid size-10 place-items-center rounded-full",
                  item.featured && "size-16 bg-[var(--color-brand)] text-white shadow-[var(--shadow-soft)]",
                )}
              >
                <Icon size={item.featured ? 26 : 22} aria-hidden="true" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppointmentDetails({ appointmentId }: { appointmentId: string }) {
  const [apiAppointment, setApiAppointment] = useState<ApiAppointment | null>(null);
  const [storedAppointment, setStoredAppointment] = useState<StoredAppointment | null>(null);
  const [loading, setLoading] = useState(isUuid(appointmentId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = window.localStorage.getItem(lastAppointmentKey(appointmentId));
    if (saved) {
      try {
        setStoredAppointment(JSON.parse(saved) as StoredAppointment);
      } catch {
        window.localStorage.removeItem(lastAppointmentKey(appointmentId));
      }
    }

    if (!isUuid(appointmentId)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    browserApiFetch<{ appointment: ApiAppointment }>(`/api/v1/bookings/${appointmentId}`)
      .then((result) => {
        if (!cancelled) {
          setApiAppointment(result.appointment);
          setError(null);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(
            fetchError instanceof ApiClientError
              ? fetchError.message
              : "We could not load the live appointment, so the saved booking details are shown.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointmentId, reloadToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const view = useMemo(
    () => buildView(appointmentId, apiAppointment, storedAppointment),
    [apiAppointment, appointmentId, storedAppointment],
  );
  const duration = durationLabel(
    view.startAt,
    view.endAt,
    storedAppointment?.pricing?.durationMins,
  );
  const confirmed = view.status === "CONFIRMED";

  // Neither the live appointment nor a saved copy of it. Every field below
  // would be invented - a provider name, a price, a time none of which are
  // this person's - so say plainly that it could not be loaded.
  if (!loading && !apiAppointment && !storedAppointment) {
    return (
      <div className="min-h-dvh bg-[var(--color-page)] text-[var(--color-text-primary)]">
        <Header />
        <main className="mx-auto w-full max-w-[720px] px-5 py-16">
          <h1 className="font-serif text-2xl font-semibold">
            We couldn&apos;t load this appointment
          </h1>
          <p className="mt-3 text-[var(--color-text-muted)]">
            {error ?? "It may have been cancelled, or the link may be wrong."}
          </p>
          <Link className="btn-primary mt-6 inline-flex" href="/bookings">
            Back to my bookings
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-[1500px] px-5 pb-32 pt-6 lg:px-10 lg:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/bookings"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white transition hover:border-[var(--color-brand)]"
            aria-label="Back to bookings"
          >
            <ChevronRight className="rotate-180" size={20} aria-hidden="true" />
          </Link>
          <div
            className={classNames(
              "inline-flex items-center gap-3 rounded-full px-4 py-2 font-semibold",
              confirmed
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
            )}
          >
            <Check size={18} aria-hidden="true" />
            {confirmed ? "Confirmed" : view.status.replaceAll("_", " ")}
          </div>
          <p className="inline-flex items-center gap-2 font-semibold text-[var(--color-brand)]">
            <Calendar size={19} aria-hidden="true" />
            {daysUntil(view.startAt)}
          </p>
        </div>

        <div className="mt-6 grid gap-2">
          <p className="font-semibold text-[var(--color-copper)]">10 of 10</p>
          <div className="grid grid-cols-8 gap-3" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} className="h-1.5 rounded-full bg-[var(--color-brand)]" />
            ))}
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold lg:text-5xl">
            Appointment details
          </h1>
        </div>

        {error ? (
          <div className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {loading && !storedAppointment ? (
          <div className="mt-8">
            <LoadingSkeleton label="Loading appointment" lines={8} />
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_520px] xl:grid-cols-[minmax(0,1fr)_560px]">
            <div className="grid content-start gap-5">
              <DetailPanel>
                <div className="grid gap-5 md:grid-cols-[230px_1fr]">
                  <div className="relative h-64 overflow-hidden rounded-[var(--radius-control)] md:h-full md:min-h-64">
                    <Image
                      alt={view.serviceImage.alt}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1024px) 230px, 100vw"
                      src={view.serviceImage.src}
                      style={{ objectPosition: view.serviceImage.position }}
                    />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-semibold">{view.serviceName}</h2>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
                        <Image
                          alt={view.providerName}
                          className="object-cover"
                          fill
                          sizes="64px"
                          src={view.providerImage.src}
                          style={{ objectPosition: view.providerImage.position }}
                        />
                      </span>
                      <div>
                        <p className="text-xl font-semibold">
                          {view.providerName}
                          <BadgeCheck
                            className="ml-1 inline fill-[var(--color-gold)] text-white"
                            size={18}
                          />
                        </p>
                        <p className="font-semibold text-[var(--color-brand)]">{view.businessName}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-base md:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <Calendar size={20} aria-hidden="true" />
                        {formatDateLong(view.startAt)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock size={20} aria-hidden="true" />
                        {formatTime(view.startAt)} - {formatTime(view.endAt)} ({duration})
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={20} aria-hidden="true" />
                        In studio in {view.location}
                      </p>
                      <p className="flex items-center gap-2">
                        <Star className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={20} aria-hidden="true" />
                        {view.rating} ({view.reviews} reviews)
                      </p>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <ActionLink href="/messages" icon={<MessageCircle size={20} />} label="Message" />
                      <ActionLink href="/map" icon={<Navigation size={20} />} label="Directions" />
                      <ActionLink href="/bookings" icon={<Calendar size={20} />} label="Add to calendar" />
                    </div>
                  </div>
                </div>
              </DetailPanel>

              <InfoRow
                icon={<Sparkles size={28} aria-hidden="true" />}
                title="Your configuration"
                detail={`Size: ${view.size} · Length: ${view.length} · Color: ${view.color} · Parting: ${view.parting}${
                  view.extras.length ? ` · Add-on: ${view.extras.join(", ")}` : ""
                }`}
              />
              <InfoRow
                icon={<MessageCircle size={28} aria-hidden="true" />}
                title="Consultation shared"
                detail="You and Amara see the same booking record."
              />
              <DetailPanel>
                <div className="grid gap-5 md:grid-cols-[1fr_330px] md:items-center">
                  <div className="flex gap-4">
                    <MapPin className="mt-1 shrink-0 text-[var(--color-gold)]" size={30} aria-hidden="true" />
                    <div>
                      <h2 className="text-xl font-semibold">Studio location</h2>
                      <p className="mt-2 font-semibold text-[var(--color-brand)]">{view.businessName}</p>
                      <p className="text-[var(--color-text-muted)]">{view.location}</p>
                      <p className="text-[var(--color-text-muted)]">Exact address shared after booking</p>
                    </div>
                  </div>
                  <div className="relative h-32 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[linear-gradient(135deg,#f2eee8_0%,#ffffff_46%,#e7f1df_100%)]">
                    <span className="absolute left-[52%] top-[42%] grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--color-brand)] text-white shadow-[var(--shadow-soft)]">
                      <MapPin size={24} aria-hidden="true" />
                    </span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-white/80" />
                    <span className="absolute left-1/4 top-0 h-full w-px bg-white/80" />
                    <span className="absolute right-1/4 top-0 h-full w-px bg-white/80" />
                    <span className="absolute bottom-4 left-5 text-xs font-semibold text-[var(--color-text-muted)]">Shaw</span>
                  </div>
                </div>
                <Link
                  href="/map"
                  className="mt-5 flex items-center justify-end gap-2 font-semibold text-[var(--color-brand)]"
                >
                  View full directions <ChevronRight size={18} aria-hidden="true" />
                </Link>
              </DetailPanel>
            </div>

            <aside className="grid content-start gap-5">
              <DetailPanel>
                <h2 className="font-serif text-2xl font-semibold">Payment</h2>
                <dl className="mt-5 grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm text-[var(--color-text-muted)]">Total</dt>
                    <dd className="mt-1 text-2xl font-semibold">{money(view.priceCents)}</dd>
                  </div>
                  <div className="border-l border-[var(--color-border)] pl-4">
                    <dt className="text-sm text-[var(--color-text-muted)]">Deposit paid</dt>
                    <dd className="mt-1 text-2xl font-semibold text-[var(--color-success)]">
                      {money(view.depositCents)}
                    </dd>
                  </div>
                  <div className="border-l border-[var(--color-border)] pl-4">
                    <dt className="text-sm text-[var(--color-text-muted)]">Remaining</dt>
                    <dd className="mt-1 text-2xl font-semibold">{money(view.balanceCents)}</dd>
                  </div>
                </dl>
              </DetailPanel>
              <InfoRow
                icon={<ShieldCheck size={28} aria-hidden="true" />}
                title="Booking Protection"
                detail="Your booking is protected. You will not be charged twice if this page is refreshed."
                action={<Link href="/how-it-works" className="font-semibold text-[var(--color-brand)]">Learn more</Link>}
              />
              {view.checkInCode && view.status === "CONFIRMED" ? (
                <DetailPanel className="border-[var(--color-brand)]/30 bg-[var(--color-brand-soft)]/40">
                  <h2 className="font-serif text-2xl font-semibold">Your check-in code</h2>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    Show this when you arrive so {view.providerName} can record your arrival time.
                  </p>
                  <p className="mt-4 text-center font-mono text-4xl tracking-[0.35em] text-[var(--color-brand)]">
                    {view.checkInCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(view.checkInCode ?? "")}
                    className="mx-auto mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--color-brand)]"
                  >
                    <Copy size={18} aria-hidden="true" />
                    Copy code
                  </button>
                </DetailPanel>
              ) : null}
              {view.status === "COMPLETED" ? (
                <AfterAppointment
                  appointmentId={view.id}
                  providerName={view.providerName}
                />
              ) : null}
              <InfoRow
                icon={<Clock size={28} aria-hidden="true" />}
                title={view.cancellationPolicy ? `${view.cancellationPolicy.label} cancellation policy` : "Cancellation policy"}
                detail={
                  view.cancellationPolicy?.description ??
                  "Cancel or reschedule at least 48 hours before your appointment to avoid a fee."
                }
                action={<Link href="/legal/cancellation" className="font-semibold text-[var(--color-brand)]">View policy</Link>}
              />
              <InfoRow
                icon={<CreditCard size={28} aria-hidden="true" />}
                title="Booking reference"
                detail={view.id}
                action={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 font-semibold text-[var(--color-brand)]"
                    onClick={() => void navigator.clipboard?.writeText(view.id)}
                  >
                    <Copy size={18} aria-hidden="true" />
                    Copy
                  </button>
                }
              />
              {view.isLive ? (
                <AppointmentChangeRequests
                  appointmentId={view.id}
                  startAt={view.startAt}
                  businessName={view.businessName}
                  canRequestChange={view.canRequestChange}
                  pendingRequest={view.pendingChangeRequest}
                  onRequested={() => setReloadToken((token) => token + 1)}
                />
              ) : null}
              <p className="text-center text-sm text-[var(--color-text-muted)]">
                Changes are subject to {view.providerName}&apos;s availability and the cancellation
                policy above.
              </p>
            </aside>
          </div>
        )}
      </main>
      <div className="hidden lg:block">
        <PublicFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
