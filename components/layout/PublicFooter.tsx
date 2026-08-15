import Link from "next/link";
import Image from "next/image";
import { Globe, Music2, Share2 } from "lucide-react";
import { legalPolicies } from "@/config/legal";
import { brandAssets, siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]">
      <div className="page-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr_0.8fr]">
        <section>
          <div className="relative h-16 w-56 max-w-full">
            <Image
              alt={siteConfig.name}
              className="object-contain object-left"
              fill
              sizes="224px"
              src={brandAssets.logoLockup}
            />
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
            Beauty, Culture & Community - All in One Place.
          </p>
        </section>
        <nav className="grid gap-2 text-sm" aria-label="Footer">
          <Link href="/beauty">Beauty</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/braiders">Braiders</Link>
          <Link href="/ai-studio">AI Studio</Link>
          <Link href="/about">About</Link>
        </nav>
        <nav className="grid gap-2 text-sm" aria-label="Legal">
          {legalPolicies.slice(0, 5).map((policy) => (
            <Link key={policy.slug} href={`/legal/${policy.slug}`}>
              {policy.title}
            </Link>
          ))}
        </nav>
        <section>
          <p className="text-sm font-bold uppercase text-white">Follow us</p>
          <div className="mt-4 flex gap-3">
            {[
              { label: "Instagram", icon: Globe, href: "https://instagram.com" },
              { label: "TikTok", icon: Music2, href: "https://tiktok.com" },
              { label: "Facebook", icon: Share2, href: "https://facebook.com" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  aria-label={item.label}
                  className="grid size-10 place-items-center rounded-full border border-white/20 text-white transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                  href={item.href}
                  key={item.label}
                >
                  <Icon aria-hidden="true" size={18} />
                </Link>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-white/60">
            &copy; 2026 {siteConfig.name}. All rights reserved.
          </p>
        </section>
      </div>
    </footer>
  );
}
