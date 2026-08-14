import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

const demoServices = [
  {
    name: "Knotless Braids",
    detail: "Waist length, clean parts, consultation included",
    duration: "4h 30m",
    price: "$220",
    href: "/book?braider=royalty-hair-co&service=knotless-braids",
  },
  {
    name: "Boho Knotless",
    detail: "Human-hair curls, lightweight finish",
    duration: "5h",
    price: "$260",
    href: "/book?braider=royalty-hair-co&service=boho-knotless",
  },
  {
    name: "Cornrows",
    detail: "Protective stitch parting with natural-hair prep",
    duration: "2h 15m",
    price: "$120",
    href: "/book?braider=royalty-hair-co&service=cornrows",
  },
] as const;

const demoStats = [
  { label: "Rating", value: "4.9", helper: "128 reviews" },
  { label: "Completed", value: "612", helper: "appointments" },
  { label: "Next opening", value: "Today", helper: "3:30 PM" },
] as const;

const demoAmenities = [
  "Verified profile",
  "Deposit protected",
  "Message before visit",
  "Aftercare shop",
] as const;

const gallery = [
  homeMediaAssets.primaryHero,
  homeMediaAssets.stylePortrait,
  homeMediaAssets.braidingDetail,
] as const;

export function DemoBraiderProfileSection() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <article className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-soft)]">
            <div className="relative min-h-[260px] overflow-hidden">
              <Image
                alt={homeMediaAssets.primaryHero.alt}
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                src={homeMediaAssets.primaryHero.src}
                style={{ objectPosition: "74% center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-strong)]/88 via-[var(--color-brand-strong)]/14 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-xs font-bold uppercase backdrop-blur">
                  <ShieldCheck aria-hidden="true" size={14} />
                  Demo public braider profile
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold">
                  Royalty Hair Co.
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/82">
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden="true" size={15} />
                    Kathleen, Georgia
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star
                      aria-hidden="true"
                      className="fill-[var(--color-gold-light)] text-[var(--color-gold-light)]"
                      size={15}
                    />
                    4.9 from 128 reviews
                  </span>
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              {demoStats.map((stat) => (
                <div
                  className="rounded-md border border-[var(--color-border)] bg-white p-4"
                  key={stat.label}
                >
                  <p className="text-xs font-bold uppercase text-[var(--color-copper)]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-brand-strong)]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {stat.helper}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-4">
            <div className="rounded-md border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-subtle)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
                    Services menu
                  </p>
                  <h3 className="mt-1 font-serif text-3xl font-semibold text-[var(--color-brand-strong)]">
                    Book like a real profile page.
                  </h3>
                </div>
                <Link className="btn-secondary w-fit" href="/braiders">
                  View all profiles
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {demoServices.map((service) => (
                  <article
                    className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    key={service.name}
                  >
                    <div>
                      <h4 className="text-lg font-bold text-[var(--color-brand-strong)]">
                        {service.name}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                        {service.detail}
                      </p>
                      <p className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[var(--color-text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 aria-hidden="true" size={14} />
                          {service.duration}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays aria-hidden="true" size={14} />
                          Deposit supported
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <p className="text-xl font-bold text-[var(--color-brand-strong)]">
                        {service.price}
                      </p>
                      <Link className="btn-primary" href={service.href}>
                        Book
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-5">
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
                  <CheckCircle2 aria-hidden="true" size={16} />
                  Profile comforts
                </p>
                <div className="mt-4 grid gap-2">
                  {demoAmenities.map((amenity) => (
                    <p
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]"
                      key={amenity}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="text-[var(--color-success)]"
                        size={16}
                      />
                      {amenity}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[var(--color-border)] bg-white p-4">
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
                  <ImageIcon aria-hidden="true" size={16} />
                  Portfolio proof
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {gallery.map((asset) => (
                    <div
                      className="relative aspect-square overflow-hidden rounded-md bg-[var(--color-brand-soft)]"
                      key={asset.src}
                    >
                      <Image
                        alt={asset.alt}
                        className="object-cover"
                        fill
                        sizes="150px"
                        src={asset.src}
                        style={{ objectPosition: asset.focalPoint }}
                      />
                    </div>
                  ))}
                </div>
                <Link
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
                  href="/contact"
                >
                  <MessageCircle aria-hidden="true" size={16} />
                  Message before booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
