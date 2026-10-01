"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { brandAssets } from "@/config/site";

/*
 * The header and footer the AI Studio pages share.
 *
 * The public layout hides its own chrome for /ai-studio because the studio
 * draws its own, so every page under it has to bring the header and the
 * footer with it. Keeping that in one place means a change to the studio's
 * navigation lands on all of them at once.
 */
export function AiStudioChrome({
  children,
  headerRight,
}: {
  children: ReactNode;
  /** Page-specific control at the far right, such as the credit counter. */
  headerRight?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-white/80 backdrop-blur">
        <div className="mx-auto grid min-h-16 w-full max-w-[1360px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8">
          <Link className="flex items-center" href="/" aria-label="Touch of Heaven home">
            <span className="relative block h-11 w-36 sm:w-44">
              <Image
                alt="Touch of Heaven"
                className="object-contain object-left"
                fill
                priority
                sizes="(max-width: 640px) 144px, 176px"
                src={brandAssets.logoLockup}
              />
            </span>
          </Link>
          <nav className="hidden items-stretch gap-8 lg:flex" aria-label="Site navigation">
            <Link
              aria-current="page"
              className="inline-flex min-h-11 items-center border-b-2 border-[var(--color-brand)] px-1 text-base font-semibold text-[var(--color-brand)]"
              href="/ai-studio"
            >
              AI Studio
            </Link>
          </nav>
          <div className="flex justify-end">{headerRight}</div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <div className="hidden lg:block">
        <PublicFooter />
      </div>
    </div>
  );
}

/**
 * Create / My looks - the studio's two modes. They sit with the page
 * content rather than in the site header, where they read as site
 * navigation, which they are not.
 */
export function StudioModeTabs({ active }: { active: "create" | "looks" }) {
  const base = "min-h-11 rounded-full px-5 py-2 transition";
  const on = "bg-white text-[var(--color-brand-strong)] shadow-[var(--shadow-subtle)]";
  const off = "text-[var(--color-text-muted)] hover:text-[var(--color-brand-strong)]";

  return (
    <nav
      aria-label="Studio mode"
      className="mb-6 inline-flex rounded-full bg-[var(--color-brand-soft)] p-1 text-sm font-semibold"
    >
      <Link
        aria-current={active === "create" ? "page" : undefined}
        className={`${base} ${active === "create" ? on : off}`}
        href="/ai-studio"
      >
        Create
      </Link>
      <Link
        aria-current={active === "looks" ? "page" : undefined}
        className={`${base} ${active === "looks" ? on : off}`}
        href="/ai-studio/my-looks"
      >
        My looks
      </Link>
    </nav>
  );
}
