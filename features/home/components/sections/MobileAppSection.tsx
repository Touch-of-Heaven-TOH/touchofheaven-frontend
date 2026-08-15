import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  MapPin,
  MessageCircle,
  PackageCheck,
  QrCode,
  Search,
  ShoppingBag,
  Star,
} from "lucide-react";
import { GooglePlayBadge, AppStoreBadge } from "@/components/shared/StoreBadges";
import { brandAssets, siteConfig } from "@/config/site";
import { homeMediaAssets } from "@/features/home/config/hero-media";

function PhoneShell({
  children,
  device,
  tilt,
}: {
  children: ReactNode;
  device: "iphone" | "samsung";
  tilt: "left" | "right";
}) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[245px] rounded-[2.5rem] border-[9px] border-[#171217] bg-[#171217] p-2 shadow-[0_28px_70px_rgba(45,27,78,0.24)] ${
        tilt === "left" ? "-rotate-3" : "rotate-3"
      }`}
    >
      <div className="absolute left-1/2 top-3 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#171217]" />
      {device === "samsung" ? (
        <div className="absolute left-1/2 top-5 z-30 size-2 -translate-x-1/2 rounded-full bg-black/70 ring-1 ring-white/20" />
      ) : null}
      <div className="overflow-hidden rounded-[2rem] bg-white text-[var(--color-brand-strong)]">
        {children}
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-5 text-[10px] font-bold">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-3 rounded-sm border border-current" />
        <span className="h-2 w-4 rounded-sm bg-current" />
      </span>
    </div>
  );
}

function BraiderDiscoveryScreen() {
  const braiders = [
    ["Touched by Tee", "Knotless braids", "$220"],
    ["Braids by Nia", "Cornrows", "$130"],
    ["Hair by Milly", "Boho braids", "$230"],
  ];

  return (
    <div>
      <PhoneStatusBar />
      <div className="px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="relative size-8 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
            <Image
              alt=""
              className="object-contain p-1"
              fill
              sizes="32px"
              src={brandAssets.logoMark}
            />
          </span>
          <Search aria-hidden="true" size={17} />
        </div>
        <h3 className="font-serif text-2xl font-semibold leading-tight">
          Find braiders near you
        </h3>
        <div className="relative mt-3 h-28 overflow-hidden rounded-md bg-[var(--color-sage-soft)]">
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(30deg,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(120deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:38px_38px]" />
          <span className="absolute left-8 top-7 grid size-8 place-items-center rounded-full bg-[var(--color-brand)] text-white shadow-lg">
            <MapPin aria-hidden="true" size={17} />
          </span>
          <span className="absolute bottom-5 right-9 grid size-7 place-items-center rounded-full bg-[var(--color-gold)] text-[var(--color-brand-strong)] shadow-lg">
            <MapPin aria-hidden="true" size={15} />
          </span>
        </div>
        <div className="mt-3 grid gap-2">
          {braiders.map(([name, service, price]) => (
            <div
              className="grid grid-cols-[38px_1fr_auto] items-center gap-2 rounded-md border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-subtle)]"
              key={name}
            >
              <span className="relative size-9 overflow-hidden rounded-full">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="36px"
                  src={homeMediaAssets.communitySalon.src}
                />
              </span>
              <span>
                <span className="block text-[11px] font-bold">{name}</span>
                <span className="block text-[10px] text-[var(--color-text-muted)]">
                  {service}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                  <Star
                    aria-hidden="true"
                    className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                    size={11}
                  />
                  4.9
                </span>
              </span>
              <span className="text-[11px] font-bold">{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingMarketplaceScreen() {
  const bookingRows = [
    { label: "Secure deposit", value: "$45.00", Icon: CalendarCheck },
    { label: "Aftercare bundle", value: "$34.99", Icon: PackageCheck },
    { label: "Message stylist", value: "Open", Icon: MessageCircle },
  ];

  return (
    <div>
      <PhoneStatusBar />
      <div className="px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold">Checkout</span>
          <ShoppingBag aria-hidden="true" size={17} />
        </div>
        <div className="rounded-md bg-[var(--color-brand)] p-3 text-white">
          <p className="text-[10px] uppercase text-white/70">Booking confirmed</p>
          <div className="mt-2 grid grid-cols-[44px_1fr] gap-3">
            <span className="relative size-11 overflow-hidden rounded-full border border-white/20">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="44px"
                src={homeMediaAssets.primaryHero.src}
              />
            </span>
            <span>
              <span className="block text-sm font-bold">Boho braids</span>
              <span className="block text-[11px] text-white/72">
                Today, 2:30 PM
              </span>
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {bookingRows.map(({ label, value, Icon }) => (
            <div
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3"
              key={label}
            >
              <span className="flex items-center gap-2 text-[11px] font-bold">
                <Icon aria-hidden="true" size={15} />
                {label}
              </span>
              <span className="text-[11px] font-bold text-[var(--color-brand)]">
                {value}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-brand)] text-xs font-bold text-white">
          <CheckCircle2 aria-hidden="true" size={15} />
          View booking
        </button>
      </div>
    </div>
  );
}

export function MobileAppSection() {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="page-container overflow-hidden rounded-md border border-[var(--color-border)] bg-[linear-gradient(110deg,#fffaf5_0%,#ffffff_44%,#fff6ea_100%)] shadow-[var(--shadow-media)]">
        <div className="grid gap-8 p-5 md:grid-cols-[1fr_0.8fr_1fr] md:items-center md:p-8 lg:p-10">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1fr] md:items-center">
            <PhoneShell device="iphone" tilt="left">
              <BraiderDiscoveryScreen />
            </PhoneShell>
            <div>
              <p className="text-xs font-bold uppercase text-[var(--color-brand)]">
                iPhone 14 Pro Max
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[var(--color-brand-strong)]">
                Find braiders near you.
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--color-text-muted)]">
                <li>Live availability</li>
                <li>Verified reviews</li>
                <li>Real-time booking</li>
              </ul>
              <div className="mt-5 text-[var(--color-brand-strong)]">
                <AppStoreBadge />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-white shadow-[var(--shadow-subtle)]">
              <span className="relative size-14 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
                <Image
                  alt=""
                  className="object-contain p-1"
                  fill
                  sizes="56px"
                  src={brandAssets.logoMark}
                />
              </span>
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[var(--color-brand-strong)]">
              Beauty at your fingertips.
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
              Book, shop, connect, and track everything from one Touch of Heaven
              account.
            </p>
            <div className="mt-5 flex justify-center">
              <GooglePlayBadge />
            </div>
            <div className="mx-auto mt-5 w-24 rounded-md border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-subtle)]">
              <Image
                alt="QR code to open Touch of Heaven on a mobile device"
                className="h-auto w-full"
                height={630}
                src={brandAssets.appQrCode}
                width={630}
              />
              <p className="mt-1 flex items-center justify-center gap-1 text-[9px] font-bold text-[var(--color-brand)]">
                <QrCode aria-hidden="true" size={10} />
                Scan
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div className="md:order-2">
              <PhoneShell device="samsung" tilt="right">
                <BookingMarketplaceScreen />
              </PhoneShell>
            </div>
            <div className="md:order-1">
              <p className="text-xs font-bold uppercase text-[var(--color-brand)]">
                Samsung Galaxy S24
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[var(--color-brand-strong)]">
                Book and shop with confidence.
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--color-text-muted)]">
                <li>Instant confirmation</li>
                <li>Secure payments</li>
                <li>Order and appointment updates</li>
              </ul>
              <Link className="btn-primary mt-5 w-fit" href="/sign-up">
                Create account
              </Link>
            </div>
          </div>
        </div>
        <p className="sr-only">{siteConfig.domain}</p>
      </div>
    </section>
  );
}
