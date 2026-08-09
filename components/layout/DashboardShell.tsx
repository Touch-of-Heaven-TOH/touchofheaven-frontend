import Link from "next/link";
import type { NavigationItem } from "@/config/navigation";
import type { SafeUser } from "@/types/auth";

export type DashboardShellProps = {
  title: string;
  eyebrow: string;
  user: SafeUser;
  navigation: NavigationItem[];
  tone: "account" | "studio" | "admin" | "booking";
  /** From the layout's own x-toh-pathname header read (see proxy.ts) -
   * drives which nav item renders as active. */
  currentPath: string;
  children: React.ReactNode;
};

const toneClassName: Record<DashboardShellProps["tone"], string> = {
  account: "bg-[var(--color-page)]",
  booking: "bg-[var(--color-page)]",
  studio: "bg-[#f6fbfa]",
  admin: "bg-[#f8f9fb]",
};

// account/booking keep the light, shared chrome. studio and admin get a
// deliberately distinct sidebar treatment - not just a different shade of
// near-white - so a developer who accidentally renders one context's
// component inside another notices immediately, per
// docs/file-structure-routing-security.md's "Route Groups" section.
const sidebarToneClassName: Record<DashboardShellProps["tone"], string> = {
  account: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
  booking: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
  studio: "bg-[#2d1b4e] text-white",
  admin: "bg-[#15111f] text-white",
};

const navLinkToneClassName: Record<
  DashboardShellProps["tone"],
  { active: string; inactive: string }
> = {
  account: {
    active: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    inactive:
      "text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]",
  },
  booking: {
    active: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    inactive:
      "text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]",
  },
  studio: {
    active: "bg-white/10 text-[#f0b93a]",
    inactive: "text-white/70 hover:bg-white/10 hover:text-[#f0b93a]",
  },
  admin: {
    active: "bg-white/10 text-white",
    inactive: "text-white/60 hover:bg-white/10 hover:text-white",
  },
};

/** The single nav item that best matches the current path, picked by
 * longest matching href so a parent section (e.g. /account) never shows
 * as active alongside a more specific child (e.g. /account/settings/profile)
 * that also matches by prefix. */
function activeNavigationItem(
  navigation: NavigationItem[],
  currentPath: string,
): NavigationItem | null {
  const matches = navigation.filter(
    (item) => currentPath === item.href || currentPath.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((longest, item) =>
    item.href.length > longest.href.length ? item : longest,
  );
}

export function DashboardShell({
  title,
  eyebrow,
  user,
  navigation,
  tone,
  currentPath,
  children,
}: DashboardShellProps) {
  const activeItem = activeNavigationItem(navigation, currentPath);
  const linkTone = navLinkToneClassName[tone];
  const isDarkSidebar = tone === "studio" || tone === "admin";

  return (
    <div className={`min-h-dvh ${toneClassName[tone]}`}>
      <div className="grid min-h-dvh md:grid-cols-[248px_1fr]">
        <aside
          className={`flex flex-col border-b px-4 py-4 md:border-r md:border-b-0 ${
            isDarkSidebar ? "border-white/10" : "border-[var(--color-border)]"
          } ${sidebarToneClassName[tone]}`}
        >
          <Link
            className={`flex items-center gap-3 font-semibold ${
              isDarkSidebar ? "text-white" : "text-[var(--color-text-primary)]"
            }`}
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-md bg-[var(--color-brand)] text-sm font-bold text-[var(--color-gold-light)]">
              TOH
            </span>
            Touch of Heaven
          </Link>

          {tone === "admin" ? (
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-xs font-bold tracking-wide text-red-200 uppercase">
              Admin mode
            </span>
          ) : null}

          <nav className="mt-8 flex flex-1 gap-2 overflow-x-auto md:grid md:content-start md:overflow-visible">
            {navigation.map((item) => {
              const isActive = item === activeItem;
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive ? linkTone.active : linkTone.inactive
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {tone === "studio" ? (
            <div className="mt-4 rounded-lg bg-white/10 p-3">
              <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
                Earnings
              </p>
              <p className="mt-1 text-lg font-semibold text-[#f0b93a]">
                See Earnings page
              </p>
            </div>
          ) : null}
        </aside>
        <main className="min-w-0">
          <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex flex-col gap-2 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h1>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </header>
          <div className="px-5 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
