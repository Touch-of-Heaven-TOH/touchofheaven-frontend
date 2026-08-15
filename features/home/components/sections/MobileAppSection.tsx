import Image from "next/image";
import Link from "next/link";
import { Play, QrCode, Smartphone } from "lucide-react";
import { brandAssets, siteConfig } from "@/config/site";

function GooglePlayBadge() {
  return (
    <span
      aria-label="Get it on Google Play"
      className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#161217] px-4 py-2 text-white"
      role="img"
    >
      <Play
        aria-hidden="true"
        className="fill-[var(--color-gold)] text-[var(--color-gold)]"
        size={22}
      />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase text-white/70">Get it on</span>
        <span className="block text-base font-bold">Google Play</span>
      </span>
    </span>
  );
}

export function MobileAppSection() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-brand-strong)] text-white shadow-[var(--shadow-media)]">
        <div className="grid gap-8 p-5 md:grid-cols-[1fr_280px] md:items-center md:p-8 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-gold-light)]">
              <Smartphone aria-hidden="true" size={17} />
              Mobile app
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight md:text-5xl">
              Take Touch of Heaven with you.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/76 md:text-base">
              Scan the real Touch of Heaven QR code to open the platform on
              your phone. The app experience keeps bookings, messages,
              shopping, and appointment reminders close.
            </p>

            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <GooglePlayBadge />
              <Link className="btn-secondary" href="/how-it-works">
                App details
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-white/14 bg-white p-4 text-[var(--color-brand-strong)] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
              <span className="relative size-10 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
                <Image
                  alt=""
                  className="object-contain p-1"
                  fill
                  sizes="40px"
                  src={brandAssets.logoMark}
                />
              </span>
              <div>
                <h3 className="text-sm font-bold">Scan to open</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {siteConfig.domain}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-4 w-full max-w-[188px]">
              <Image
                alt="QR code to open Touch of Heaven on a mobile device"
                className="h-auto w-full rounded-md border border-[var(--color-border)]"
                height={630}
                src={brandAssets.appQrCode}
                width={630}
              />
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold">
              <QrCode aria-hidden="true" size={14} />
              Branded QR with Touch of Heaven logo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
