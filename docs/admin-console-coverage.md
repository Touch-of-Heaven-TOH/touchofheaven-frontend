# Administrator Console Coverage Audit

This audit was created before implementing the Touch of Heaven administrator
and company console. It treats the current repository structure as the source of
truth and maps existing backend capabilities to the intended frontend admin
surface without forcing the project to match an older proposed file tree.

## Current Frontend State

| Area | Current route | Current UI | Coverage status |
| --- | --- | --- | --- |
| Admin shell | `/admin/*` through `app/(admin)/layout.tsx` | Generic `DashboardShell` plus catch-all stub | Needs owner-console shell matching supplied designs |
| Admin overview | `/admin` | Route status placeholder | Needs real dashboard cards, action center, charts, health panels |
| Bookings | `/admin/appointments` | Route status placeholder | Needs appointment management table/detail panels |
| Braiders/applications | `/admin/braiders`, `/admin/applications` | Route status placeholder | Needs provider list and application review queue |
| Customers | Not in current admin nav | None | Needs customer relationship page |
| Marketplace/orders/products | Not in current admin nav | None | Backend commerce exists; admin screens needed |
| Payments/payouts/refunds | `/admin/payments` | Route status placeholder | Needs finance console; payout actions need backend contracts |
| Reviews/moderation | Not in current admin nav | None | Backend review endpoints exist; moderation endpoints needed |
| Support/disputes | `/admin/support` | Route status placeholder | Support backend route not present yet |
| Policies/audit/system | `/admin/policies`, `/admin/audit`, `/admin/system` | Route status placeholder | Policy customer endpoints and audit model exist; admin endpoints needed |

## Backend Capability Map

| Backend capability | Existing backend route or model | Intended admin surface | UI status | Missing contract / notes |
| --- | --- | --- | --- | --- |
| Auth, roles, sessions, MFA | `/api/v1/auth/*`, `User`, `UserRole`, `Session`, `MfaConfig`, `AuditLog` | Admin shell, security settings, audit | Shell requires `ADMIN`; security panels can show safe static contract state first | Admin user/session management endpoints are not present |
| Customer profile, addresses, consent | `/api/v1/customer/*`, `CustomerProfile`, `CustomerAddress`, `ConsentRecord`, `PolicyAcceptance` | Clients & customer relationships | Needs list/detail UI | Admin-scoped customer search/detail endpoints are not present |
| Professional profiles | `/api/v1/braiders/profile`, `/locations`, `/service-areas`, `BraiderProfile` | Braiders management | Needs desktop and mobile cards/tables | Admin list/detail/application decision endpoints are not present |
| Services and portfolio | `/api/v1/services/*`, `Service`, `ServiceMedia`, `PortfolioMedia` | Products/services, braider detail, moderation | Needs review surfaces | Admin moderation and service action endpoints are not present |
| Availability and slot holds | `/api/v1/availability/*`, `AvailabilityRule`, `BlockedPeriod`, `SlotHold` | Bookings calendar and braider availability panels | Needs schedule summaries | Admin override/conflict endpoints are not present |
| Bookings and consultations | `/api/v1/bookings/*`, `Appointment`, `Consultation`, `AppointmentSnapshot` | Bookings management | Needs list, detail, timeline, schedule cards | Admin aggregate/list endpoints are not present; sensitive details must stay collapsed |
| Payments and refunds | `/api/v1/payments/*`, `Payment`, `Refund`, `PaymentAttempt` | Payments and finance console | Needs ledger-style views | Refund mutation endpoints and MFA-protected admin payment actions are not present |
| Commerce catalog and orders | `/api/v1/commerce/*`, `Product`, `ProductVariant`, `CustomerOrder`, `SellerOrderGroup` | Marketplace, orders, products | Needs marketplace health and order management | Admin catalog/order operations are not present |
| Financial ledger and payouts | `/api/v1/financial/ledger/accounts`, `/api/v1/professional/earnings`, `/payouts`, `LedgerEntry`, `Payout` | Payouts & Finance | Needs finance dashboard | Release/hold/reconcile payout admin endpoints are not present |
| Notifications | `/api/v1/notifications/preferences`, `NotificationEvent` | Marketing, notification health, support context | Needs health and queue UI | Admin notification delivery/resend endpoints are not present |
| Reviews | `/api/v1/braiders/[id]/reviews`, `/api/v1/bookings/[id]/review`, `ServiceReview`, `ReviewResponse` | Reviews and moderation | Needs review queue | Admin hide/restore/remove endpoints are not present |
| Support and disputes | No support route files currently | Support Tickets, Disputes | Needs queue UI | Support-case data model and endpoints are not present |
| Policies | `/api/v1/customer/policies`, `/policy-acceptances`, `PolicyVersion` | Policies and company settings | Needs policy management UI | Admin draft/publish endpoints are not present |
| Audit and system health | `/api/v1/health/live`, `/ready`, `AuditLog`, `DomainEventOutbox` | Audit, security, system health | Health can call existing endpoints; audit UI needs contract | Admin audit query endpoint is not present |

## Implementation Guardrails

- Use `app/(admin)/admin/[[...section]]/page.tsx` as the route entry point
  unless a later change clearly improves maintainability.
- Put new admin-specific data, components, and helpers under `features/admin/`.
- Keep admin pages `noindex`, dynamic, and behind the existing `requireRole("ADMIN")`
  layout gate. This is an optimistic frontend gate only; backend endpoints must
  still authorize every request.
- Do not wire high-risk buttons to local state. Approval, rejection, refund,
  payout release, suspension, role changes, policy publication, moderation
  removal, and audit exports remain disabled or labelled as contract-needed
  until backend endpoints exist.
- Use static, clearly labelled operational sample data only as a frontend
  composition layer while admin aggregate endpoints are missing.
- Do not include private addresses, raw provider payloads, secrets, complete
  payment instruments, MFA secrets, tokens, or consultation details in the UI.

## First Implementation Milestones

| Milestone | Scope | Verification |
| --- | --- | --- |
| Admin shell and overview | Owner-console sidebar/topbar, responsive dashboard, action center, health cards | TypeScript, lint, responsive screenshot |
| Bookings, braiders, clients | Design-matched operational pages with safe detail panels and disabled sensitive actions | TypeScript, lint, responsive screenshot |
| Marketplace, orders, finance | Marketplace KPIs, order queue, payout ledger composition | TypeScript, lint, responsive screenshot |
| Remaining admin areas | Products, marketing, reports, reviews, disputes, support, settings, team | TypeScript, lint, route coverage check |
| Backend contract follow-up | Document and implement admin endpoints in backend with separate commits | Backend db check, tests, API authorization matrix |
