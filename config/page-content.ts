import type { RouteContent } from "@/types/content";

export const bookingContent: Record<string, RouteContent> = {
  service: {
    eyebrow: "Booking",
    title: "Choose a service and professional.",
    description:
      "The first booking screen will combine service selection, public braider discovery, and eligibility checks from the backend.",
    primaryAction: "Search braiders",
    secondaryAction: "Need help?",
    endpoint: "/api/v1/services, /api/v1/braiders/nearby",
    statusItems: [
      "Loading: service and braider skeleton cards.",
      "Error: retry without leaking internal endpoint details.",
      "Access: requires a secure backend session before rendering.",
    ],
  },
  time: {
    eyebrow: "Booking",
    title: "Select an available appointment slot.",
    description:
      "Slot holds must come from the availability module. The frontend never trusts a stale calendar cell as proof a slot is still available.",
    primaryAction: "Continue",
    endpoint: "/api/v1/braiders/[braiderId]/availability/slots, /api/v1/availability/holds",
    statusItems: [
      "Loading: calendar skeleton and time-slot placeholders.",
      "Empty: no matching slots with a clear search adjustment.",
      "Error: expired hold or unavailable slot returns to selection.",
    ],
  },
  consultation: {
    eyebrow: "Booking",
    title: "Complete consultation requirements.",
    description:
      "Consultation details and media are private appointment data and must stay out of URLs, metadata, analytics, and static caches.",
    primaryAction: "Save consultation",
    endpoint: "/api/v1/bookings/[appointmentId]/consultation",
    statusItems: [
      "Private cache: no-store.",
      "Uploads: use backend-issued upload URLs only.",
      "Validation: field errors map from backend responses.",
    ],
  },
  review: {
    eyebrow: "Booking",
    title: "Review appointment details and policies.",
    description:
      "The summary screen confirms price, deposit, cancellation rules, consultation status, and current policy acceptance.",
    primaryAction: "Accept and continue",
    endpoint: "/api/v1/customer/policies, /api/v1/bookings",
    statusItems: [
      "Policy version shown before payment.",
      "No hidden role or price fields accepted from the browser.",
      "Backend creates the appointment only after validating the hold.",
    ],
  },
  payment: {
    eyebrow: "Booking",
    title: "Pay the deposit securely.",
    description:
      "Payment screens must use provider-hosted or approved payment elements. Raw card numbers never touch custom inputs.",
    primaryAction: "Pay deposit",
    endpoint: "/api/v1/payments/mobile-money, /api/v1/payments/[paymentId]",
    statusItems: [
      "Loading: payment intent and provider state.",
      "Error: recoverable provider failure with refresh action.",
      "Security: payment secrets remain server-side.",
    ],
  },
  confirmation: {
    eyebrow: "Booking",
    title: "Appointment confirmation.",
    description:
      "The confirmation screen summarizes the appointment and routes customers back to protected account management.",
    primaryAction: "View appointments",
    endpoint: "/api/v1/bookings/[appointmentId]",
    statusItems: [
      "Confirmation ID read from backend state, not trusted query text.",
      "Customer can manage, reschedule, cancel, or review when eligible.",
      "Braider receives the operational appointment view in Studio.",
    ],
  },
};

