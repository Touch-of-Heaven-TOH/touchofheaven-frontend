import Link from "next/link";

export function FinalCallToAction() {
  return (
    <section className="page-container py-16">
      <div className="grid gap-6 rounded-md bg-[var(--color-surface-ink)] p-8 text-white md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold text-[var(--color-gold-light)]">
            Ready when the backend is running
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            Start with discovery, then move through booking.
          </h2>
        </div>
        <Link className="btn-primary bg-[var(--color-gold)] text-[#2b1724] hover:bg-[var(--color-gold-light)]" href="/book">
          Begin booking
        </Link>
      </div>
    </section>
  );
}
