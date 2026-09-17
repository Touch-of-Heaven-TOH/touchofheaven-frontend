import type { PreviewPersona } from "@/lib/dev/preview-access";

/**
 * Every page in the app and how far it is built, for the development hub at
 * /dev. Kept by hand: update it when a page is connected or added.
 *
 * - connected:   reads and writes real data through the backend
 * - partial:     real data for part of the page; the rest is missing or demo
 * - demo:        looks finished but shows hard-coded sample data
 * - placeholder: a description of the page only, nothing to do yet
 * - soon:        a designed "Coming soon" page
 * - static:      information page, no data needed
 * - preview:     a design preview copy of another page
 */
export type PageStatus = "connected" | "partial" | "demo" | "placeholder" | "soon" | "static" | "preview";

export type CatalogPage = {
  label: string;
  path: string;
  /** Who to sign in as before opening; omitted for public pages. */
  as?: PreviewPersona;
  status: PageStatus;
  note?: string;
};

export type CatalogSection = { title: string; description: string; pages: CatalogPage[] };

// Demo records in the local database (created by the Studio demo seed).
const APPOINTMENT = {
  upcoming: "382474a4-b4b6-4db1-acea-4d216d32cd6e",
  rescheduleRequest: "e21c2fb4-82de-49a7-a1bf-df78f6a63515",
  cancellationRequest: "2536b4de-c4bd-45bb-8689-4dc09feb1dd2",
  businessCancel: "33bf0233-f314-4cce-b335-0370c77f443c",
  inService: "413c3405-4bf7-446e-b719-ef144404afa9",
  completed: "be8a53ae-e170-4f21-85a3-eb721f1616f6",
  refunded: "0e543254-b219-47e1-b8b0-77d806d9d759",
  noShow: "8815bdb7-4acc-4108-9c60-34a9537f86e6",
};
const BUSINESS_ID = "d56cc0e0-faf2-4d11-b1be-7a0f2bbab841";
const CLIENT_ID = "1229ba4e-f456-4fc7-bad9-1281cf2d2d49";
const SERVICE_ID = "2ffa5ff7-b281-413d-8753-a7cd60b26808";

