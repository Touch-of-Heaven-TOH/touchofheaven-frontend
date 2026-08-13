import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Star,
} from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

function PhoneFrame({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <figure className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.15rem] border-[10px] border-[#171219] bg-[#171219] p-2 shadow-[0_24px_80px_rgba(43,23,36,0.28)]">
        <div className="relative overflow-hidden rounded-[1.45rem] bg-[var(--color-page)]">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#171219]" />
          <div className="min-h-[560px] pt-9">{children}</div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm font-bold text-[var(--color-brand-strong)]">
        {label}
      </figcaption>
    </figure>
  );
}

function BookingPhoneScreen() {
  return (
    <div className="grid gap-4 p-4">
      <div className="relative aspect-[5/4] overflow-hidden rounded-md">
        <Image
          alt={homeMediaAssets.primaryHero.alt}
          className="object-cover"
          fill
          sizes="260px"
          src={homeMediaAssets.primaryHero.src}
          style={{ objectPosition: "70% center" }}
        />
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-[var(--color-copper)]">
          Hairstyling
        </p>
        <h3 className="mt-1 text-xl font-bold text-[var(--color-brand-strong)]">
          Knotless braids
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
          Verified stylist, consultation notes, and secure deposit flow.
        </p>
      </div>
      <div className="grid gap-2">
        {["Today", "Tomorrow", "This weekend"].map((slot, index) => (
          <div
            className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-white px-3 py-3"
            key={slot}
          >
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand-strong)]">
              <CalendarDays aria-hidden="true" size={16} />
              {slot}
            </span>
            <span className={index === 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}>
              <ChevronRight aria-hidden="true" size={17} />
            </span>
          </div>
        ))}
      </div>
      <Link className="btn-primary w-full" href="/book">
        Book appointment
      </Link>
    </div>
  );
}

function ShoppingPhoneScreen() {
  return (
    <div className="grid gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--color-copper)]">
            Marketplace
          </p>
          <h3 className="mt-1 text-xl font-bold text-[var(--color-brand-strong)]">
            Aftercare kit
          </h3>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-[var(--color-brand)] text-white">
          <ShoppingBag aria-hidden="true" size={19} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[homeMediaAssets.braidingDetail, homeMediaAssets.bookingMarketplace].map(
          (asset, index) => (
            <article className="rounded-md border border-[var(--color-border)] bg-white p-2" key={asset.src}>
              <div className="relative aspect-square overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
                <Image
                  alt={asset.alt}
                  className="object-cover"
                  fill
                  sizes="120px"
                  src={asset.src}
                  style={{ objectPosition: asset.focalPoint }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-[var(--color-brand-strong)]">
                {index === 0 ? "Hair care" : "Gift bag"}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--color-copper)]">
                <Star aria-hidden="true" size={12} />
                Published catalog
              </p>
            </article>
          ),
        )}
      </div>
      <div className="rounded-md bg-white p-3">
        {["Secure checkout", "Delivery tracking", "One account"].map((item) => (
          <p className="flex items-center gap-2 py-1 text-xs font-semibold text-[var(--color-text-muted)]" key={item}>
            <CheckCircle2 aria-hidden="true" className="text-[var(--color-success)]" size={15} />
            {item}
          </p>
        ))}
      </div>
      <Link className="btn-primary w-full" href="/marketplace">
        Shop marketplace
      </Link>
    </div>
  );
}

export function PlatformPhonePreviewsSection() {
  return (
    <section className="bg-[var(--color-page)] py-10 md:py-14">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
            Mobile previews
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)] md:text-5xl">
            The platform feels native on the phone first.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
            Hairstyling bookings and marketplace shopping stay separate enough
            to scan quickly, but connected through the same account experience.
          </p>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-start">
          <PhoneFrame label="Hairstyling booking UI">
            <BookingPhoneScreen />
          </PhoneFrame>
          <PhoneFrame label="Marketplace shopping UI">
            <ShoppingPhoneScreen />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
