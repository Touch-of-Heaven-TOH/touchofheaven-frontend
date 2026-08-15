import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, CheckCircle2, MapPin, MessageCircle, Navigation } from "lucide-react";
import { brandAssets } from "@/config/site";

export const metadata: Metadata = {
  title: "Mobile booking confirmation preview",
  robots: {
    index: false,
    follow: false,
  },
};

const confirmationActions = [
  { label: "Message", icon: MessageCircle },
  { label: "Directions", icon: Navigation },
];

const summaryRows = [
  "Selected service",
  "Confirmed time",
  "Appointment location",
  "Deposit status",
];

export default function BookingConfirmPreviewPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-white text-[var(--color-text-primary)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3">
        <div className="relative size-9 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
          <Image
            alt=""
            className="object-contain p-1"
            fill
            sizes="36px"
            src={brandAssets.logoMark}
          />
        </div>
        <p className="text-sm font-bold">Booking Confirmed</p>
        <span className="size-9" aria-hidden="true" />
      </header>

      <section className="grid gap-5 px-4 py-6 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
          <CheckCircle2 aria-hidden="true" size={42} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-[var(--color-brand-strong)]">
            Your appointment is confirmed.
          </h1>
          <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-[var(--color-text-muted)]">
            The live booking flow will populate this screen after payment confirmation.
          </p>
        </div>
      </section>

      <section className="px-4" aria-label="Appointment summary">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-[var(--shadow-subtle)]">
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-md bg-white text-[var(--color-brand)]">
              <CalendarDays aria-hidden="true" size={24} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-brand-strong)]">
                Appointment Details
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Secure booking summary
              </p>
            </div>
          </div>

          <div className="grid gap-3 py-4">
            {summaryRows.map((row) => (
              <div className="flex items-center justify-between gap-4" key={row}>
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {row}
                </span>
                <span className="h-3 w-24 rounded-full bg-[var(--color-skeleton)]" />
              </div>
            ))}
          </div>

          <div className="rounded-md bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-bold text-[var(--color-brand-strong)]">
              <MapPin aria-hidden="true" size={15} />
              Private studio addresses stay protected until confirmation.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 p-4" aria-label="Booking actions">
        {confirmationActions.map(({ icon: Icon, label }) => (
          <button
            className="min-h-12 rounded-md border border-[var(--color-border)] bg-white text-sm font-bold text-[var(--color-brand-strong)] shadow-[var(--shadow-subtle)]"
            key={label}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <Icon aria-hidden="true" size={16} />
              {label}
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
