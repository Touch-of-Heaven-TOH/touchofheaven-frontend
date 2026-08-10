import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  MapPin,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { legalPolicies } from "@/config/legal";
import { brandAssets, siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]">
      <div className="border-b border-white/10 bg-[var(--color-page)] text-[var(--color-text-primary)]">
        <div className="page-container grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-[var(--color-copper-soft)] text-[var(--color-copper)]">
              <Mail aria-hidden="true" size={20} />
            </span>
            <div>
              <p className="font-serif text-xl font-semibold">
                Join our community
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Beauty tips, launch notes, and early marketplace updates.
              </p>
            </div>
          </div>
          <form action="/contact" className="flex gap-2" role="search">
            <label className="sr-only" htmlFor="footer-email">
              Email address for community updates
            </label>
            <input
              className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none"
              id="footer-email"
              name="email"
              placeholder="Enter your email address"
              type="email"
            />
            <button className="btn-primary shrink-0" type="submit">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="page-container grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1.1fr]">
        <section className="max-w-sm">
          <div className="flex items-center gap-3 font-semibold">
            <Image
              alt=""
              className="size-12 shrink-0 rounded-full border border-[var(--color-gold)] bg-[#f6efe4] object-cover"
              height={48}
              src={brandAssets.logoMark}
              width={48}
            />
            <div>
              <p className="font-serif text-xl">{siteConfig.name}</p>
              <p className="text-[10px] font-bold uppercase text-white/60">
                Beauty & Marketplace
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/72">
            Empowering beauty, celebrating culture, and helping clients discover
            professionals with secure booking from one trusted account.
          </p>
          <div className="mt-5 grid gap-2 text-sm text-white/72">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" size={16} />
              Kathleen, Georgia
            </span>
            <Link className="inline-flex items-center gap-2" href="/contact">
              <Mail aria-hidden="true" size={16} />
              {siteConfig.supportEmail}
            </Link>
          </div>
        </section>

        <nav className="grid content-start gap-2 text-sm" aria-label="Marketplace">
          <p className="mb-2 font-bold text-white">Marketplace</p>
          <Link href="/marketplace">All products</Link>
          <Link href="/marketplace?category=hair-beauty">Hair & Beauty</Link>
          <Link href="/marketplace?category=fashion">African Fashion</Link>
          <Link href="/marketplace?category=spices-foods">Spices & Foods</Link>
        </nav>

        <nav className="grid content-start gap-2 text-sm" aria-label="Beauty">
          <p className="mb-2 font-bold text-white">Beauty</p>
          <Link href="/book">Book a Hairstyle</Link>
          <Link href="/braiders">Find Braiders</Link>
          <Link href="/ai-studio">AI Style Preview</Link>
          <Link href="/style-quiz">Style Quiz</Link>
        </nav>

        <nav className="grid content-start gap-2 text-sm" aria-label="Company">
          <p className="mb-2 font-bold text-white">Company</p>
          <Link href="/about">Our Story</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/contact">Contact Us</Link>
          {legalPolicies.slice(0, 3).map((policy) => (
            <Link key={policy.slug} href={`/legal/${policy.slug}`}>
              {policy.title}
            </Link>
          ))}
        </nav>

        <section className="grid gap-4 rounded-md border border-white/10 bg-white/5 p-4">
          <div className="flex gap-4">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md bg-[#f6efe4]">
              <Image
                alt="Touch of Heaven Beauty and Marketplace logo"
                className="object-contain p-2"
                fill
                sizes="96px"
                src={brandAssets.logoLockup}
              />
            </div>
            <div>
              <p className="font-serif text-xl">Take Touch of Heaven with you</p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Mobile-first booking, profile discovery, and marketplace updates.
              </p>
            </div>
          </div>
          <Link className="btn-secondary w-fit" href="/how-it-works">
            <Smartphone aria-hidden="true" size={18} />
            App details
          </Link>
        </section>
      </div>

      <div className="border-t border-white/10">
        <div className="page-container flex flex-col gap-3 py-4 text-xs text-white/62 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Touch of Heaven Beauty & Marketplace. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck aria-hidden="true" size={14} />
              Secure payments
            </span>
            <span>Encrypted data</span>
            <Link className="inline-flex items-center gap-1" href="/contact">
              <Mail aria-hidden="true" size={14} />
              Follow us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
