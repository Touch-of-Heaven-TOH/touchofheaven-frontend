import type { Metadata } from "next";
import Link from "next/link";
import { featuredBraiders } from "@/features/home/content";

export const metadata: Metadata = {
  title: "Find braiders",
  description:
    "Browse verified Touch of Heaven braiders and open the discovery map.",
};

export default function BraidersPage() {
  return (
    <section className="page-container py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
            Braider discovery
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[var(--color-text-primary)]">
            Search verified professionals without exposing private data.
          </h1>
        </div>
        <Link className="btn-primary" href="/map">
          Open map
        </Link>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {featuredBraiders.map((braider) => (
          <article className="surface-panel p-5" key={braider.name}>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {braider.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {braider.specialty}
            </p>
            <p className="mt-5 text-sm text-[var(--color-text-muted)]">
              Public area: {braider.area}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-success)]">
              Verified rating {braider.rating}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
