import type { Metadata } from "next";
import Link from "next/link";
import { legalPolicies } from "@/config/legal";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Public Touch of Heaven policy pages, effective dates, and customer-visible summaries.",
};

export default function LegalPage() {
  return (
    <section className="page-container py-16">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        Legal
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[var(--color-text-primary)]">
        Public policy library.
      </h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {legalPolicies.map((policy) => (
          <article className="surface-panel p-5" key={policy.slug}>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {policy.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Effective {policy.effectiveDate}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              {policy.summary}
            </p>
            <Link className="btn-ghost mt-4" href={`/legal/${policy.slug}`}>
              {policy.primaryAction}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
