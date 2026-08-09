import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "The Touch of Heaven platform vision for secure booking, trusted professionals, and African beauty culture.",
};

export default function AboutPage() {
  return (
    <section className="page-container grid gap-8 py-16 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
          Our story
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--color-text-primary)]">
          A booking platform worthy of the craft.
        </h1>
      </div>
      <div className="grid gap-5 text-base leading-8 text-[var(--color-text-muted)]">
        <p>
          Touch of Heaven centers customers and braiders in one secure system:
          discovery, consultation, appointment management, deposits, reviews,
          and operational oversight all have clear ownership.
        </p>
        <p>
          The frontend is organized around the routes people actually use, with
          private data kept behind server checks and backend authorization. The
          goal is a platform that feels warm to customers and precise for the
          professionals running it.
        </p>
      </div>
    </section>
  );
}
