import type { Metadata } from "next";
import Link from "next/link";
import { serviceCategories } from "@/features/home/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Touch of Heaven braiding and protective style service categories.",
};

export default function BeautyPage() {
  return (
    <section className="page-container py-16">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        Service discovery
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-[var(--color-text-primary)]">
        Browse styles before choosing a professional.
      </h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {serviceCategories.map((category) => (
          <article className="surface-panel p-6" key={category.name}>
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {category.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              {category.detail}
            </p>
            <Link className="btn-ghost mt-5" href="/braiders">
              Find braiders for this service
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
