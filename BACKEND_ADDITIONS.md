# Backend Additions Needed

Every backend endpoint the frontend's placeholder pages reference that
does not exist yet in Backend-of-TOH, found by cross-checking each
`endpoint` field in `config/page-content.ts` against Backend-of-TOH's
actual `app/api/v1/` route tree (`find app/api/v1 -type d`), not by
assumption. Nothing in this file was invented from the frontend side -
per the scaffolding plan's own rule, a frontend page whose backend
support doesn't exist stays a placeholder and gets listed here instead
of a broken connection.

A few endpoints referenced by *pre-existing* placeholder content (written
before this scaffolding pass) turned out to be missing too once checked
against the real route tree - those are listed here as well, not just
the ones this pass introduced.

## Confirmed to already exist (no action needed)

For contrast - these were assumed missing while writing new content, then
found real on inspection, and corrected in `config/page-content.ts`
accordingly: `GET/PATCH /api/v1/customer/addresses` (+ `[addressId]`),
`GET/PATCH /api/v1/notifications/preferences`, `GET /api/v1/professional/payouts`.
Also confirmed real and already in use: `/api/v1/customer/policies`,
`/api/v1/customer/consents`, `/api/v1/health/live`, `/api/v1/health/ready`,
`/api/v1/bookings/[appointmentId]/status`, and the entire
`/api/v1/commerce/*` surface (products, cart, categories, checkout,
orders) - which exists even though the marketplace *frontend* is
intentionally out of scope for this pass (see
`docs/file-structure-routing-security.md`). Worth a follow-up: that doc's
"Page Reference" section currently says the marketplace has "no product
catalog, cart, checkout... backend endpoint" - that line is now stale
and should be corrected once someone builds the marketplace frontend
against what already exists.

## Account settings

### GET/PATCH /api/v1/customer/beauty-profile
Needed by: `/account/settings/beauty-profile`
Request: hair length, texture, sensitivities/allergies, style history entries
Response: `{ beautyProfile: { hairLength, texture, sensitivities: string[], styleHistory: [...] } }`
Status: pending

### GET/POST/DELETE /api/v1/customer/payment-methods
Needed by: `/account/settings/payment-methods`
Request: provider-tokenized payment method reference (never raw card data - see `docs/frontend-threat-model.md`'s payment-leakage control)
Response: `{ paymentMethods: [{ id, brand, last4, isDefault }] }`
Status: pending

## Braider Studio

### GET /api/v1/studio/clients
Needed by: `/studio/clients`
Request: none (scoped to the authenticated braider's own session)
Response: `{ clients: [{ id, name, lastAppointmentAt, appointmentCount }] }`
Status: pending

### GET /api/v1/studio/clients/[clientId]
Needed by: `/studio/clients/[clientId]`
Request: none
Response: `{ client: { id, name, notes, appointments: [...] } }` - must verify the client actually has appointment history with the requesting braider before returning anything
Status: pending

### GET/POST /api/v1/studio/messages
Needed by: `/studio/messages`
Request: `POST` body `{ clientId, appointmentId?, body }`
Response: `{ conversations: [{ clientId, lastMessage, unreadCount }] }`
Status: pending

## Admin

There is currently no `/api/v1/admin/*` route prefix in Backend-of-TOH at
all - every admin-specific endpoint below needs to be built, including
several referenced by admin placeholder content that predates this
scaffolding pass (applications, braiders, appointments, payments,
support, policies, audit). All of these need `ADMIN` role + completed-MFA
enforcement server-side, matching `proxy.ts`'s admin gate, and every
mutating action needs an `AuditLog` write - see
`docs/file-structure-routing-security.md`'s "Naming Conventions" section
on server-side authorization for the general rule this follows.

### GET /api/v1/admin/users, GET /api/v1/admin/users/[userId]
Needed by: `/admin/users`, `/admin/users/[userId]`
Request: list supports search/filter by name, email, role
Response: `{ users: [{ id, name, email, roles, status }] }` / `{ user: {...}, activity: [...] }`
Status: pending

### GET /api/v1/admin/applications, GET /api/v1/admin/applications/[applicationId]
Needed by: `/admin/applications`, `/admin/applications/[applicationId]`
Request: none (list), applicationId (detail)
Response: `{ applications: [...] }` / `{ application: { ...submittedDetails, documents, decisionHistory } }`
Status: pending

### GET /api/v1/admin/braiders, GET /api/v1/admin/braiders/[braiderId]
Needed by: `/admin/braiders`, `/admin/braiders/[braiderId]`
Request: none (list), braiderId (detail)
Response: `{ braiders: [...] }` / `{ braider: { verificationStatus, services, portfolio, reviews, complianceHistory } }`
Status: pending

### GET /api/v1/admin/appointments
Needed by: `/admin/appointments`
Request: filters (status, date range, braider)
Response: `{ appointments: [...] }` - status transitions themselves can reuse the existing `PATCH /api/v1/bookings/[appointmentId]/status`
Status: pending

### GET /api/v1/admin/payments, admin refund action
Needed by: `/admin/payments`
Request: filters for payment issues; refund action needs `{ paymentId, reason }`
Response: `{ payments: [...] }` - `GET /api/v1/payments/[paymentId]` already exists for single-payment lookup, but there's no admin-scoped issue list or refund-trigger endpoint yet
Status: pending

### GET /api/v1/admin/payouts
Needed by: `/admin/payouts`
Request: filters (date range, status)
Response: `{ payoutRuns: [...] }` - distinct from the already-real `GET /api/v1/professional/payouts`, which is a single braider's own view, not an admin-wide batch view
Status: pending

### GET/POST /api/v1/admin/support
Needed by: `/admin/support`
Request: list filters; POST for admin responses/status changes
Response: `{ cases: [...] }`
Status: pending

### GET /api/v1/admin/disputes, GET /api/v1/admin/disputes/[caseId], decision action
Needed by: `/admin/disputes`, `/admin/disputes/[caseId]`
Request: decision action needs `{ outcome, reason }`
Response: `{ disputes: [...] }` / `{ dispute: { linkedAppointmentOrOrder, evidence: [...], history: [...] } }`
Status: pending

### GET/POST /api/v1/admin/moderation
Needed by: `/admin/moderation`
Request: POST body `{ itemId, decision: "clear" | "remove", reason }`
Response: `{ queue: [{ id, type, flaggedReason, submittedBy }] }`
Status: pending

### POST /api/v1/admin/policies
Needed by: `/admin/policies`
Request: `{ policySlug, version, effectiveDate, content }`
Response: `{ policyVersion: {...} }` - `GET /api/v1/customer/policies` already exists for reading published versions; only the admin-side publish action is missing
Status: pending

### GET /api/v1/admin/audit
Needed by: `/admin/audit`
Request: filters (date range, actor, action type) - server-validated only, per the page's own "no modifications permitted" rule
Response: `{ events: [{ id, actor, action, target, timestamp }] }` - read-only, no corresponding write/delete endpoint should ever exist
Status: pending

### GET/PATCH /api/v1/admin/platform-config
Needed by: `/admin/settings`
Request: `{ commissionRate?, payoutDelayDays?, bookingRules?, effectiveDate }`
Response: `{ config: {...}, previousVersions: [...] }` - changes must take an explicit effective date, never apply instantly to in-flight appointments/orders
Status: pending
