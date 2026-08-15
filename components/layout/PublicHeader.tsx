"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import {
  publicNavigation,
  roleAwareNavigation,
} from "@/config/navigation";
import { brandAssets } from "@/config/site";
import type { SafeUser } from "@/types/auth";

export type PublicHeaderProps = {
  user: SafeUser | null;
};

export function PublicHeader({ user }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const accountLinks = user ? roleAwareNavigation(user.roles) : [];
  const roleLinks = accountLinks.filter((item) => item.href !== "/account");

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="page-container grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-4 lg:flex lg:justify-between">
        <button
          className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand-strong)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] lg:hidden"
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>

        <Link
          className="mx-auto flex items-center gap-3 font-semibold text-[var(--color-text-primary)] lg:mx-0"
          href="/"
          aria-label="Touch of Heaven home"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
            <Image
              alt=""
              className="object-contain p-1"
              fill
              sizes="40px"
              src={brandAssets.logoMark}
            />
          </span>
          <span className="hidden sm:inline">Touch of Heaven</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {publicNavigation.map((item) => (
            <Link className="btn-ghost" key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user
            ? roleLinks.map((item) => (
              <Link className="btn-secondary" key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))
            : null}
          <Link className="btn-primary" href={user ? "/account" : "/sign-in"}>
            {user ? "Account" : "Sign In"}
          </Link>
        </div>

        <Link
          aria-label={user ? "Open account" : "Sign in"}
          className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand-strong)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] lg:hidden"
          href={user ? "/account" : "/sign-in"}
        >
          <Bell aria-hidden="true" size={19} />
        </Link>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
        >
          <nav
            className="page-container grid gap-2 py-4"
            aria-label="Mobile primary"
          >
            {[...publicNavigation, ...roleLinks].map((item) => (
              <Link
                className="rounded-md px-2 py-3 text-base font-semibold text-[var(--color-text-primary)]"
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? null : (
              <Link
                className="btn-secondary mt-2"
                href="/sign-in"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
            <Link
              className="btn-primary"
              href={user ? "/account" : "/sign-in"}
              onClick={() => setOpen(false)}
            >
              {user ? "Account" : "Sign In"}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
