import type { TohRole } from "@/types/auth";

export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
  roles?: TohRole[];
};

export const publicNavigation: NavigationItem[] = [
  { label: "Beauty", href: "/beauty" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Businesses", href: "/businesses" },
  { label: "AI Studio", href: "/ai-studio" },
  { label: "About", href: "/about" },
  {
    label: "For Businesses",
    href: "/business/sign-up?callbackUrl=%2Fprofessional-application",
  },
];

export const accountNavigation: NavigationItem[] = [
  { label: "Overview", href: "/account" },
  { label: "Appointments", href: "/bookings" },
  { label: "Messages", href: "/messages" },
  { label: "My Disputes", href: "/disputes" },
  { label: "Support", href: "/support" },
  { label: "Apply", href: "/professional-application" },
  { label: "Profile", href: "/account/settings/profile" },
  { label: "Beauty profile", href: "/account/settings/beauty-profile" },
  { label: "Addresses", href: "/account/settings/addresses" },
  { label: "Payment methods", href: "/account/settings/payment-methods" },
  { label: "Notifications", href: "/account/settings/notifications" },
  { label: "Security", href: "/account/settings/security" },
  { label: "Privacy", href: "/account/settings/privacy" },
  { label: "Delete account", href: "/account/settings/danger" },
];

export const bookingNavigation: NavigationItem[] = [
  { label: "Service", href: "/book" },
  { label: "Time", href: "/book/sample-business" },
  { label: "Consultation", href: "/book/sample-business/consultation" },
  { label: "Review", href: "/book/sample-business/review" },
  { label: "Payment", href: "/book/sample-business/payment" },
];

export const studioNavigation: NavigationItem[] = [
  { label: "Today", href: "/studio" },
  { label: "Calendar", href: "/studio/calendar" },
  { label: "Appointments", href: "/studio/appointments" },
  { label: "Clients", href: "/studio/clients" },
  { label: "Services", href: "/studio/services" },
  { label: "Portfolio", href: "/studio/portfolio" },
  { label: "Messages", href: "/studio/messages" },
  { label: "Earnings", href: "/studio/earnings" },
  { label: "Profile", href: "/studio/settings/profile" },
  { label: "Location", href: "/studio/settings/location" },
  { label: "Availability", href: "/studio/settings/availability" },
  { label: "Payouts", href: "/studio/settings/payouts" },
  { label: "Policies", href: "/studio/settings/policies" },
  { label: "Notifications", href: "/studio/settings/notifications" },
];

export const adminNavigation: NavigationItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Applications", href: "/admin/applications" },
  { label: "Businesses", href: "/admin/businesses" },
  { label: "Appointments", href: "/admin/appointments" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Payouts", href: "/admin/payouts" },
  { label: "Support", href: "/admin/support" },
  { label: "Disputes", href: "/admin/disputes" },
  { label: "Moderation", href: "/admin/moderation" },
  { label: "Policies", href: "/admin/policies" },
  { label: "Audit", href: "/admin/audit" },
  { label: "System", href: "/admin/system" },
  { label: "Settings", href: "/admin/settings" },
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