export const accountContent: Record<string, RouteContent> = {
  overview: {
    eyebrow: "Customer account",
    title: "Account overview.",
    description:
      "A private dashboard for upcoming appointments, support status, policy notices, and profile completion.",
    primaryAction: "Book another appointment",
    endpoint: "/api/v1/customer/account-summary",
    statusItems: [
      "No-store cache for all account data.",
      "Backend confirms session and account status on every request.",
      "Empty states explain next actions without exposing private records.",
    ],
  },
  appointments: {
    eyebrow: "Customer account",
    title: "Appointments.",
    description:
      "Customers can inspect upcoming, past, rescheduled, cancelled, and review-eligible appointments.",
    primaryAction: "Find a braider",
    endpoint: "/api/v1/bookings",
    statusItems: [
      "IDOR checks belong to the backend appointment endpoint.",
      "Loading skeletons keep private data out of partial HTML.",
      "Verified reviews unlock only after completed appointments.",
    ],
  },
  profile: {
    eyebrow: "Settings",
    title: "Profile settings.",
    description:
      "Customer profile updates use typed backend validation and never write directly to database records from the frontend.",
    primaryAction: "Save profile",
    endpoint: "/api/v1/customer/me",
    statusItems: [
      "Names, phone, timezone, and language map to backend schema.",
      "Avatar upload must use an approved media endpoint.",
      "Recent auth may be required for sensitive changes.",
    ],
  },
  beautyProfile: {
    eyebrow: "Settings",
    title: "Beauty profile.",
    description:
      "Hair length, texture, sensitivities, and style history help braiders prepare before a first appointment and speed up consultation.",
    primaryAction: "Save changes",
    endpoint: "/api/v1/customer/beauty-profile (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "No hair-health or allergy data is inferred without the customer entering it.",
      "Braiders only see this profile for their own upcoming appointments.",
      "Customers can clear their style history at any time.",
    ],
  },
  addresses: {
    eyebrow: "Settings",
    title: "Addresses.",
    description:
      "Saved shipping, billing, and mobile-service addresses, added and removed by the customer, each labeled by type.",
    primaryAction: "Save changes",
    endpoint: "/api/v1/customer/addresses (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "A mobile-service address is only shared with the assigned braider for that appointment.",
      "No address is exposed in a public profile or listing.",
      "Deleting an address never affects a completed appointment's historical record.",
    ],
  },
  paymentMethods: {
    eyebrow: "Settings",
    title: "Payment methods.",
    description:
      "Saved cards and bank accounts, managed through the payment provider's own hosted elements - this app never stores or transmits raw card numbers.",
    primaryAction: "Manage",
    endpoint: "/api/v1/customer/payment-methods (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "Card data is tokenized by the payment provider, never touched by this app's servers.",
      "Removing a saved method never cancels an appointment already paid for.",
      "A default method can be set for faster future deposits.",
    ],
  },
  notifications: {
    eyebrow: "Settings",
    title: "Notifications.",
    description:
      "Per-channel (email, SMS, push) and per-category (bookings, messages, marketing) toggles, defaulting to essential transactional notifications only.",
    primaryAction: "Save preferences",
    endpoint: "/api/v1/notifications/preferences (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "Essential booking and security notifications cannot be fully disabled.",
      "Marketing notifications default to off, not on.",
      "Preferences apply immediately to the next notification sent.",
    ],
  },
  security: {
    eyebrow: "Settings",
    title: "Password, MFA, and sessions.",
    description:
      "Security settings require backend proof of session freshness and rotate sessions after sensitive actions.",
    primaryAction: "Manage MFA",
    endpoint: "/api/v1/auth/mfa/*, /api/v1/auth/logout-all",
    statusItems: [
      "No token persistence in localStorage or sessionStorage.",
      "MFA setup, disable, and session revocation are backend authority.",
      "Errors avoid confirming unrelated account existence.",
    ],
  },
  privacy: {
    eyebrow: "Settings",
    title: "Privacy controls and consent history.",
    description:
      "Customers can review optional preferences, portfolio consent, policy acceptance, and data-handling controls.",
    primaryAction: "Review policies",
    endpoint: "/api/v1/customer/consents, /api/v1/customer/policy-acceptances",
    statusItems: [
      "Essential security cookies cannot be disabled.",
      "Optional analytics load only after permitted consent.",
      "Policy history shows customer-visible versions only.",
    ],
  },
  danger: {
    eyebrow: "Settings",
    title: "Account deletion.",
    description:
      "Deletion is isolated from routine settings and must use the backend deletion workflow with cancellation support.",
    primaryAction: "Review deletion policy",
    endpoint: "/api/v1/auth/account/delete, /api/v1/auth/account/delete/cancel",
    statusItems: [
      "Requires re-authentication or MFA when backend demands it.",
      "No destructive action happens from hidden client fields.",
      "Retention notices stay customer-readable.",
    ],
  },
  support: {
    eyebrow: "Customer account",
    title: "Support center.",
    description:
      "Authenticated support cases can attach appointment, payment, and account context without exposing it in public contact forms.",
    primaryAction: "Open a case",
    endpoint: "/api/v1/support or admin support endpoint when available",
    statusItems: [
      "Support requires a signed-in account.",
      "Evidence uploads must use private media storage.",
      "Case details stay scoped to the requester and authorized staff.",
    ],
  },
  application: {
    eyebrow: "Professional application",
    title: "Apply to become a Touch of Heaven professional.",
    description:
      "The application flow should collect professional details and documents, then wait for backend approval before granting any elevated role.",
    primaryAction: "Start application",
    endpoint: "/api/v1/professional/applications when available",
    statusItems: [
      "A submitted application never grants role access by itself.",
      "Document uploads need signed backend upload URLs.",
      "Status screens show customer-safe review progress.",
    ],
  },
};

