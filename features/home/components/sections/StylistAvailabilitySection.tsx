import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3 } from "lucide-react";

const days = [
  { label: "Mon", state: "open" },
  { label: "Tue", state: "open" },
  { label: "Wed", state: "busy" },
  { label: "Thu", state: "open" },
  { label: "Fri", state: "open" },
  { label: "Sat", state: "busy" },
  { label: "Sun", state: "closed" },
] as const;

const times = ["9:30 AM", "11:00 AM", "1:30 PM", "3:00 PM"] as const;

export function StylistAvailabilitySection() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
            <CalendarClock aria-hidden="true" size={17} />
            Stylist availability
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-5xl">
            A clearer way to see when a stylist can take you.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
            The booking flow will show live backend availability, holds,
            consultation needs, and deposit status. This homepage preview shows
            the calendar direction without claiming live slots.
          </p>
          <Link className="btn-primary mt-6" href="/book">
            Check booking flow
          </Link>
        </div>

        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-page)] p-4 shadow-[var(--shadow-soft)] md:p-6">
          <div className="rounded-md bg-white p-4">
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--color-brand-strong)]">
                  Availability preview
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Calendar illustration only
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-bold text-[var(--color-success)]">
                <CheckCircle2 aria-hidden="true" size={15} />
                Backend-ready pattern
              </span>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div
                  className={`rounded-md border p-3 text-center ${
                    day.state === "open"
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : day.state === "busy"
                        ? "border-[var(--color-copper-soft)] bg-[var(--color-copper-soft)] text-[var(--color-copper)]"
                        : "border-[var(--color-border)] bg-[var(--color-page)] text-[var(--color-text-muted)]"
                  }`}
                  key={day.label}
                >
                  <p className="text-xs font-bold">{day.label}</p>
                  <p className="mt-1 text-[10px] uppercase">{day.state}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {times.map((time) => (
                <div
                  className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-3"
                  key={time}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand-strong)]">
                    <Clock3 aria-hidden="true" size={16} />
                    {time}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-success)]">
                    Preview
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
