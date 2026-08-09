"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { NavigationItem } from "@/config/navigation";

export type MobileNavigationProps = {
  accountLinks: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
  userLabel: string | null;
};

const mobilePrimaryLinks = [
  { label: "Home", href: "/" },
  { label: "Beauty", href: "/beauty" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Braiders", href: "/braiders" },
  { label: "AI Studio", href: "/ai-studio" },
  { label: "Our Story", href: "/about" },
] satisfies NavigationItem[];

export function MobileNavigation({
  accountLinks,
  isOpen,
  onClose,
  userLabel,
}: MobileNavigationProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-surface-ink)]/40 backdrop-blur-sm md:hidden"
      id="mobile-navigation"
    >
      <div className="ml-auto flex h-dvh w-[min(88vw,360px)] flex-col bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--color-brand)]">
              Menu
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {userLabel ?? "Welcome to Touch of Heaven"}
            </p>
          </div>
          <button
            aria-label="Close navigation"
            className="grid size-10 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-brand)]"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav className="grid gap-1 px-5 py-5" aria-label="Mobile primary">
          {mobilePrimaryLinks.map((item) => (
            <Link
              className="rounded-md px-3 py-3 text-base font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-brand-soft)]"
              href={item.href}
              key={item.href}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--color-border)] p-5">
          <div className="grid gap-2">
            {accountLinks.map((item) => (
              <Link
                className="btn-secondary w-full"
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
            {accountLinks.length === 0 ? (
              <Link className="btn-secondary w-full" href="/sign-in" onClick={onClose}>
                Sign in
              </Link>
            ) : null}
            <Link className="btn-primary w-full" href="/book" onClick={onClose}>
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
