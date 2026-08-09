import type { TohRole } from "@/types/auth";

export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
  roles?: TohRole[];
};

export const publicNavigation: NavigationItem[] = [
  { label: "Braiders", href: "/braiders" },
  { label: "Map", href: "/map" },
  { label: "Services", href: "/beauty" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
];

export const accountNavigation: NavigationItem[] = [
  { label: "Overview", href: "/account" },
  { label: "Appointments", href: "/account/appointments" },
  { label: "Support", href: "/support" },
  { label: "Apply", href: "/professional-application" },
  { label: "Profile", href: "/account/settings/profile" },
  { label: "Security", href: "/account/settings/security" },
  { label: "Privacy", href: "/account/settings/privacy" },
];

export const bookingNavigation: NavigationItem[] = [
  { label: "Service", href: "/book" },
  { label: "Time", href: "/book/sample-braider" },
  { label: "Consultation", href: "/book/sample-braider/consultation" },
  { label: "Review", href: "/book/sample-braider/review" },
  { label: "Payment", href: "/book/sample-braider/payment" },
];

export const studioNavigation: NavigationItem[] = [
  { label: "Today", href: "/studio" },
  { label: "Calendar", href: "/studio/calendar" },
  { label: "Appointments", href: "/studio/appointments" },
  { label: "Services", href: "/studio/services" },
  { label: "Portfolio", href: "/studio/portfolio" },
  { label: "Earnings", href: "/studio/earnings" },
  { label: "Settings", href: "/studio/settings" },
];

export const adminNavigation: NavigationItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Applications", href: "/admin/applications" },
  { label: "Braiders", href: "/admin/braiders" },
  { label: "Appointments", href: "/admin/appointments" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Support", href: "/admin/support" },
  { label: "Policies", href: "/admin/policies" },
  { label: "Audit", href: "/admin/audit" },
  { label: "System", href: "/admin/system" },
];

export function roleAwareNavigation(roles: TohRole[]): NavigationItem[] {
  const items: NavigationItem[] = [{ label: "Account", href: "/account" }];

  if (roles.includes("BRAIDER")) {
    items.push({ label: "Studio", href: "/studio", roles: ["BRAIDER"] });
  }

  if (roles.includes("ADMIN")) {
    items.push({ label: "Admin", href: "/admin", roles: ["ADMIN"] });
  }

  return items;
}
