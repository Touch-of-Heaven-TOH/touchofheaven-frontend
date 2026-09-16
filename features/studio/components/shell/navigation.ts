import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Clock,
  House,
  Hourglass,
  Landmark,
  Scissors,
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
  module: BusinessModule;
  /** Pages backed by owner-only endpoints (services, availability, payouts
   * still resolve the business from the signed-in user's own profile). */
  ownerOnly?: boolean;
};

export type StudioNavGroup = { label: string; items: StudioNavItem[] };

export const STUDIO_NAV_GROUPS: StudioNavGroup[] = [
  {
    label: "Run the day",
    items: [
      { label: "Home", href: "/studio", icon: House, module: "overview" },
      { label: "Calendar", href: "/studio/calendar", icon: CalendarDays, module: "calendar" },
      { label: "Appointments", href: "/studio/appointments", icon: ClipboardList, module: "appointments" },
      { label: "Clients", href: "/studio/clients", icon: Users, module: "clients" },
      { label: "Waitlist", href: "/studio/waitlist", icon: Hourglass, module: "waitlist" },
    ],
  },
  {
    label: "Your offer",
    items: [
      { label: "Services", href: "/studio/services", icon: Scissors, module: "services", ownerOnly: true },
      {
        label: "Availability",
        href: "/studio/settings/availability",
        icon: Clock,
        module: "availability",
        ownerOnly: true,
      },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Analytics", href: "/studio/analytics", icon: ChartColumn, module: "analytics" },
      { label: "Earnings", href: "/studio/earnings", icon: Wallet, module: "earnings" },
      {
        label: "Payouts",
        href: "/studio/settings/payouts",
        icon: Landmark,
        module: "earnings",
        ownerOnly: true,
      },
      { label: "Team", href: "/studio/team", icon: UsersRound, module: "team" },
    ],
  },
];

export function visibleNavGroups(
  context: Pick<BusinessContext, "isOwner" | "permissions">,
): StudioNavGroup[] {
  return STUDIO_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        context.permissions[item.module] !== "none" && (!item.ownerOnly || context.isOwner),
    ),
  })).filter((group) => group.items.length > 0);
}

/** The single nav item for the current path - longest matching href wins,
 * and Home only matches /studio exactly. */
export function activeHref(items: StudioNavItem[], pathname: string): string | null {
  const matches = items.filter((item) =>
    item.href === "/studio"
      ? pathname === "/studio"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

export const ROLE_LABEL: Record<BusinessContext["role"], string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
  RECEPTIONIST: "Receptionist",
};
