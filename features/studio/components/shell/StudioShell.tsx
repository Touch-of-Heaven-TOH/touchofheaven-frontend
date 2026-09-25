"use client";

import {
  Bell,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  House,
  ImagePlus,
  LifeBuoy,
  ListPlus,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Search,
  Store,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { brandAssets } from "@/config/site";
import { BlockTimeDialog } from "@/features/studio/components/calendar/BlockTimeDialog";
import {
  HELP_ITEM,
  MORE_ITEMS,
  ROLE_LABEL,
  SETTINGS_ITEM,
  SIDEBAR_ITEMS,
  activeHref,
  canSee,
  type StudioNavItem,
} from "@/features/studio/components/shell/navigation";
import { NotificationsPanel } from "@/features/studio/components/shell/NotificationsPanel";
import { SearchDialog } from "@/features/studio/components/shell/SearchDialog";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import { ToastProvider } from "@/features/studio/components/ui/Toaster";
import { Avatar } from "@/features/studio/components/ui/primitives";
import { studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { StudioProvider, useStudio } from "@/features/studio/lib/context";
import type {
  BlockType,
  BusinessContext,
  NotificationsResponse,
} from "@/features/studio/lib/types";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  run?: () => void;
  /** Shown instead of running when the action is not available to this person. */
  unavailableReason?: string;
};

export function StudioShell({
  context,
  children,
}: {
  context: BusinessContext;
  children: ReactNode;
}) {
  return (
    <StudioProvider value={context}>
      <ToastProvider>
        <ShellFrame>{children}</ShellFrame>
      </ToastProvider>
    </StudioProvider>
  );
}

/** The project's own Touch of Heaven mark and name (not the monogram drawn in
 * the mockups). */
function BrandLogo() {
  return (
    <Link
      href="/studio"
      className="flex min-w-0 items-center gap-2.5"
      aria-label="Touch of Heaven Studio home"
    >
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full lg:size-10">
        <Image alt="" src={brandAssets.logoMark} fill sizes="40px" className="object-contain" priority />
      </span>
      {/* On the narrowest phones the mark alone carries the brand, so the
          wordmark never runs under the header buttons. */}
      <span className="hidden truncate font-display text-base whitespace-nowrap text-[var(--color-text-primary)] min-[360px]:block sm:text-lg lg:text-xl">
        Touch of Heaven
      </span>
    </Link>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const studio = useStudio();
  const pathname = usePathname();
  const router = useRouter();

  const sidebar = useMemo(() => SIDEBAR_ITEMS.filter((item) => canSee(item, studio)), [studio]);
  const more = useMemo(() => MORE_ITEMS.filter((item) => canSee(item, studio)), [studio]);
  const current = activeHref([...sidebar, SETTINGS_ITEM, HELP_ITEM], pathname);

  const [newOpen, setNewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [blockType, setBlockType] = useState<BlockType | null>(null);

  const { data: inbox } = useSWR<NotificationsResponse>(
    "/api/v1/business/notifications",
    studioFetcher,
    { refreshInterval: 60_000 },
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const quickActions: QuickAction[] = [
    {
      key: "booking",
      label: "Add booking",
      description: "Record a walk-in or a booking taken by phone.",
      icon: CalendarPlus,
      ...(studio.isOwner
        ? { run: () => setBlockType("MANUAL_APPOINTMENT") }
        : { unavailableReason: "Only the owner can add bookings for now." }),
    },
    {
      key: "block",
      label: "Block time",
      description: "Breaks, time off or anything clients should not book.",
      icon: Store,
      ...(studio.isOwner
        ? { run: () => setBlockType("PERSONAL") }
        : { unavailableReason: "Only the owner can block time." }),
    },
    {
      key: "check-in",
      label: "Check in a client",
      description: "Open today's bookings.",
      icon: ClipboardCheck,
      ...(studio.can("appointments", "manage")
        ? { run: () => router.push("/studio/appointments?tab=today") }
        : { unavailableReason: "Your role cannot check clients in." }),
    },
    {
      key: "client",
      label: "Add client",
      description: "",
      icon: UserRoundPlus,
      unavailableReason: "Coming soon. Clients are added automatically when they book.",
    },
    {
      key: "service",
      label: "Add service",
      description: "Create a new bookable service.",
      icon: Scissors,
      ...(studio.isOwner
        ? { run: () => router.push("/studio/services/new") }
        : { unavailableReason: "Only the owner can add services." }),
    },
    {
      key: "portfolio",
      label: "Upload portfolio work",
      description: "Show clients your latest styles.",
      icon: ImagePlus,
      ...(studio.can("portfolio", "manage")
        ? { run: () => router.push("/studio/portfolio") }
        : { unavailableReason: "Your role cannot manage the portfolio." }),
    },
    {
      key: "waitlist",
      label: "Create waitlist entry",
      description: "Offer an opening to someone who is waiting.",
      icon: ListPlus,
      ...(studio.can("waitlist", "manage")
        ? { run: () => router.push("/studio/waitlist") }
        : { unavailableReason: "Your role cannot manage the waitlist." }),
    },
  ];

  const bottom: Array<StudioNavItem | "new" | "more"> = [
    { label: "Home", href: "/studio", icon: House, module: "overview" },
    { label: "Calendar", href: "/studio/calendar", icon: CalendarDays, module: "calendar" },
    "new",
    { label: "Clients", href: "/studio/clients", icon: Users, module: "clients" },
    "more",
  ];
  const moreActive = more.some((item) => item.href.split("?")[0] === current);
  const fullName = `${studio.user.firstName} ${studio.user.lastName}`.trim();

  return (
    <div className="studio-theme min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-0">
          <div className="min-w-0 lg:w-[260px] lg:shrink-0 lg:pl-6 lg:pr-3">
            <BrandLogo />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:pr-8">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden min-h-11 w-72 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-brand)] lg:flex"
            >
              <Search aria-hidden="true" className="size-4" />
              <span className="flex-1 text-left">Search anything…</span>
              <kbd className="rounded border border-[var(--color-border)] px-1.5 py-0.5 font-sans text-[11px]">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="grid size-11 place-items-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)] lg:hidden"
            >
              <Search aria-hidden="true" strokeWidth={1.6} className="size-[22px]" />
            </button>
            <Link
              href={HELP_ITEM.href}
              aria-label="Help and support"
              className="hidden size-11 place-items-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)] lg:grid"
            >
              <LifeBuoy aria-hidden="true" strokeWidth={1.6} className="size-5" />
            </Link>
            <NotificationsPanel inbox={inbox ?? null}>
              {(open, toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={open}
                  aria-label={
                    inbox?.unreadCount
                      ? `Notifications, ${inbox.unreadCount} need attention`
                      : "Notifications"
                  }
                  className="relative grid size-11 place-items-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
                >
                  <Bell aria-hidden="true" strokeWidth={1.6} className="size-[22px]" />
                  {inbox?.unreadCount ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] font-bold text-white"
                    >
                      {inbox.unreadCount > 9 ? "9+" : inbox.unreadCount}
                    </span>
                  ) : null}
                </button>
              )}
            </NotificationsPanel>
            <AccountMenu name={fullName} />
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <aside className="sticky top-[72px] flex h-[calc(100dvh-72px)] flex-col">
          <div className="px-3 pt-5 pb-3">
            <BusinessSwitcher />
          </div>
          <nav aria-label="Studio" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <ul className="grid gap-1">
              {sidebar.map((item) => (
                <li key={item.href}>
                  <SidebarLink item={item} active={item.href === current} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid gap-2 border-t border-[var(--color-border)] px-3 py-4">
            <Link
              href={SETTINGS_ITEM.href}
              aria-current={current === SETTINGS_ITEM.href ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-[15px] ${
                current === SETTINGS_ITEM.href
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                  : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
              }`}
            >
              <SETTINGS_ITEM.icon aria-hidden="true" strokeWidth={1.6} className="size-5" />
              Settings
            </Link>
            <Link
              href={HELP_ITEM.href}
              aria-current={current === HELP_ITEM.href ? "page" : undefined}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
            >
              <HELP_ITEM.icon aria-hidden="true" strokeWidth={1.6} className="size-5" />
              <span className="flex-1">Help &amp; support</span>
              <ChevronRight aria-hidden="true" className="size-4 text-[var(--color-text-muted)]" />
            </Link>
          </div>
        </aside>
        </div>

        <div className="flex min-h-[calc(100dvh-64px)] min-w-0 flex-col lg:min-h-[calc(100dvh-72px)]">
          <main
            id="studio-main"
            className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-8 lg:pb-12"
          >
            {children}
          </main>
          <StudioFooter />
        </div>
      </div>

      <nav
        aria-label="Studio mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid h-[72px] max-w-xl grid-cols-5 items-end pb-2">
          {bottom.map((slot) => {
            if (slot === "new") {
              return (
                <li key="new" className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setNewOpen(true)}
                    className="-mt-9 flex flex-col items-center gap-0.5 text-xs font-medium text-[var(--color-brand)]"
                  >
                    <span className="grid size-[62px] place-items-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_24px_rgba(122,16,36,0.35)] ring-4 ring-[var(--color-surface)]">
                      <Plus aria-hidden="true" strokeWidth={2.2} className="size-8" />
                    </span>
                    New
                  </button>
                </li>
              );
            }
            if (slot === "more") {
              return (
                <li key="more" className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    aria-expanded={moreOpen}
                    className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 text-xs ${
                      moreActive
                        ? "font-medium text-[var(--color-brand)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    <Menu aria-hidden="true" strokeWidth={1.6} className="size-6" />
                    More
                  </button>
                </li>
              );
            }
            const active = slot.href === current;
            const Icon = slot.icon;
            return (
              <li key={slot.href} className="flex justify-center">
                {canSee(slot, studio) ? (
                  <Link
                    href={slot.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 text-xs ${
                      active
                        ? "font-medium text-[var(--color-brand)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      strokeWidth={active ? 2 : 1.6}
                      className="size-6"
                      fill={active && slot.href === "/studio" ? "currentColor" : "none"}
                    />
                    {slot.label}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      <StudioDialog open={newOpen} onClose={() => setNewOpen(false)} title="Create" size="sm">
        <ul className="grid gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const disabled = !action.run;
            return (
              <li key={action.key}>
                <button
                  type="button"
                  aria-disabled={disabled || undefined}
                  onClick={() => {
                    if (!action.run) return;
                    setNewOpen(false);
                    action.run();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    disabled
                      ? "cursor-not-allowed border-dashed border-[var(--color-border)] bg-[var(--color-surface-strong)]/60"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${
                      disabled
                        ? "bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]"
                        : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                    }`}
                  >
                    <Icon aria-hidden="true" strokeWidth={1.6} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                      {action.label}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {action.unavailableReason ?? action.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </StudioDialog>

      <StudioDialog open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <ul className="grid gap-1">
          {more.map((item) => {
            const Icon = item.icon;
            const active = !item.href.includes("?") && item.href === current;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] ${
                    active
                      ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
                  }`}
                >
                  <Icon aria-hidden="true" strokeWidth={1.6} className="size-5" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight aria-hidden="true" className="size-4 text-[var(--color-text-muted)]" />
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t border-[var(--color-border)] pt-2">
            <Link
              href="/team-invitations"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
            >
              <Store aria-hidden="true" strokeWidth={1.6} className="size-5" />
              <span className="flex-1">Switch business</span>
              <ChevronRight aria-hidden="true" className="size-4 text-[var(--color-text-muted)]" />
            </Link>
          </li>
          <li>
            <SignOutButton />
          </li>
        </ul>
      </StudioDialog>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {blockType ? (
        <BlockTimeDialog open onClose={() => setBlockType(null)} initialType={blockType} />
      ) : null}
    </div>
  );
}

function SidebarLink({ item, active }: { item: StudioNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-12 items-center gap-3 rounded-lg px-4 text-[15px] transition-colors ${
        active
          ? "bg-[var(--color-brand-soft)] font-medium text-[var(--color-brand)]"
          : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-strong)]"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-[var(--color-brand)]"
        />
      ) : null}
      <Icon aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function BusinessSwitcher() {
  const studio = useStudio();
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[var(--color-surface-strong)]"
      >
        <Avatar name={studio.businessName} src={studio.businessLogoUrl} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-[var(--color-text-primary)]">
            {studio.businessName}
          </span>
          <span className="block truncate text-xs text-[var(--color-text-muted)]">
            {studio.locationLabel ?? ROLE_LABEL[studio.role]}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-muted)]" />
      </button>
      {open ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-soft)]">
          <p className="px-3 pt-1 pb-2 text-xs text-[var(--color-text-muted)]">
            {ROLE_LABEL[studio.role]} · {studio.timezone}
          </p>
          <Link
            href="/studio/settings"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-[var(--color-brand-soft)]"
          >
            Business settings
          </Link>
          <Link
            href="/team-invitations"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-[var(--color-brand-soft)]"
          >
            {studio.otherBusinessCount > 0 ? "Switch business" : "Team invitations"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu({ name }: { name: string }) {
  const studio = useStudio();
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        // On a phone this is an avatar on its own, which left to itself is a
        // 40px target. The hit area is widened to 44px without growing the
        // avatar; from lg up the button carries a name and needs no padding.
        className="flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-full p-0.5 hover:bg-[var(--color-brand-soft)] lg:min-h-0 lg:min-w-0 lg:justify-start lg:rounded-xl lg:py-1 lg:pr-2 lg:pl-1"
      >
        <Avatar name={name} size="sm" />
        <span className="hidden min-w-0 text-left lg:block">
          <span className="block max-w-40 truncate text-sm font-medium text-[var(--color-text-primary)]">
            {name}
          </span>
          <span className="block max-w-40 truncate text-xs text-[var(--color-text-muted)]">
            {studio.businessName}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="hidden size-4 text-[var(--color-text-muted)] lg:block" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-14 right-0 z-50 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-soft)]"
        >
          <div className="border-b border-[var(--color-border)] px-3 pt-2 pb-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{studio.user.email}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {ROLE_LABEL[studio.role]} at {studio.businessName}
            </p>
          </div>
          <Link
            role="menuitem"
            href="/account"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm hover:bg-[var(--color-brand-soft)]"
          >
            <CircleUserRound aria-hidden="true" className="size-4" />
            Your account
          </Link>
          <SignOutButton compact />
        </div>
      ) : null}
    </div>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  return (
    <button
      type="button"
      role={compact ? "menuitem" : undefined}
      disabled={signingOut}
      onClick={async () => {
        setSigningOut(true);
        try {
          await studioRequest("/api/v1/auth/logout", "POST");
        } finally {
          router.replace("/business/sign-in");
          router.refresh();
        }
      }}
      className={`flex w-full items-center gap-3 rounded-xl px-3 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] ${
        compact ? "min-h-10 gap-2 text-sm" : "min-h-12 text-[15px]"
      }`}
    >
      <LogOut aria-hidden="true" strokeWidth={1.6} className={compact ? "size-4" : "size-5"} />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** One shared footer for every Studio page on desktop. It sits after the
 * content in normal flow, so it can never cover anything. */
function StudioFooter() {
  return (
    <footer className="hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-8 py-5 text-sm text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <span className="relative size-7 overflow-hidden rounded-full">
            <Image alt="" src={brandAssets.logoMark} fill sizes="28px" className="object-contain" />
          </span>
          <p>
            <span className="font-display text-[var(--color-text-primary)]">Touch of Heaven</span> ·
            Business Studio · © {new Date().getFullYear()}
          </p>
        </div>
        <nav aria-label="Studio footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/studio/help" className="hover:text-[var(--color-brand)]">
            Help
          </Link>
          <Link href="/legal/privacy" className="hover:text-[var(--color-brand)]">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-[var(--color-brand)]">
            Terms
          </Link>
          <Link href="/studio/help#accessibility" className="hover:text-[var(--color-brand)]">
            Accessibility
          </Link>
          <Link href="/studio/help#contact" className="hover:text-[var(--color-brand)]">
            Contact support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