export const studioContent: Record<string, RouteContent> = {
  today: {
    eyebrow: "Braider Studio",
    title: "Today view.",
    description:
      "The daily operational screen for current client, next appointments, consultation notes, and safe checkout actions.",
    primaryAction: "Open calendar",
    endpoint: "/api/v1/bookings, /api/v1/braiders/profile",
    statusItems: [
      "BRAIDER role required before layout renders.",
      "Private client data stays no-store.",
      "Actions call appointment-domain endpoints.",
    ],
  },
  calendar: {
    eyebrow: "Braider Studio",
    title: "Calendar and availability.",
    description:
      "Professionals manage recurring rules, blocked periods, service areas, and slot availability through backend availability endpoints.",
    primaryAction: "Add blocked time",
    endpoint: "/api/v1/availability/rules, /api/v1/availability/blocked-periods",
    statusItems: [
      "Backend owns conflict detection.",
      "Mobile uses responsive cards instead of wide tables.",
      "Empty states guide first-time setup.",
    ],
  },
  appointments: {
    eyebrow: "Braider Studio",
    title: "Appointments.",
    description:
      "Braiders see only appointments assigned to them, including consultation status and customer-facing appointment state.",
    primaryAction: "Review appointments",
    endpoint: "/api/v1/bookings/[appointmentId]",
    statusItems: [
      "Backend rejects changed appointment IDs.",
      "Status transitions call booking-domain endpoints.",
      "Client PII is never preloaded into public pages.",
    ],
  },
  appointmentDetail: {
    eyebrow: "Braider Studio",
    title: "Appointment detail.",
    description:
      "Full appointment context for one client: consultation notes, service and variation selections, deposit status, and checkout actions.",
    primaryAction: "Back to appointments",
    endpoint: "/api/v1/bookings/[appointmentId]",
    statusItems: [
      "Consultation media stays no-store and scoped to the assigned braider only.",
      "Checkout and status transitions call the same booking-domain endpoints the customer's own appointment view uses.",
      "A braider can never open an appointment id that isn't assigned to them.",
    ],
  },
  clients: {
    eyebrow: "Braider Studio",
    title: "Clients.",
    description:
      "A braider's own client list, built from completed and upcoming appointment history - not a general customer directory.",
    primaryAction: "Review appointments",
    endpoint: "/api/v1/studio/clients (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "A client only appears here after booking with this braider at least once.",
      "No cross-braider client data is ever visible.",
      "Notes and preferences are private to the braider who wrote them.",
    ],
  },
  clientDetail: {
    eyebrow: "Braider Studio",
    title: "Client record.",
    description:
      "One client's appointment history with this braider, consultation notes, and style preferences.",
    primaryAction: "Back to clients",
    endpoint: "/api/v1/studio/clients/[clientId] (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "Scoped to appointments this braider actually performed.",
      "Private notes never sync to the client's own account view.",
      "Contact details are only shown for clients with an active or recent appointment.",
    ],
  },
  services: {
    eyebrow: "Braider Studio",
    title: "Service catalog.",
    description:
      "Professional service creation, variations, pricing, media, and publishing are routed through service endpoints.",
    primaryAction: "Create service",
    endpoint: "/api/v1/services, /api/v1/services/[serviceId]/variations",
    statusItems: [
      "Service status controls public visibility.",
      "Media uploads use backend-issued upload URLs.",
      "No arbitrary model editing interface.",
    ],
  },
  serviceNew: {
    eyebrow: "Braider Studio",
    title: "Create a service.",
    description:
      "New services start in draft and are only publicly bookable once explicitly published, after pricing, duration, and variations are set.",
    primaryAction: "Save draft",
    endpoint: "POST /api/v1/services",
    statusItems: [
      "Base price and duration are required before a variation can be added.",
      "Category selection determines where this service appears in discovery.",
      "Publishing is a separate, explicit action from saving.",
    ],
  },
  serviceEdit: {
    eyebrow: "Braider Studio",
    title: "Edit service.",
    description:
      "Changes to price, duration, or variations apply going forward only - they never retroactively change an already-booked appointment's price.",
    primaryAction: "Save changes",
    endpoint: "PATCH /api/v1/services/[serviceId], PATCH /api/v1/services/[serviceId]/status",
    statusItems: [
      "A published service can be paused without deleting it.",
      "Existing appointments keep the price and terms they were booked under.",
      "Status changes are audited.",
    ],
  },
  portfolio: {
    eyebrow: "Braider Studio",
    title: "Portfolio.",
    description:
      "Portfolio media must respect customer consent and approved storage boundaries before appearing publicly.",
    primaryAction: "Upload portfolio media",
    endpoint: "/api/v1/braiders/[braiderId]/portfolio",
    statusItems: [
      "Images require descriptive alt text.",
      "Consent withdrawal removes public exposure.",
      "Private consultation media is separate from portfolio media.",
    ],
  },
  messages: {
    eyebrow: "Braider Studio",
    title: "Messages.",
    description:
      "Client conversations tied to a specific appointment or inquiry, kept separate from private consultation media.",
    primaryAction: "Open conversation",
    endpoint: "/api/v1/studio/messages (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "Messaging is scoped per client - a braider never sees another braider's conversations.",
      "No payment or account-credential information should ever be requested through chat.",
      "Consultation-specific detail belongs on the appointment page, not in chat.",
    ],
  },
  earnings: {
    eyebrow: "Braider Studio",
    title: "Earnings and payouts.",
    description:
      "Earnings views summarize ledger-backed payouts without exposing payment secrets or direct financial writes.",
    primaryAction: "Review payout status",
    endpoint: "/api/v1/professional/earnings, /api/v1/professional/payouts",
    statusItems: [
      "Backend verifies financial permissions.",
      "Sensitive payout changes rotate sessions.",
      "Totals reconcile to ledger state.",
    ],
  },
  settings: {
    eyebrow: "Braider Studio",
    title: "Professional settings.",
    description:
      "Studio settings control public profile, location privacy, notifications, and operational preferences.",
    primaryAction: "Update settings",
    endpoint: "/api/v1/braiders/profile, /api/v1/notifications/preferences",
    statusItems: [
      "Private studio addresses stay encrypted backend-side.",
      "Public locations may be approximate.",
      "Notification changes use typed preference endpoints.",
    ],
  },
  settingsProfile: {
    eyebrow: "Braider Studio settings",
    title: "Public profile.",
    description:
      "Professional name, bio, specialties, and the primary photo shown across discovery, the map, and the booking flow.",
    primaryAction: "Save profile",
    endpoint: "/api/v1/braiders/profile",
    statusItems: [
      "Changes here affect every public surface this braider appears on.",
      "Specialties come from the braider's own published services, not free text.",
      "Bio is truncated on discovery cards - see lib/discovery/format.ts's equivalent on the map feature.",
    ],
  },
  settingsLocation: {
    eyebrow: "Braider Studio settings",
    title: "Location and service area.",
    description:
      "Salon location, private studio address, or mobile service radius - the same location model the discovery map reads from.",
    primaryAction: "Save location",
    endpoint: "/api/v1/braiders/locations",
    statusItems: [
      "A private studio's exact address is never sent to the browser - only a fuzzed map position.",
      "Mobile service areas are defined by a radius, ZIP list, or city list.",
      "Location type changes may require re-verification.",
    ],
  },
  settingsAvailability: {
    eyebrow: "Braider Studio settings",
    title: "Availability and working hours.",
    description:
      "Recurring weekly hours, one-off blocked periods, and buffer time between appointments.",
    primaryAction: "Save availability",
    endpoint: "/api/v1/availability/rules, /api/v1/availability/blocked-periods",
    statusItems: [
      "Conflict detection against existing appointments is backend-authoritative.",
      "Time zone is read from the braider's own profile, never guessed from the browser.",
      "Changes here are what the map feature's next-available-slot calculation reads.",
    ],
  },
  settingsPayouts: {
    eyebrow: "Braider Studio settings",
    title: "Payout settings.",
    description:
      "Bank account or payout method connection for earnings withdrawal.",
    primaryAction: "Connect payout method",
    endpoint: "/api/v1/professional/payouts (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "No raw bank details are ever stored by this app directly.",
      "Payout method changes should require recent authentication.",
      "Pending payouts remain visible during a method change.",
    ],
  },
  settingsPolicies: {
    eyebrow: "Braider Studio settings",
    title: "Policies.",
    description:
      "Cancellation window, deposit percentage, and no-show terms applied to this braider's services.",
    primaryAction: "Save policies",
    endpoint: "/api/v1/services (per-service cancellationPolicy/depositPercentage - no dedicated policy-settings endpoint yet, see BACKEND_ADDITIONS.md)",
    statusItems: [
      "Policy changes apply to new bookings, not retroactively to confirmed appointments.",
      "Deposit percentage has a platform-defined minimum and maximum.",
      "Customers see the effective policy before paying a deposit.",
    ],
  },
  settingsNotifications: {
    eyebrow: "Braider Studio settings",
    title: "Notification preferences.",
    description:
      "Per-channel alerts for new bookings, cancellations, and messages.",
    primaryAction: "Save preferences",
    endpoint: "/api/v1/notifications/preferences (not yet implemented - see BACKEND_ADDITIONS.md)",
    statusItems: [
      "New-booking and cancellation alerts cannot be fully disabled.",
      "SMS requires a verified phone number.",
      "Preferences apply to the next notification sent, not retroactively.",
    ],
  },
};

