import Image from "next/image";
import Link from "next/link";
import { Play, QrCode, Smartphone, Star } from "lucide-react";
import { homeMediaAssets } from "@/features/home/config/hero-media";

function QrPlaceholder() {
  const cells = Array.from({ length: 49 }, (_, index) => index);

  return (
    <div className="grid size-28 grid-cols-7 gap-1 rounded-md border border-[var(--color-border)] bg-white p-2">
      {cells.map((cell) => (
        <span
          className={`rounded-[2px] ${
            cell % 3 === 0 || cell % 11 === 0 || [1, 5, 35, 41, 43].includes(cell)
              ? "bg-[var(--color-brand)]"
              : "bg-[var(--color-brand-soft)]"
          }`}
          key={cell}
        />
      ))}
    </div>
  );
}

function GooglePlayBadge() {
  return (
    <span className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#161217] px-4 py-2 text-white">
      <Play aria-hidden="true" className="fill-[var(--color-gold)] text-[var(--color-gold)]" size={22} />
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
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_320px] md:items-center md:p-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-gold-light)]">
              <Smartphone aria-hidden="true" size={17} />
              Mobile app
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight md:text-5xl">
              Take Touch of Heaven with you.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
              The app experience will keep bookings, messages, shopping, and
              appointment reminders close without crowding the desktop homepage.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <GooglePlayBadge />
              <div className="rounded-md bg-white p-3 text-[var(--color-brand-strong)]">
                <QrPlaceholder />
                <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold">
                  <QrCode aria-hidden="true" size={14} />
                  QR placeholder
                </p>
              </div>
            </div>

            <Link className="btn-secondary mt-6 w-fit" href="/how-it-works">
              App details
            </Link>
          </div>

          <div className="relative mx-auto h-[420px] w-[235px]">
            <div className="absolute inset-0 rotate-[-4deg] rounded-[2rem] border-[9px] border-[#141016] bg-[#141016] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="relative h-full overflow-hidden rounded-[1.35rem] bg-[var(--color-page)] text-[var(--color-brand-strong)]">
                <div className="relative h-40">
                  <Image
                    alt={homeMediaAssets.bookingMarketplace.alt}
                    className="object-cover"
                    fill
                    sizes="235px"
                    src={homeMediaAssets.bookingMarketplace.src}
                    style={{ objectPosition: "60% center" }}
                  />
                </div>
                <div className="grid gap-3 p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-copper)]">
                    Upcoming
                  </p>
                  <h3 className="text-lg font-bold">Braids appointment</h3>
                  <p className="text-xs leading-5 text-[var(--color-text-muted)]">
                    Booking, aftercare, and marketplace reminders in one place.
                  </p>
                  <div className="rounded-md bg-white p-3">
                    <p className="flex items-center gap-2 text-xs font-bold text-[var(--color-copper)]">
                      <Star aria-hidden="true" size={14} />
                      Personalized recommendations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
