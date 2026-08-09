import { trustPoints } from "@/features/home/content";

export function TrustAndSafety() {
  return (
    <section className="bg-[var(--color-brand-soft)] py-16">
      <div className="page-container grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
            Trust and safety
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">
            The structure supports security instead of decoration.
          </h2>
        </div>
        <div className="grid gap-3">
          {trustPoints.map((point) => (
            <div
              className="rounded-md border border-[var(--color-border)] bg-white p-4 text-sm leading-6 text-[var(--color-text-muted)]"
              key={point}
            >
              {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
