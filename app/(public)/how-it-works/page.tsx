import type { Metadata } from "next";
import Link from "next/link";

const steps = [
  {
    title: "Discover",
    detail:
      "Search braiders by location, service category, availability, and public portfolio details.",
  },
  {
    title: "Prepare",
    detail:
      "Review service requirements, upload consultation details only where required, and accept the current policy version.",
  },
  {
    title: "Book",
    detail:
      "Hold a slot, create the appointment, complete deposit payment, and receive confirmation from the backend.",
  },
  {
    title: "Manage",
    detail:
      "Customers, braiders, and administrators each use their own protected workspace for follow-up actions.",
  },
] as const;

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How customers discover braiders, prepare consultations, book securely, and manage appointments.",
};

export default function HowItWorksPage() {
  return (
    <section className="page-container py-16">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        How it works
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[var(--color-text-primary)]">
        One journey from search to verified review.
      </h1>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <article className="surface-panel p-5" key={step.title}>
            <span className="text-sm font-bold text-[var(--color-accent)]">
              Step {index + 1}
            </span>
            <h2 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
              {step.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              {step.detail}
            </p>
          </article>
        ))}
      </div>
      <Link className="btn-primary mt-8" href="/book">
        Start booking
      </Link>
    </section>
  );
}
