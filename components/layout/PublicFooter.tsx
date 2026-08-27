import Image from "next/image";
import Link from "next/link";
import { Globe, Mail, Music2, Share2 } from "lucide-react";
import { GooglePlayBadge } from "@/components/shared/StoreBadges";
import { brandAssets, siteConfig } from "@/config/site";

const exploreLinks = [
  { label: "Find Braiders", href: "/braiders" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Beauty Services", href: "/beauty" },
  { label: "AI Studio", href: "/ai-studio" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Our Story", href: "/about" },
  { label: "Careers", href: "/contact" },
  { label: "Press", href: "/contact" },
];

const supportLinks = [
  { label: "Help Center", href: "/support" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/how-it-works" },
  { label: "Terms of Service", href: "/legal/terms-of-service" },
];

export function PublicFooter() {
  return (
    <footer className="overflow-hidden bg-[linear-gradient(135deg,#2b0d35_0%,#170719_100%)] text-[var(--color-text-inverse)]">
      <div className="page-container grid gap-9 py-10 md:grid-cols-[1.2fr_0.75fr_0.75fr_0.85fr_1.15fr]">
        <section>
          <div className="relative h-24 w-72 max-w-full">
            <Image
              alt={siteConfig.name}
              className="object-contain object-left"
              fill
              sizes="288px"
              src={brandAssets.logoLockup}
            />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/76">
            Beauty, Culture & Community - All in One Place.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { label: "Instagram", icon: Globe, href: "https://instagram.com" },
              { label: "TikTok", icon: Music2, href: "https://tiktok.com" },
              { label: "Facebook", icon: Share2, href: "https://facebook.com" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  aria-label={item.label}
                  className="grid size-10 place-items-center rounded-full border border-white/18 text-white transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                  href={item.href}
                  key={item.label}
                >
                  <Icon aria-hidden="true" size={18} />
                </Link>
              );
            })}
          </div>
        </section>

        <nav className="grid content-start gap-2 text-sm" aria-label="Explore">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white">
            Explore
          </p>
          {exploreLinks.map((item) => (
            <Link className="text-white/72 transition hover:text-white" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="grid content-start gap-2 text-sm" aria-label="Company">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white">
            Company
          </p>
          {companyLinks.map((item) => (
            <Link className="text-white/72 transition hover:text-white" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="grid content-start gap-2 text-sm" aria-label="Support">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white">
            Support
          </p>
          {supportLinks.map((item) => (
            <Link className="text-white/72 transition hover:text-white" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="content-start">
          <p className="text-xs font-bold uppercase tracking-wide text-white">
            Stay in the know
          </p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Get beauty tips, exclusive offers, and community updates.
          </p>
          <form className="mt-4 flex overflow-hidden rounded-md bg-white" action="/customer/sign-up">
            <label className="sr-only" htmlFor="footer-email">
              Email address
            </label>
            <input
              className="min-h-12 min-w-0 flex-1 px-4 text-sm font-semibold text-[var(--color-brand-strong)] outline-none placeholder:text-[var(--color-text-muted)]"
              id="footer-email"
              name="email"
              placeholder="Enter your email"
              type="email"
            />
            <button className="bg-[var(--color-brand)] px-4 text-sm font-bold text-white" type="submit">
              Subscribe
            </button>
          </form>
          <div className="mt-5 flex flex-col gap-3">
            <GooglePlayBadge />
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-gold-light)]"
              href="/customer/sign-up"
            >
              <Mail aria-hidden="true" size={16} />
              Create your account
            </Link>
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="page-container flex flex-col gap-3 text-xs text-white/58 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy-policy">Privacy Policy</Link>
            <Link href="/legal/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