export const pageCatalog: CatalogSection[] = [
  {
    title: "Business Studio",
    description: "Opens as the demo business owner, Amara Hair Studio.",
    pages: [
      { label: "Overview", path: "/studio", as: "owner", status: "connected" },
      { label: "Calendar", path: "/studio/calendar", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Bookings", path: "/studio/appointments", as: "owner", status: "connected" },
      { label: "Booking requests", path: "/studio/appointments/requests", as: "owner", status: "connected" },
      { label: "Booking history", path: "/studio/appointments/history", as: "owner", status: "connected" },
      { label: "Appointment details", path: `/studio/appointments/${APPOINTMENT.upcoming}`, as: "owner", status: "connected" },
      { label: "Check in client", path: `/studio/appointments/${APPOINTMENT.upcoming}/check-in`, as: "owner", status: "connected" },
      { label: "Reschedule request", path: `/studio/appointments/${APPOINTMENT.rescheduleRequest}/reschedule`, as: "owner", status: "connected" },
      { label: "Cancellation request", path: `/studio/appointments/${APPOINTMENT.cancellationRequest}/cancel`, as: "owner", status: "connected" },
      { label: "Cancel as the business", path: `/studio/appointments/${APPOINTMENT.businessCancel}/cancel`, as: "owner", status: "connected" },
      { label: "Complete appointment", path: `/studio/appointments/${APPOINTMENT.inService}/complete`, as: "owner", status: "connected" },
      { label: "Receipt", path: `/studio/appointments/${APPOINTMENT.completed}/complete`, as: "owner", status: "connected" },
      { label: "Refund", path: `/studio/appointments/${APPOINTMENT.refunded}/refund`, as: "owner", status: "connected" },
      { label: "No-show", path: `/studio/appointments/${APPOINTMENT.noShow}/no-show`, as: "owner", status: "connected" },
      { label: "Clients", path: "/studio/clients", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Client profile", path: `/studio/clients/${CLIENT_ID}`, as: "owner", status: "connected" },
      { label: "Services", path: "/studio/services", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "New service", path: "/studio/services/new", as: "owner", status: "connected" },
      { label: "Edit service", path: `/studio/services/${SERVICE_ID}`, as: "owner", status: "connected" },
      { label: "Availability", path: "/studio/settings/availability", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Team", path: "/studio/team", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Waitlist", path: "/studio/waitlist", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Earnings", path: "/studio/earnings", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Analytics", path: "/studio/analytics", as: "owner", status: "connected", note: "Layout not yet redesigned to the mockup" },
      { label: "Payouts", path: "/studio/settings/payouts", as: "owner", status: "connected" },
      { label: "Messages", path: "/studio/messages", as: "owner", status: "connected" },
      { label: "Settings", path: "/studio/settings", as: "owner", status: "static", note: "Links to the settings pages" },
      { label: "Help", path: "/studio/help", as: "owner", status: "static" },
      { label: "Portfolio", path: "/studio/portfolio", as: "owner", status: "soon" },
      { label: "Business profile settings", path: "/studio/settings/profile", as: "owner", status: "soon" },
      { label: "Location settings", path: "/studio/settings/location", as: "owner", status: "soon" },
      { label: "Notification settings", path: "/studio/settings/notifications", as: "owner", status: "soon" },
      { label: "Policy settings", path: "/studio/settings/policies", as: "owner", status: "soon" },
    ],
  },
  {
    title: "Client pages",
    description: "Opens as the demo client, Nadia Fotso.",
    pages: [
      { label: "My bookings", path: "/bookings", as: "customer", status: "connected" },
      {
        label: "Appointment details",
        path: "/bookings/382474a4-b4b6-4db1-acea-4d216d32cd6e",
        as: "customer",
        status: "connected",
        note: "Check-in code, and asking to cancel or move the booking",
      },
      { label: "Book Amara Hair Studio (live)", path: `/book/${BUSINESS_ID}`, as: "customer", status: "connected", note: "Payment is simulated" },
      { label: "Client onboarding", path: "/client-onboarding", as: "customer", status: "connected" },
      { label: "Messages", path: "/messages", as: "customer", status: "connected" },
      { label: "Disputes", path: "/disputes", as: "customer", status: "connected" },
      { label: "File a dispute", path: "/disputes/new", as: "customer", status: "connected", note: "Evidence upload needs file storage keys" },
      { label: "Addresses", path: "/account/settings/addresses", as: "customer", status: "connected" },
      { label: "Notification preferences", path: "/account/settings/notifications", as: "customer", status: "connected" },
      { label: "Security and sessions", path: "/account/settings/security", as: "customer", status: "connected" },
      { label: "Team invitations", path: "/team-invitations", as: "customer", status: "connected" },
      { label: "Business application (old form)", path: "/professional-application", as: "customer", status: "connected", note: "Duplicate of the setup wizard" },
      { label: "Account overview", path: "/account", as: "customer", status: "placeholder" },
      { label: "Account appointments", path: "/account/appointments", as: "customer", status: "placeholder", note: "Use My bookings" },
      { label: "Profile", path: "/account/settings/profile", as: "customer", status: "placeholder" },
      { label: "Beauty profile", path: "/account/settings/beauty-profile", as: "customer", status: "placeholder" },
      { label: "Payment methods", path: "/account/settings/payment-methods", as: "customer", status: "placeholder" },
      { label: "Privacy", path: "/account/settings/privacy", as: "customer", status: "placeholder" },
      { label: "Delete account", path: "/account/settings/danger", as: "customer", status: "placeholder", note: "Button disabled" },
      { label: "Support", path: "/support", as: "customer", status: "placeholder" },
    ],
  },
  {
    title: "Business onboarding",
    description: "Opens as the demo business owner.",
    pages: [
      { label: "Business setup wizard", path: "/business/setup", as: "owner", status: "connected", note: "Uploads need file storage keys" },
      { label: "Application status", path: "/business/setup/status", as: "owner", status: "connected" },
    ],
  },
  {
    title: "Sign-in and sign-up",
    description: "Public. Emails arrive at http://localhost:8025.",
    pages: [
      { label: "Client sign in", path: "/customer/sign-in", status: "connected" },
      { label: "Client sign up", path: "/customer/sign-up", status: "connected" },
      { label: "Client verify email", path: "/customer/verify-email", status: "connected" },
      { label: "Client forgot password", path: "/customer/forgot-password", status: "connected" },
      { label: "Business sign in", path: "/business/sign-in", status: "connected" },
      { label: "Business sign up", path: "/business/sign-up", status: "connected" },
      { label: "Business verify email", path: "/business/verify-email", status: "connected" },
      { label: "Business forgot password", path: "/business/forgot-password", status: "connected" },
      { label: "Verify email (generic)", path: "/verify-email", status: "connected", note: "Duplicate of the two above" },
    ],
  },
  {
    title: "Public pages",
    description: "No sign-in needed.",
    pages: [
      { label: "Home", path: "/", status: "connected", note: "Featured businesses, activity and products from the backend" },
      { label: "AI Studio", path: "/ai-studio", status: "partial", note: "Photo upload needs file storage keys" },
      { label: "Explore", path: "/explore", status: "demo" },
      { label: "Search results", path: "/explore/search", status: "demo" },
      { label: "Search filters", path: "/explore/filters", status: "demo", note: "Same page as Search results" },
      { label: "Map", path: "/explore/map", status: "demo" },
      { label: "Businesses", path: "/businesses", status: "demo", note: "Same page as Search results" },
      { label: "Map (short link)", path: "/map", status: "demo", note: "Same page as Map" },
      { label: "Business profile", path: "/businesses/amara-braids-beauty", status: "demo" },
      { label: "Business services", path: "/businesses/amara-braids-beauty/services", status: "demo" },
      { label: "Service details", path: "/businesses/amara-braids-beauty/services/box-braids", status: "demo" },
      { label: "Business portfolio", path: "/businesses/amara-braids-beauty/portfolio", status: "demo" },
      { label: "Business reviews", path: "/businesses/amara-braids-beauty/reviews", status: "demo" },
      { label: "Business credentials", path: "/businesses/amara-braids-beauty/credentials", status: "demo" },
      { label: "Direct booking page", path: "/book-with/amara-braids-beauty", status: "demo", note: "Duplicate of Business profile" },
      { label: "About", path: "/about", status: "static" },
      { label: "How it works", path: "/how-it-works", status: "static" },
      { label: "For clients", path: "/for-clients", status: "static" },
      { label: "Beauty", path: "/beauty", status: "static" },
      { label: "Marketplace", path: "/marketplace", status: "static", note: "Shop backend exists but isn't connected" },
      { label: "Style quiz", path: "/style-quiz", status: "static" },
      { label: "Contact", path: "/contact", status: "static" },
      { label: "Legal", path: "/legal", status: "static" },
      { label: "Privacy policy", path: "/legal/privacy", status: "static" },
    ],
  },
  {
    title: "Admin",
    description: "Opens as the demo admin. The console shows made-up numbers.",
    pages: [
      { label: "Admin overview", path: "/admin", as: "admin", status: "demo" },
      { label: "Bookings", path: "/admin/bookings", as: "admin", status: "demo" },
      { label: "Businesses (console)", path: "/admin/braiders", as: "admin", status: "demo" },
      { label: "Clients", path: "/admin/clients", as: "admin", status: "demo" },
      { label: "Marketplace", path: "/admin/marketplace", as: "admin", status: "demo" },
      { label: "Orders", path: "/admin/orders", as: "admin", status: "demo" },
      { label: "Products", path: "/admin/products", as: "admin", status: "demo" },
      { label: "Finance", path: "/admin/finance", as: "admin", status: "demo" },
      { label: "Marketing", path: "/admin/marketing", as: "admin", status: "demo" },
      { label: "Reports", path: "/admin/reports", as: "admin", status: "demo" },
      { label: "Reviews", path: "/admin/reviews", as: "admin", status: "demo" },
      { label: "Team", path: "/admin/team", as: "admin", status: "demo" },
      { label: "Applications", path: "/admin/applications", as: "admin", status: "placeholder", note: "Backend review endpoints exist" },
      { label: "Businesses", path: "/admin/businesses", as: "admin", status: "placeholder", note: "Duplicate of Businesses (console)" },
      { label: "Appointments", path: "/admin/appointments", as: "admin", status: "placeholder", note: "Duplicate of Bookings" },
      { label: "Users", path: "/admin/users", as: "admin", status: "placeholder" },
      { label: "Payments", path: "/admin/payments", as: "admin", status: "placeholder" },
      { label: "Payouts", path: "/admin/payouts", as: "admin", status: "placeholder" },
      { label: "Disputes", path: "/admin/disputes", as: "admin", status: "placeholder" },
      { label: "Moderation", path: "/admin/moderation", as: "admin", status: "placeholder" },
      { label: "Support", path: "/admin/support", as: "admin", status: "placeholder" },
      { label: "Policies", path: "/admin/policies", as: "admin", status: "placeholder" },
      { label: "Audit", path: "/admin/audit", as: "admin", status: "placeholder" },
      { label: "Settings", path: "/admin/settings", as: "admin", status: "placeholder" },
      { label: "System", path: "/admin/system", as: "admin", status: "placeholder" },
    ],
  },
  {
    title: "Design previews",
    description: "Copies of other pages for design review.",
    pages: [
      { label: "Discovery preview", path: "/preview/discovery", status: "preview" },
      { label: "Booking preview", path: "/preview/booking", status: "preview" },
      { label: "Booking confirmation preview", path: "/preview/booking-confirm", status: "preview" },
      { label: "Appointment preview", path: "/preview/appointment", status: "preview" },
      { label: "Client onboarding preview", path: "/preview/client-onboarding", status: "preview" },
    ],
  },
];
