"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Heart,
  HelpCircle,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  UserCircle,
} from "lucide-react";
import {
  roleAwareNavigation,
} from "@/config/navigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import type { SafeUser } from "@/types/auth";

export type PublicHeaderProps = {
  user: SafeUser | null;
};

export function PublicHeader({ user }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const accountLinks = user ? roleAwareNavigation(user.roles) : [];
  const userLabel = user ? `Hello, ${user.firstName}` : null;

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/96 backdrop-blur">
      <div className="bg-[var(--color-brand-strong)] text-[var(--color-text-inverse)]">
        <div className="page-container flex min-h-8 items-center justify-center gap-6 text-[11px] font-semibold md:justify-between">
          <p className="inline-flex items-center gap-2">
            <Sparkles aria-hidden="true" size={14} />
            New here? Get 10% off your first hairstyle booking.
          </p>
          <div className="hidden items-center gap-6 md:flex">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" size={13} />
              Kathleen, Georgia
            </span>
            <Link className="inline-flex items-center gap-2" href="/contact">
              <HelpCircle aria-hidden="true" size={13} />
              Help Center
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container flex min-h-[68px] items-center justify-between gap-3">
        <button
          className="grid size-10 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-brand)] md:hidden"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>

        <Link
          className="flex min-w-0 items-center gap-3 font-semibold text-[var(--color-text-primary)]"
          href="/"
          aria-label="Touch of Heaven home"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-gold)] bg-[var(--color-page)] text-lg font-bold text-[var(--color-copper)]">
            T
          </span>
          <span className="hidden leading-tight sm:inline">
            <span className="block font-serif text-lg text-[var(--color-brand-strong)]">
              Touch of Heaven
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Beauty & Marketplace
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <Link className="btn-ghost text-xs" href="/">
            Home
          </Link>
          <Link className="btn-ghost text-xs" href="/beauty">
            Beauty <ChevronDown aria-hidden="true" size={14} />
          </Link>
          <Link className="btn-ghost text-xs" href="/marketplace">
            Marketplace <ChevronDown aria-hidden="true" size={14} />
          </Link>
          <Link className="btn-ghost text-xs" href="/braiders">
            Braiders
          </Link>
          <Link className="btn-ghost text-xs" href="/ai-studio">
            AI Studio
            <span className="rounded-full bg-[var(--color-copper-soft)] px-2 py-0.5 text-[9px] uppercase text-[var(--color-copper)]">
              New
            </span>
          </Link>
          <Link className="btn-ghost text-xs" href="/about">
            Our Story
          </Link>
        </nav>

        <form
          action="/beauty"
          className="hidden min-w-[220px] flex-1 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-page)] px-3 xl:flex"
          role="search"
        >
          <label className="sr-only" htmlFor="public-search">
            Search hairstyles, products, and braiders
          </label>
          <input
            className="min-h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
            id="public-search"
            name="q"
            placeholder="Search hairstyles, products, braiders..."
            type="search"
          />
          <button
            aria-label="Search"
            className="grid size-9 place-items-center text-[var(--color-brand)]"
            type="submit"
          >
            <Search aria-hidden="true" size={18} />
          </button>
        </form>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            aria-label="Search hairstyles and products"
            className="grid size-10 place-items-center rounded-md text-[var(--color-brand)] xl:hidden"
            href="/beauty"
          >
            <Search aria-hidden="true" size={21} />
          </Link>
          <Link
            aria-label="Favorites"
            className="hidden size-10 place-items-center rounded-md text-[var(--color-brand)] md:grid"
            href="/account/favorites"
          >
            <Heart aria-hidden="true" size={20} />
          </Link>
          <Link
            aria-label="Appointments"
            className="hidden size-10 place-items-center rounded-md text-[var(--color-brand)] md:grid"
            href="/bookings"
          >
            <CalendarDays aria-hidden="true" size={20} />
          </Link>
          <Link
            aria-label="Cart"
            className="relative grid size-10 place-items-center rounded-md text-[var(--color-brand)]"
            href="/marketplace"
          >
            <ShoppingBag aria-hidden="true" size={20} />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[var(--color-copper)] text-[10px] font-bold text-white">
              0
            </span>
          </Link>
          {user ? (
            <Link
              className="hidden items-center gap-2 rounded-md px-2 py-2 text-xs font-bold text-[var(--color-brand)] md:flex"
              href="/account"
            >
              <UserCircle aria-hidden="true" size={20} />
              {userLabel}
            </Link>
          ) : (
            <Link
              aria-label="Sign in"
              className="hidden size-10 place-items-center rounded-md text-[var(--color-brand)] md:grid"
              href="/sign-in"
            >
              <UserCircle aria-hidden="true" size={21} />
            </Link>
          )}
          <Link className="btn-primary hidden md:inline-flex" href="/book">
            Book Now
          </Link>
        </div>
      </div>

      <MobileNavigation
        accountLinks={accountLinks}
        isOpen={open}
        onClose={() => setOpen(false)}
        userLabel={userLabel}
      />
    </header>
  );
}
