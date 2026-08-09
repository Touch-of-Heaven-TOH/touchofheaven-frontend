import Link from "next/link";
import { Search, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import {
  heroSearchSuggestions,
  homePrimaryActions,
} from "@/features/home/config/home-content";

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-xl py-14 md:py-20 lg:py-24">
      <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
        <Sparkles aria-hidden="true" size={16} />
        Beauty, booking, and marketplace
      </p>
      <h1 className="mt-5 font-serif text-5xl font-semibold leading-[0.95] text-[var(--color-brand-strong)] md:text-7xl lg:text-8xl">
        Your Beauty.
        <span className="block">Your Culture.</span>
        <span className="block text-[var(--color-copper)]">
          All in One Place.
        </span>
      </h1>
      <p className="mt-5 max-w-md text-base leading-7 text-[var(--color-text-primary)] md:text-lg">
        Imagine your next look, book with trusted braiders, and explore
        authentic African products from one secure Touch of Heaven account.
      </p>

      <form
        action="/beauty"
        className="mt-7 flex max-w-lg gap-2 rounded-md border border-[var(--color-border)] bg-white/90 p-2 shadow-[var(--shadow-subtle)] backdrop-blur"
        role="search"
      >
        <label className="sr-only" htmlFor="hero-search">
          Search hairstyles, products, and braiders
        </label>
        <Search
          aria-hidden="true"
          className="ml-2 mt-3 shrink-0 text-[var(--color-brand)]"
          size={20}
        />
        <input
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
          id="hero-search"
          name="q"
          placeholder="Search hairstyles, products, braiders..."
          type="search"
        />
        <button className="btn-primary hidden shrink-0 sm:inline-flex" type="submit">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {heroSearchSuggestions.slice(0, 4).map((suggestion) => (
          <Link
            className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs font-bold text-[var(--color-brand)] hover:border-[var(--color-brand)]"
            href={`/beauty?q=${encodeURIComponent(suggestion)}`}
            key={suggestion}
          >
            {suggestion}
          </Link>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link className="btn-primary" href={homePrimaryActions.book.href}>
          <ShieldCheck aria-hidden="true" size={18} />
          {homePrimaryActions.book.label}
        </Link>
        <Link
          className="btn-secondary bg-white/90"
          href={homePrimaryActions.marketplace.href}
        >
          <ShoppingBag aria-hidden="true" size={18} />
          {homePrimaryActions.marketplace.label}
        </Link>
      </div>
    </div>
  );
}
