import Link from "next/link";
import { serviceCategories } from "@/features/home/content";

export function ServiceCategories() {
  return (
    <section className="page-container py-18">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
            Services
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">
            Choose the style before the slot.
          </h2>
        </div>
        <Link className="btn-secondary" href="/beauty">
          View all services
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {serviceCategories.map((category) => (
          <article className="surface-panel p-5" key={category.name}>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {category.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              {category.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