export const adminContent: Record<string, RouteContent> = {
  overview: {
    eyebrow: "Admin",
    title: "Platform overview.",
    description:
      "Administrators see operational queues and system health after role and MFA requirements are satisfied.",
    primaryAction: "Review applications",
    endpoint: "/api/v1/admin/*",
    statusItems: [
      "ADMIN role required before layout renders.",
      "MFA completion is required by policy and enforced by backend flows.",
      "Every action writes an auditable domain event.",
    ],
  },
  applications: {
    eyebrow: "Admin",
    title: "Professional applications.",
    description:
      "Review braider applications through approval endpoints rather than direct role or database mutation screens.",
    primaryAction: "Open application queue",
    endpoint: "/api/v1/admin/applications",
    statusItems: [
      "Approvals call the professional-approval endpoint.",
      "Rejected applications retain safe customer-visible explanations.",
      "Role escalation never comes from hidden form fields.",
    ],
  },
  braiders: {
    eyebrow: "Admin",
    title: "Braider management.",
    description:
      "Inspect profile status, service visibility, reviews, support history, and policy compliance.",
    primaryAction: "Review braiders",
    endpoint: "/api/v1/admin/braiders",
    statusItems: [
      "No generic edit-database-record interface.",
      "Suspension and reinstatement remain domain actions.",
      "Private addresses stay redacted unless explicitly authorized.",
    ],
  },
  appointments: {
    eyebrow: "Admin",
    title: "Appointment oversight.",
    description:
      "Admin appointment views support support escalation, audit context, and controlled state transitions.",
    primaryAction: "Inspect appointments",
    endpoint: "/api/v1/admin/appointments, /api/v1/bookings/[appointmentId]/status",
    statusItems: [
      "All state transitions checked backend-side.",
      "Consultation privacy is preserved.",
      "Customer and braider views remain scoped separately.",
    ],
  },
  payments: {
    eyebrow: "Admin",
    title: "Payments and refunds.",
    description:
      "Payment problem inspection and refunds go through controlled payment endpoints and never expose provider secrets.",
    primaryAction: "Review payment issues",
    endpoint: "/api/v1/payments/[paymentId], payment-refund endpoint",
    statusItems: [
      "Refunds call the refund domain endpoint.",
      "Raw card data is never collected.",
      "Provider errors remain user-safe.",
    ],
  },
  support: {
    eyebrow: "Admin",
    title: "Support cases.",
    description:
      "Support queues connect customer, braider, appointment, payment, and dispute context without leaking unrelated records.",
    primaryAction: "Open support queue",
    endpoint: "/api/v1/admin/support",
    statusItems: [
      "Case access is role-scoped.",
      "Evidence uploads stay private.",
      "Audit trail records admin handling.",
    ],
  },
  policies: {
    eyebrow: "Admin",
    title: "Policy management.",
    description:
      "Admins publish policy versions and customer acceptance surfaces consume only published versions.",
    primaryAction: "Create policy version",
    endpoint: "/api/v1/admin/policies, /api/v1/customer/policies",
    statusItems: [
      "Published versions become public policy content.",
      "Acceptance history remains customer-scoped.",
      "Drafts stay private to admins.",
    ],
  },
  audit: {
    eyebrow: "Admin",
    title: "Audit log.",
    description:
      "Audit access is high-sensitivity admin data and must stay no-store, noindex, and server-authorized.",
    primaryAction: "Review audit events",
    endpoint: "/api/v1/admin/audit",
    statusItems: [
      "Never include audit data in metadata.",
      "Filters are server-validated.",
      "Exports require explicit backend authorization.",
    ],
  },
  system: {
    eyebrow: "Admin",
    title: "System health.",
    description:
      "System status summarizes backend readiness, payment provider mode, and operational checks without exposing secrets.",
    primaryAction: "Check readiness",
    endpoint: "/api/v1/health/live, /api/v1/health/ready",
    statusItems: [
      "Health displays do not reveal credentials.",
      "Production source maps stay private.",
      "Dependency scans feed release gates.",
    ],
  },
};
