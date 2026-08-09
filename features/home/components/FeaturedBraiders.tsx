import Link from "next/link";
import { featuredBraiders } from "@/features/home/content";

export function FeaturedBraiders() {
  return (
    <section className="bg-[var(--color-surface)] py-16">
      <div className="page-container">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
              Discovery
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">
              Verified professionals, clear availability.
            </h2>
          </div>
          <Link className="btn-secondary" href="/braiders">
            Explore braiders
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featuredBraiders.map((braider) => (
            <article className="surface-panel p-5" key={braider.name}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {braider.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {braider.specialty}
                  </p>
                </div>
                <span className="rounded-md bg-[var(--color-success-soft)] px-2 py-1 text-sm font-semibold text-[var(--color-success)]">
                  {braider.rating}
                </span>
              </div>
              <p className="mt-5 text-sm text-[var(--color-text-muted)]">
                {braider.area}
              </p>
              <Link className="btn-ghost mt-4" href="/braiders">
                View profile
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
