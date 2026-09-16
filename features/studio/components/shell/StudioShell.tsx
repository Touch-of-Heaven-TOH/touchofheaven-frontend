"use client";

import {
  CalendarPlus,
  CircleUserRound,
  ClipboardCheck,
  Ellipsis,
  Hourglass,
  LogOut,
  Plus,
  Store,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BlockTimeDialog } from "@/features/studio/components/calendar/BlockTimeDialog";
import {
  ROLE_LABEL,
  activeHref,
  visibleNavGroups,
  type StudioNavItem,
} from "@/features/studio/components/shell/navigation";
import { ToastProvider } from "@/features/studio/components/ui/Toaster";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import { Avatar } from "@/features/studio/components/ui/primitives";
import { studioRequest } from "@/features/studio/lib/api";
import { StudioProvider, useStudio } from "@/features/studio/lib/context";
import type { BlockType, BusinessContext } from "@/features/studio/lib/types";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  run: () => void;
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

function ShellFrame({ children }: { children: ReactNode }) {
  const studio = useStudio();
  const pathname = usePathname();
  const router = useRouter();
  const groups = useMemo(() => visibleNavGroups(studio), [studio]);
  const allItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const current = activeHref(allItems, pathname);

  const [newOpen, setNewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [blockType, setBlockType] = useState<BlockType | null>(null);

  const quickActions: QuickAction[] = [];
  if (studio.isOwner) {
    quickActions.push(
      {
        key: "walk-in",
        label: "Record a walk-in",
        description: "Hold time for a client who booked in person.",
        icon: CalendarPlus,
        run: () => setBlockType("MANUAL_APPOINTMENT"),
      },
      {
        key: "block",
        label: "Block time",
        description: "Breaks, time off or anything clients should not book.",
        icon: Store,
        run: () => setBlockType("PERSONAL"),
      },
    );
  }
  if (studio.can("appointments", "manage")) {
    quickActions.push({
      key: "check-in",
      label: "Check in a client",
      description: "Open today's appointments.",
      icon: ClipboardCheck,
      run: () => router.push("/studio/appointments?view=today"),
    });
  }
  if (studio.can("waitlist", "manage")) {
    quickActions.push({
      key: "waitlist",
      label: "Offer a waitlist spot",
      description: "Fill an opening with someone who is waiting.",
      icon: Hourglass,
      run: () => router.push("/studio/waitlist"),
    });
  }
  if (studio.can("team", "manage")) {
    quickActions.push({
      key: "invite",
      label: "Invite a team member",
      description: "Give a stylist or receptionist their own access.",
      icon: UserPlus,
      run: () => router.push("/studio/team?invite=1"),
    });
  }

  const runAction = (action: QuickAction) => {
    setNewOpen(false);
    action.run();
  };

  const primaryMobile = ["/studio", "/studio/calendar"]
    .map((href) => allItems.find((item) => item.href === href))
    .filter((item): item is StudioNavItem => Boolean(item));
  const clientsItem = allItems.find((item) => item.href === "/studio/clients");
  const moreItems = allItems.filter(
    (item) => !["/studio", "/studio/calendar", "/studio/clients"].includes(item.href),
  );

  return (
    <div className="min-h-dvh bg-[var(--color-page)] lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-[var(--color-surface-ink)] text-white lg:flex">
        <Link href="/studio" className="flex items-center gap-3 px-6 pt-6 pb-5">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand)] text-sm font-bold text-[var(--color-gold-light)]">
            TOH
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Touch of Heaven</span>
            <span className="block text-xs text-white/60">Business Studio</span>
          </span>
        </Link>
        <nav aria-label="Studio" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.label} className="mt-4 first:mt-0">
              <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-white/45 uppercase">
                {group.label}
              </p>
              <ul className="grid *:min-w-0 gap-0.5">
                {group.items.map((item) => {
                  const active = item.href === current;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-white/12 text-white"
                            : "text-white/70 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-[var(--color-gold)]"
                          />
                        ) : null}
                        <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-semibold">{studio.businessName}</p>
          <p className="text-xs text-white/60">
            {ROLE_LABEL[studio.role]} · {studio.timezone}
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Top bar (all sizes) */}
        <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
            <Link href="/studio" className="flex min-w-0 items-center gap-2 lg:hidden">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--color-brand)] text-[10px] font-bold text-[var(--color-gold-light)]">
                TOH
              </span>
              <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {studio.businessName}
              </span>
            </Link>
            <p className="hidden truncate text-sm text-[var(--color-text-muted)] lg:block">
              {allItems.find((item) => item.href === current)?.label ?? "Studio"}
            </p>
            <div className="ml-auto flex items-center gap-2">
              {quickActions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  className="btn-primary hidden !min-h-10 !rounded-full !px-4 lg:inline-flex"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  New
                </button>
              ) : null}
              <AccountMenu />
            </div>
          </div>
        </header>

        <main
          id="studio-main"
          className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-8 lg:pb-10"
        >
          {children}
        </main>

        <footer className="hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-8 py-4 text-xs text-[var(--color-text-muted)]">
            <p>© {new Date().getFullYear()} Touch of Heaven · Business Studio</p>
            <nav aria-label="Footer" className="flex flex-wrap gap-4">
              <Link href="/contact" className="hover:text-[var(--color-brand)]">
                Help &amp; support
              </Link>
              <Link href="/legal/privacy" className="hover:text-[var(--color-brand)]">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-[var(--color-brand)]">
                Terms
              </Link>
            </nav>
          </div>
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Studio"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center">
          {primaryMobile.map((item) => (
            <li key={item.href} className="flex justify-center">
              <BottomLink item={item} active={item.href === current} />
            </li>
          ))}
          {primaryMobile.length < 2
            ? Array.from({ length: 2 - primaryMobile.length }, (_, index) => <li key={`pad-${index}`} />)
            : null}
          <li className="flex justify-center">
            {quickActions.length > 0 ? (
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="-mt-7 flex flex-col items-center gap-1 text-[11px] font-semibold text-[var(--color-brand)]"
              >
                <span className="grid size-14 place-items-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_8px_24px_rgba(92,39,71,0.35)] ring-4 ring-[var(--color-page)]">
                  <Plus aria-hidden="true" className="size-6" />
                </span>
                New
              </button>
            ) : null}
          </li>
          <li className="flex justify-center">
            {clientsItem ? <BottomLink item={clientsItem} active={clientsItem.href === current} /> : null}
          </li>
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold ${
                moreItems.some((item) => item.href === current)
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              <Ellipsis aria-hidden="true" className="size-6" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <StudioDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Create"
        description="Quick actions for your business."
        size="sm"
      >
        <ul className="grid *:min-w-0 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.key}>
                <button
                  type="button"
                  onClick={() => runAction(action)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-left hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                      {action.label}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {action.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </StudioDialog>

      <StudioDialog open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <ul className="grid *:min-w-0 grid-cols-3 gap-2">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === current;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center text-xs font-semibold ${
                    active
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 grid gap-2 border-t border-[var(--color-border)] pt-4">
          <Link
            href="/account"
            onClick={() => setMoreOpen(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
          >
            <CircleUserRound aria-hidden="true" className="size-5" />
            Your account
          </Link>
          <SignOutButton />
        </div>
      </StudioDialog>

      {blockType ? (
        <BlockTimeDialog open onClose={() => setBlockType(null)} initialType={blockType} />
      ) : null}
    </div>
  );
}

function BottomLink({ item, active }: { item: StudioNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold ${
        active ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"
      }`}
    >
      <Icon aria-hidden="true" className="size-6" />
      {item.label}
    </Link>
  );
}

function AccountMenu() {
  const studio = useStudio();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const name = `${studio.user.firstName} ${studio.user.lastName}`.trim();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full p-0.5 hover:bg-[var(--color-brand-soft)]"
      >
        <Avatar name={name} size="sm" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-12 right-0 z-50 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-soft)]"
        >
          <div className="border-b border-[var(--color-border)] px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{studio.user.email}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {ROLE_LABEL[studio.role]} at {studio.businessName}
            </p>
          </div>
          <Link
            role="menuitem"
            href="/account"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
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
      className={`flex w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] ${
        compact ? "min-h-10" : "min-h-11 gap-3"
      }`}
    >
      {signingOut ? (
        <X aria-hidden="true" className="size-4 animate-pulse" />
      ) : (
        <LogOut aria-hidden="true" className={compact ? "size-4" : "size-5"} />
      )}
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
