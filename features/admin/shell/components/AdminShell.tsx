"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Headphones,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PackageCheck,
  PackageSearch,
  Search,
  Settings,
  ShoppingCart,
  Star,
  UserRoundCheck,
  Users,
  UsersRound,
  X,
  Zap,
  Megaphone,
} from "lucide-react";
import { adminNavigationItems } from "@/features/admin/data/admin-console-data";
import type { AdminNavigationItem, AdminSectionKey } from "@/features/admin/types/admin.types";
import { brandAssets } from "@/config/site";
import type { SafeUser } from "@/types/auth";

const iconMap = {
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  CircleAlert,
  Headphones,
  LayoutDashboard,
  Megaphone,
  PackageCheck,
  PackageSearch,
  Settings,
  ShoppingCart,
  Star,
  UserRoundCheck,
  Users,
  UsersRound,
} as const;

function activeKeyFromPath(pathname: string): AdminSectionKey {
  const first = pathname.split("/").filter(Boolean)[1];
  if (!first) return "overview";
  if (first === "appointments" || first === "bookings") return "bookings";
  if (first === "applications") return "braiders";
  if (first === "payments" || first === "finance" || first === "payouts") return "finance";
  if (first === "customers") return "clients";
  if (first === "analytics") return "reports";
  if (first === "support-tickets") return "support";
  if (first === "team-management") return "team";
  return first as AdminSectionKey;
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: AdminNavigationItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;

  return (
    <Link
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
        active
          ? "bg-white/12 text-[var(--color-gold-light)] shadow-[inset_0_0_0_1px_rgba(244,223,169,0.22)]"
          : "text-white/82 hover:bg-white/8 hover:text-white"
      }`}
      href={item.href}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={19} />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function Sidebar({
  activeKey,
  onNavigate,
}: {
  activeKey: AdminSectionKey;
  onNavigate?: () => void;
}) {
  return (
    <aside className="flex h-full flex-col bg-[radial-gradient(circle_at_80%_10%,rgba(157,73,135,0.34),transparent_26%),linear-gradient(180deg,#2b0d2a,#230a24_46%,#351035)] px-4 py-5 text-white">
      <Link className="flex items-center gap-3 border-b border-white/10 pb-5" href="/admin">
        <Image
          alt=""
          className="size-12 rounded-full border border-[var(--color-gold)] bg-[#f6efe4] object-cover"
          height={48}
          src={brandAssets.logoMark}
          width={48}
        />
        <span>
          <span className="block font-serif text-xl font-semibold text-[var(--color-gold-light)]">
            Touch of Heaven
          </span>
          <span className="block text-sm text-white/80">Owner Console</span>
        </span>
      </Link>

      <nav className="mt-5 grid gap-1" aria-label="Admin">
        {adminNavigationItems.map((item) => (
          <NavLink
            active={activeKey === item.key}
            item={item}
            key={item.key}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto grid gap-4 border-t border-white/10 pt-5">
        <section className="rounded-md border border-[var(--color-gold)]/45 bg-white/8 p-4">
          <p className="font-bold text-[var(--color-gold-light)]">Premium Plan</p>
          <p className="mt-1 text-sm leading-5 text-white/78">
            Your platform is active and running smoothly.
          </p>
          <Link
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[linear-gradient(90deg,#c9963c,#f4dfa9)] px-3 text-sm font-bold text-[#2b1724]"
            href="/admin/settings"
          >
            View Plan Details
          </Link>
        </section>
        <Link className="flex items-center gap-2 text-sm font-semibold text-white/80" href="/admin/support">
          <Headphones aria-hidden="true" size={18} />
          Help & Resources
        </Link>
        <p className="text-xs text-white/62">© 2025 Touch of Heaven.</p>
      </div>
    </aside>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeKey = activeKeyFromPath(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#fffaf7] text-[var(--color-text-primary)] lg:grid lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar activeKey={activeKey} />
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[var(--z-overlay)] bg-black/45 lg:hidden">
          <div className="h-full w-[min(88vw,320px)]">
            <Sidebar activeKey={activeKey} onNavigate={() => setDrawerOpen(false)} />
          </div>
          <button
            aria-label="Close admin navigation"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-md bg-white text-[var(--color-brand)]"
            onClick={() => setDrawerOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
        </div>
      ) : null}

      <main className="min-w-0">
        <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-white/94 backdrop-blur">
          <div className="flex min-h-[72px] items-center gap-3 px-4 md:px-6 xl:px-8">
            <button
              aria-label="Open admin navigation"
              className="grid size-10 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-brand)] lg:hidden"
              onClick={() => setDrawerOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" size={22} />
            </button>

            <form
              action="/admin"
              className="hidden min-h-11 w-full max-w-[560px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-3 md:flex"
              role="search"
            >
              <Search aria-hidden="true" className="text-[var(--color-text-muted)]" size={18} />
              <label className="sr-only" htmlFor="admin-search">
                Search bookings, braiders, clients, orders, and products
              </label>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
                id="admin-search"
                name="q"
                placeholder="Search bookings, braiders, clients, orders, products..."
                type="search"
              />
              <kbd className="hidden rounded border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] xl:inline">
                Ctrl K
              </kbd>
            </form>

            <div className="ml-auto flex items-center gap-2 md:gap-4">
              <button className="hidden min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] px-4 text-sm font-bold md:inline-flex" type="button">
                <Zap aria-hidden="true" className="text-[var(--color-gold)]" size={17} />
                Quick Actions
                <ChevronDown aria-hidden="true" size={16} />
              </button>
              <button aria-label="Notifications" className="relative grid size-10 place-items-center text-[var(--color-brand)]" type="button">
                <Bell aria-hidden="true" size={22} />
                <span className="absolute right-0 top-1 grid size-5 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
                  12
                </span>
              </button>
              <button aria-label="Messages" className="relative hidden size-10 place-items-center text-[var(--color-brand)] sm:grid" type="button">
                <MessageSquare aria-hidden="true" size={22} />
                <span className="absolute right-0 top-1 grid size-5 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
                  3
                </span>
              </button>
              <Link className="flex items-center gap-3" href="/admin/settings">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand)]">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
                <span className="hidden text-sm leading-tight md:block">
                  <span className="block font-bold">Owner</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    Touch of Heaven
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 md:px-6 xl:px-8">{children}</div>
      </main>
    </div>
  );
}

