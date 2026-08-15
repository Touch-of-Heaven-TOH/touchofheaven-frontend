import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

const serviceSignals = [
  "Verified braider profile",
  "Consultation notes",
  "Secure deposit handoff",
] as const;

const productSignals = [
  "Published product cards",
  "Aftercare essentials",
  "Order tracking path",
] as const;

export function BookingProductsInfoSection() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <div className="grid overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-soft)] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="grid gap-5 p-5 md:p-8 lg:p-10">
            <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
              Booking + Products
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-5xl">
              One experience for the appointment and the aftercare.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
              Customers can move from style discovery to a braiding appointment,
              then shop authentic care essentials without learning a second
              app.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-md border border-[var(--color-border)] bg-white p-4">
                <span className="grid size-11 place-items-center rounded-md bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <CalendarCheck aria-hidden="true" size={22} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-brand-strong)]">
                  Hairstyling services
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  Find a style direction, choose a professional, and continue
                  into the secure booking flow.
                </p>
                <ul className="mt-3 grid gap-2">
                  {serviceSignals.map((signal) => (
                    <li
                      className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]"
                      key={signal}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="text-[var(--color-success)]"
                        size={15}
                      />
                      {signal}
                    </li>
                  ))}
                </ul>
                <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]" href="/book">
                  Start booking
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </article>

              <article className="rounded-md border border-[var(--color-border)] bg-white p-4">
                <span className="grid size-11 place-items-center rounded-md bg-[var(--color-copper-soft)] text-[var(--color-copper)]">
                  <ShoppingBag aria-hidden="true" size={22} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-brand-strong)]">
                  Marketplace products
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  Browse curated hair care, fashion, pantry, and aftercare
                  products with clear shopping actions.
                </p>
                <ul className="mt-3 grid gap-2">
                  {productSignals.map((signal) => (
                    <li
                      className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]"
                      key={signal}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="text-[var(--color-success)]"
                        size={15}
                      />
                      {signal}
                    </li>
                  ))}
                </ul>
                <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]" href="/marketplace">
                  Shop products
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </article>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden bg-[var(--color-brand-soft)] md:min-h-[460px]">
            <Image
              alt={homeMediaAssets.bookingMarketplace.alt}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 56vw"
              src={homeMediaAssets.bookingMarketplace.src}
              style={{ objectPosition: homeMediaAssets.bookingMarketplace.focalPoint }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
