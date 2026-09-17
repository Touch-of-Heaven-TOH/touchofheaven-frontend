import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Clock,
  History,
  Hourglass,
  House,
  Images,
  Inbox,
  LifeBuoy,
  Scissors,
  Settings,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { BusinessContext, BusinessModule } from "@/features/studio/lib/types";

export type StudioNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** null = available to everyone in the business (Settings, Help). */
  module: BusinessModule | null;
  /** Pages still backed by owner-only endpoints. */
  ownerOnly?: boolean;
};

/** Desktop sidebar, in the order of the design. */
export const SIDEBAR_ITEMS: StudioNavItem[] = [
  { label: "Overview", href: "/studio", icon: House, module: "overview" },
  { label: "Calendar", href: "/studio/calendar", icon: CalendarDays, module: "calendar" },
  { label: "Bookings", href: "/studio/appointments", icon: ClipboardList, module: "appointments" },
  { label: "Clients", href: "/studio/clients", icon: Users, module: "clients" },
  { label: "Waitlist", href: "/studio/waitlist", icon: Hourglass, module: "waitlist" },
  { label: "Services", href: "/studio/services", icon: Scissors, module: "services", ownerOnly: true },
  {
    label: "Availability",
    href: "/studio/settings/availability",
    icon: Clock,
    module: "availability",
    ownerOnly: true,
  },
  { label: "Team", href: "/studio/team", icon: UsersRound, module: "team" },
  { label: "Earnings", href: "/studio/earnings", icon: Wallet, module: "earnings" },
  { label: "Portfolio", href: "/studio/portfolio", icon: Images, module: "portfolio" },
  { label: "Analytics", href: "/studio/analytics", icon: ChartColumn, module: "analytics" },
];

export const SETTINGS_ITEM: StudioNavItem = {
  label: "Settings",
  href: "/studio/settings",
  icon: Settings,
  module: null,
};

export const HELP_ITEM: StudioNavItem = {
  label: "Help & support",
  href: "/studio/help",
  icon: LifeBuoy,
  module: null,
};

/** Mobile "More" sheet: everything that does not fit the five-item bar. */
export const MORE_ITEMS: StudioNavItem[] = [
  { label: "Bookings", href: "/studio/appointments", icon: ClipboardList, module: "appointments" },
  {
    label: "Booking requests",
    href: "/studio/appointments/requests",
    icon: Inbox,
    module: "appointments",
  },
  { label: "Booking history", href: "/studio/appointments/history", icon: History, module: "appointments" },
  { label: "Waitlist", href: "/studio/waitlist", icon: Hourglass, module: "waitlist" },
  { label: "Services", href: "/studio/services", icon: Scissors, module: "services", ownerOnly: true },
  {
    label: "Availability",
    href: "/studio/settings/availability",
    icon: Clock,
    module: "availability",
    ownerOnly: true,
  },
  { label: "Team", href: "/studio/team", icon: UsersRound, module: "team" },
  { label: "Earnings", href: "/studio/earnings", icon: Wallet, module: "earnings" },
  { label: "Portfolio", href: "/studio/portfolio", icon: Images, module: "portfolio" },
  { label: "Analytics", href: "/studio/analytics", icon: ChartColumn, module: "analytics" },
  SETTINGS_ITEM,
  HELP_ITEM,
];

export function canSee(
  item: StudioNavItem,
  context: Pick<BusinessContext, "isOwner" | "permissions">,
) {
  if (item.ownerOnly && !context.isOwner) return false;
  return item.module === null || context.permissions[item.module] !== "none";
}

/** The nav item for the current path: longest matching href wins, and
 * Overview only matches /studio exactly. Query strings are ignored. */
export function activeHref(items: StudioNavItem[], pathname: string): string | null {
  const matches = items.filter((item) => {
    const href = item.href.split("?")[0]!;
    return href === "/studio"
      ? pathname === "/studio"
      : pathname === href || pathname.startsWith(`${href}/`);
  });
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

export const ROLE_LABEL: Record<BusinessContext["role"], string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
  RECEPTIONIST: "Receptionist",
};
