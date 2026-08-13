import { Search, Sparkles } from "lucide-react";
import { AnimatedHeroHeadline } from "@/features/home/components/hero/AnimatedHeroHeadline";

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-xl py-10 md:py-14 lg:py-16">
      <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
        <Sparkles aria-hidden="true" size={16} />
        Beauty, booking, and marketplace
      </p>
      <AnimatedHeroHeadline />

      <form
        action="/beauty"
        className="mt-7 flex max-w-lg gap-2 rounded-md border border-[var(--color-border)] bg-white/92 p-2 shadow-[var(--shadow-soft)] backdrop-blur"
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
    </div>
  );
}
