import { Search, Sparkles } from "lucide-react";
import { AnimatedHeroHeadline } from "@/features/home/components/hero/AnimatedHeroHeadline";

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-xl py-9 md:py-12 lg:py-14">
      <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
        <Sparkles aria-hidden="true" size={16} />
        Beauty, booking, and marketplace
      </p>
      <AnimatedHeroHeadline />

      <form
        action="/beauty"
        className="mt-6 grid max-w-lg grid-cols-[auto_1fr] gap-2 rounded-md border border-[var(--color-border)] bg-white/94 p-2 shadow-[var(--shadow-soft)] backdrop-blur sm:flex"
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
        <button className="btn-primary col-span-2 w-full shrink-0 sm:col-span-1 sm:w-auto" type="submit">
          Search
        </button>
      </form>
    </div>
  );
}
