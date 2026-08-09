const steps = [
  "Search by location, style, availability, and appointment type.",
  "Review service rules, portfolio consent, price, deposit, and policies.",
  "Book with secure session cookies, CSRF-protected requests, and payment flow.",
] as const;

export function HowItWorks() {
  return (
    <section className="page-container py-16">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        Booking flow
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">
        Built around the real appointment journey.
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article className="surface-panel p-5" key={step}>
            <span className="grid size-9 place-items-center rounded-md bg-[var(--color-accent-soft)] text-sm font-bold text-[var(--color-accent)]">
              {index + 1}
            </span>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              {step}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
