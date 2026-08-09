import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/config/site";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]">
      <div className="absolute inset-0">
        <Image
          src={brandAssets.heroImage}
          alt="A professional braider styling long braids for a client in a bright salon"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-[rgba(43,23,36,0.7)]" />
      </div>

      <div className="page-container relative grid min-h-[calc(100dvh-64px)] content-center gap-10 py-16 md:min-h-[680px] md:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-[var(--color-gold-light)]">
            Verified African hair braiding
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] text-white md:text-7xl">
            Touch of Heaven
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/82">
            Find trusted braiders, compare services, choose a real available
            slot, and book with secure appointment and payment protection.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary bg-[var(--color-gold)] text-[#2b1724] hover:bg-[var(--color-gold-light)]" href="/braiders">
              Find a braider
            </Link>
            <Link className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-[var(--color-brand)]" href="/beauty">
              Browse services
            </Link>
          </div>
        </div>

        <div className="hidden self-end justify-self-end rounded-md border border-white/20 bg-white/12 p-5 backdrop-blur md:block">
          <p className="text-sm font-semibold text-[var(--color-gold-light)]">
            Booking-first MVP
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/78">
            Discovery, authentication, consultation, deposits, appointment
            management, professional studio, and admin operations are mapped to
            explicit protected routes.
          </p>
        </div>
      </div>
    </section>
  );
}
