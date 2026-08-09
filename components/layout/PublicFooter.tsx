import Link from "next/link";
import { legalPolicies } from "@/config/legal";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]">
      <div className="page-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <section>
          <div className="flex items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[var(--color-gold)] text-sm text-[var(--color-surface-ink)]">
              TOH
            </span>
            {siteConfig.name}
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
            Secure discovery and booking for African hair braiding, built for
            customers, professionals, and administrators.
          </p>
        </section>
        <nav className="grid gap-2 text-sm" aria-label="Footer">
          <Link href="/braiders">Find braiders</Link>
          <Link href="/beauty">Browse services</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav className="grid gap-2 text-sm" aria-label="Legal">
          {legalPolicies.slice(0, 5).map((policy) => (
            <Link key={policy.slug} href={`/legal/${policy.slug}`}>
              {policy.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
