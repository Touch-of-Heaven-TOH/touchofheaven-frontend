"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { Icon, type IconName } from "@/components/app/Icon";
import { browserApiFetch } from "@/lib/api/browser";
import type { SafeUser } from "@/types/auth";

type NavKey = "home" | "marketplace" | "businesses" | "studio" | "messages" | "bookings" | "profile";

type NavItem = { key: NavKey; label: string; href: string; icon: IconName };

const SIDEBAR: NavItem[] = [
  { key: "home", label: "Home", href: "/", icon: "home" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", icon: "store" },
  { key: "businesses", label: "Businesses", href: "/businesses", icon: "pin" },
  { key: "studio", label: "AI Studio", href: "/ai-studio", icon: "spark" },
  { key: "messages", label: "Messages", href: "/messages", icon: "chat" },
  { key: "bookings", label: "Bookings", href: "/bookings", icon: "cal" },
  { key: "profile", label: "Profile", href: "/account", icon: "user" },
];

// Kami's fixed decision: exactly these five, no Explore tab.
const TABS: NavItem[] = [
  { key: "home", label: "Home", href: "/", icon: "home" },
  { key: "messages", label: "Messages", href: "/messages", icon: "chat" },
  { key: "studio", label: "AI Studio", href: "/ai-studio", icon: "spark" },
  { key: "bookings", label: "Bookings", href: "/bookings", icon: "cal" },
  { key: "profile", label: "Profile", href: "/account", icon: "user" },
];

/** Which section a path belongs to. Marketplace and Businesses live under Home on phones. */
export function sectionFor(pathname: string): NavKey {
  const starts = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  if (starts("/marketplace") || starts("/cart") || starts("/checkout")) return "marketplace";
  if (starts("/businesses")) return "businesses";
  if (starts("/ai-studio")) return "studio";
  if (starts("/messages")) return "messages";
  if (starts("/bookings") || starts("/orders")) return "bookings";
  if (
    starts("/account") ||
    starts("/disputes") ||
    starts("/support") ||
    starts("/professional-application") ||
    starts("/team-invitations")
  )
    return "profile";
  return "home";
}

/** Booking and checkout take the whole screen, the way the design has them. */
function isFocusRoute(pathname: string) {
  return /^\/businesses\/[^/]+\/book(\/|$)/.test(pathname) || pathname.startsWith("/checkout");
}

type ConversationSummary = { unreadCount?: number };

function useUnreadMessages(signedIn: boolean) {
  const { data } = useSWR(
    signedIn ? "/api/v1/messaging/conversations" : null,
    (path: string) => browserApiFetch<{ conversations: ConversationSummary[] }>(path),
    { refreshInterval: 60_000, revalidateOnFocus: true, shouldRetryOnError: false },
  );
  return data?.conversations.filter((conversation) => (conversation.unreadCount ?? 0) > 0).length ?? 0;
}

function useCredits(signedIn: boolean) {
  const { data } = useSWR(
    signedIn ? "/api/v1/studio/credits" : null,
    (path: string) => browserApiFetch<{ balance: number }>(path),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  return data?.balance ?? null;
}

export function Crown({ size = 28 }: { size?: number }) {
  return <Icon name="crown" size={size} className="toh-crown" />;
}

export function AppShell({ user, children }: { user: SafeUser | null; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const section = sectionFor(pathname);
  const focus = isFocusRoute(pathname);
  const unread = useUnreadMessages(Boolean(user));
  const credits = useCredits(Boolean(user));
  const isBusiness = Boolean(user?.roles.includes("BRAIDER"));
  // On phones Marketplace and Businesses are panes of Home, so Home stays lit.
  const tabSection = section === "marketplace" || section === "businesses" ? "home" : section;

  return (
    <div className={`toh toh-shell${focus ? " toh-shell--focus" : ""}${section === "studio" ? " toh-shell--studio" : ""}`}>
      {focus ? null : (
        <aside className="toh-side" aria-label="Main">
          <Link href="/" className="toh-logo" aria-label="Touch of Heaven home">
            <Crown />
            <span className="toh-logo__words">
              <b>Touch of Heaven</b>
              <small>Beauty · AI · You</small>
            </span>
          </Link>
          <nav className="toh-side__nav">
            {SIDEBAR.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`toh-nav${section === item.key ? " is-on" : ""}`}
                aria-current={section === item.key ? "page" : undefined}
                title={item.label}
              >
                <Icon name={item.icon} size={20} />
                <span className="toh-nav__label">{item.label}</span>
                {item.key === "messages" && unread ? <span className="toh-badge">{unread}</span> : null}
              </Link>
            ))}
          </nav>
          <p className="toh-side__label">For businesses</p>
          <Link
            href={isBusiness ? "/studio" : "/business/sign-up?callbackUrl=%2Fprofessional-application"}
            className="toh-nav"
            title={isBusiness ? "Business dashboard" : "List your business"}
          >
            <Icon name="chart" size={20} />
            <span className="toh-nav__label">{isBusiness ? "Business dashboard" : "List your business"}</span>
          </Link>
          <div className="toh-side__grow" />
          {user ? (
            <Link href="/ai-studio" className="toh-credits-card">
              <small>AI Studio credits</small>
              <span className="toh-credits-card__row">
                <span className="toh-coin" aria-hidden="true">
                  ✦
                </span>
                <span className="toh-credits-card__amount">{credits ?? "–"}</span>
                <span className="toh-credits-card__plus" aria-hidden="true">
                  <Icon name="plus" size={16} />
                </span>
              </span>
            </Link>
          ) : (
            <Link href={`/customer/sign-in?callbackUrl=${encodeURIComponent(pathname)}`} className="toh-btn toh-btn--block">
              <Icon name="user" size={18} />
              <span className="toh-nav__label">Sign in</span>
            </Link>
          )}
        </aside>
      )}

      <div className="toh-main">{children}</div>

      {focus ? null : (
        <nav className="toh-tabbar" aria-label="Main">
          {TABS.map((item) =>
            item.key === "studio" ? (
              <Link
                key={item.key}
                href={item.href}
                className={`toh-tab toh-tab--ai${tabSection === item.key ? " is-on" : ""}`}
                aria-current={tabSection === item.key ? "page" : undefined}
              >
                <span className="toh-tab__orb">
                  <Icon name={item.icon} size={24} />
                </span>
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className={`toh-tab${tabSection === item.key ? " is-on" : ""}`}
                aria-current={tabSection === item.key ? "page" : undefined}
              >
                <Icon name={item.icon} size={23} />
                {item.label}
                {item.key === "messages" && unread ? <span className="toh-badge">{unread}</span> : null}
              </Link>
            ),
          )}
        </nav>
      )}
    </div>
  );
}
