"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronDown,
  Heart,
  Home,
  LogIn,
  Search,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useViewer } from "@/components/providers/ViewerProvider";
import { brandAssets } from "@/config/site";

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function BrandMark({ name = true }: { name?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Touch of Heaven home"
      className="flex min-w-0 items-center gap-3 text-[var(--color-text-primary)]"
    >
      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-[var(--color-brand-soft)]">
        <Image alt="" className="object-contain p-1" fill sizes="44px" src={brandAssets.logoMark} priority />
      </span>
      {name ? (
        <span className="hidden font-serif text-2xl font-semibold sm:inline">
          Touch of Heaven
        </span>
      ) : null}
    </Link>
  );
}

function HeaderIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-primary)] transition hover:bg-white hover:text-[var(--color-brand)]"
    >
      {children}
    </Link>
  );
}

function initialsOf(firstName: string, lastName: string) {
  return `${firstName.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase() || "?";
}

function ViewerAvatar({ firstName, lastName, size }: { firstName: string; lastName: string; size: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={classNames(
        "grid shrink-0 place-items-center rounded-full bg-[var(--color-brand)] font-bold text-white",
        size === "md" ? "h-11 w-11 text-sm" : "h-10 w-10 text-sm",
      )}
    >
      {initialsOf(firstName, lastName)}
    </span>
  );
}

/**
 * The client-side app chrome shared by every discovery page: header,
 * desktop footer and the mobile tab bar. The visitor comes from the public
 * layout's session lookup (see ViewerProvider); signed-out visitors get a
 * log-in link instead of account shortcuts.
 */
export function ClientShell({
  children,
  simple = false,
}: {
  children: React.ReactNode;
  simple?: boolean;
}) {
  const pathname = usePathname();
  const viewer = useViewer();
  // The desktop header's links, stated outright. This was a slice of a
  // longer list, so removing one entry silently promoted the next one
  // into the header instead of shortening it.
  const desktopNav = [{ label: "AI Studio", href: "/ai-studio" }];

  // The phone's five destinations, in the order the design fixes them.
  // AI Studio sits in the centre as a raised action; Market is
  // deliberately not one of the five - it is reachable from the header.
  const mobileNav = [
    { label: "Home", href: viewer ? "/home" : "/", icon: Home },
    { label: "Search", href: "/explore", icon: Search },
    { label: "AI Studio", href: "/ai-studio", icon: Sparkles },
    { label: "Activity", href: "/activity", icon: Calendar },
    { label: "Profile", href: "/profile", icon: User },
  ];
  const isExploreActive =
    pathname.startsWith("/explore") ||
    pathname.startsWith("/businesses") ||
    pathname.startsWith("/map") ||
    pathname.startsWith("/book-with");
  const signInHref = `/customer/sign-in?callbackUrl=${encodeURIComponent(pathname || "/explore")}`;

  if (simple) {
    return (
      <div className="min-h-dvh bg-[var(--color-page)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-page)]/95">
          <div className="mx-auto flex min-h-[84px] max-w-7xl items-center justify-between px-5 md:px-10">
            <BrandMark />
          </div>
        </header>
        {children}
        <div className="hidden lg:block">
          <PublicFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-page)] pb-28 text-[var(--color-text-primary)] lg:pb-0">
      <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[var(--color-page)]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <BrandMark />
          <nav className="hidden items-stretch gap-8 lg:flex" aria-label="Client navigation">
            {desktopNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    "inline-flex min-h-[76px] items-center border-b-2 px-1 text-base font-semibold transition",
                    active
                      ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                      : "border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-brand)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            {viewer ? (
              <HeaderIcon href="/saved" label="Saved professionals">
                <Heart size={24} aria-hidden="true" />
              </HeaderIcon>
            ) : null}
            <Link
              href="/marketplace"
              aria-label="Market"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] sm:px-4"
            >
              <ShoppingBag size={20} aria-hidden="true" />
              <span className="hidden xl:inline">Market</span>
            </Link>
            {viewer ? (
              <>
                <HeaderIcon href="/notifications" label="Notifications">
                  <Bell size={24} aria-hidden="true" />
                </HeaderIcon>
                <Link
                  href="/account"
                  className="hidden items-center gap-3 border-l border-[var(--color-border)] pl-4 md:flex"
                >
                  <ViewerAvatar firstName={viewer.firstName} lastName={viewer.lastName} size="md" />
                  <span className="max-w-[10rem] truncate font-semibold">{viewer.firstName}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </Link>
                <Link href="/account" aria-label="Your account" className="grid size-11 place-items-center md:hidden">
                  <ViewerAvatar firstName={viewer.firstName} lastName={viewer.lastName} size="sm" />
                </Link>
              </>
            ) : (
              <Link
                href={signInHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)]"
              >
                <LogIn size={18} aria-hidden="true" />
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
      <div className="hidden lg:block">
        <PublicFooter />
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-[var(--color-border)] bg-[var(--color-page)]/98 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_35px_rgba(43,23,36,0.08)] backdrop-blur-xl lg:hidden"
        aria-label="Mobile client navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active =
              item.label === "Search"
                ? isExploreActive
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            // AI Studio is the raised centre action in the design. It keeps
            // a real text label and accessible name - a floating icon with
            // no word is not navigable by everyone.
            if (item.label === "AI Studio") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-14 flex-col items-center justify-end gap-1 text-[0.72rem] font-medium text-[var(--color-brand)]"
                >
                  <span
                    aria-hidden="true"
                    className="-mt-7 grid size-14 place-items-center rounded-full border-4 border-[var(--color-page)] bg-[var(--color-brand)] text-[var(--color-gold)] shadow-[0_6px_18px_rgba(43,23,36,0.25)]"
                  >
                    <Icon size={24} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={classNames(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] text-[0.72rem] font-medium",
                  active ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]",
                )}
              >
                <Icon size={23} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
