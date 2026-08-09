# Touch of Heaven Frontend Architecture

This frontend is a Next.js App Router application that talks to the existing
backend only through authenticated REST endpoints. It must never import Prisma,
backend modules, database clients, or server secrets.

## Structure

The current repository keeps `app/`, `components/`, `features/`, `lib/`,
`config/`, `styles/`, and `types/` at the project root. That matches the
starter repository convention, while preserving the mandate's separation of
routes, shared UI, feature modules, API access, security, configuration, and
documentation.

Route groups are used for intent without changing public URLs:

| Group | Public URL examples | Purpose |
| --- | --- | --- |
| `(public)` | `/`, `/braiders`, `/beauty`, `/marketplace`, `/legal/privacy` | Public marketing, discovery, policy, and SEO-safe pages. |
| `(auth)` | `/sign-in`, `/sign-up`, `/mfa` | Guest and authentication screens backed by `/api/v1/auth/*`. |
| `(booking)` | `/book`, `/book/[braiderId]/payment` | Protected booking flow. |
| `(account)` | `/account/settings/security` | Protected customer account and settings. |
| `(braider)` | `/studio/services` | Protected professional workspace for `BRAIDER` users. |
| `(admin)` | `/admin/payments` | Protected administrator workspace for `ADMIN` users. |

## Security Model

`proxy.ts` is the fast edge gate for this Next 16 app. It checks only what it
can safely know at the edge: whether a session-like cookie is present, whether
an MFA-pending cookie exists for `/mfa`, and whether a guest-only route should
send a signed-in user back to `/account`.

The proxy always redirects denied access. It never returns `401` or `403`, which
avoids confirming route existence to unauthenticated scanners.

Server layouts are the second layer. Protected groups call `/api/v1/auth/me`
with incoming cookies forwarded to the backend. Role-specific groups require
the backend-returned `BRAIDER` or `ADMIN` role before rendering.

The backend remains the final authority for authentication, authorization,
resource ownership, CSRF validation, role state, MFA policy, and domain-specific
actions.

## Feature Boundaries

Feature modules expose deliberate entry points:

| Feature | Files |
| --- | --- |
| `features/home` | Homepage section components and public content data. |
| `features/auth` | Client forms that call backend auth endpoints with CSRF. |
| `components/layout` | Public chrome, protected dashboard chrome, and route status panels. |
| `lib/api` | Browser and server fetch clients. |
| `lib/auth` | Server-only session lookup and role guards. |
| `lib/security` | Safe return URL handling. |

Future feature modules should follow this pattern:

```text
feature-name/
  api/
  components/
  hooks/
  schemas/
  types/
  utils/
  index.ts
```

## Page Inventory

The current foundation implements these route families. Additional screens in
the product mandate can be added to the catch-all catalogs without changing the
security model.

| URL | Page name | Primary content | Primary action |
| --- | --- | --- | --- |
| `/` | Homepage | Hero, discovery search, service categories, featured braiders, trust section. | Find a braider |
| `/about` | About | Platform story and architecture intent. | Learn platform purpose |
| `/how-it-works` | How it works | Discovery, consultation, booking, management steps. | Start booking |
| `/braiders` | Braider discovery | Verified professional cards and map entry. | Open map |
| `/map` | Braider map | Google Maps discovery surface. | Search this area |
| `/beauty` | Service discovery | Braiding and protective style categories. | Find braiders |
| `/marketplace` | Marketplace preview | Future TOHAEM product direction with no fake shopping. | Book a service |
| `/contact` | Contact | Public support direction. | Email support |
| `/legal` | Policy library | Public policy list. | Open policy |
| `/legal/[policySlug]` | Policy detail | Effective date and current policy summary. | Review policy |
| `/sign-in` | Sign in | Email/password sign-in. | Sign in |
| `/sign-up` | Sign up | Customer account creation. | Create account |
| `/forgot-password` | Forgot password | Reset email request. | Send reset link |
| `/reset-password` | Reset password | Token and new password form. | Update password |
| `/verify-email` | Verify email | Verification token form. | Verify email |
| `/mfa` | MFA challenge | Authenticator or backup code form. | Verify code |
| `/auth-error` | Auth error | Safe auth failure state. | Try again |
| `/book` | Booking service | Service and professional selection milestone. | Search braiders |
| `/book/[braiderId]` | Booking time | Availability and hold milestone. | Continue |
| `/book/[braiderId]/consultation` | Consultation | Private consultation milestone. | Save consultation |
| `/book/[braiderId]/review` | Booking review | Appointment and policy summary milestone. | Accept and continue |
| `/book/[braiderId]/payment` | Payment | Provider payment milestone. | Pay deposit |
| `/book/confirmation` | Confirmation | Appointment confirmation milestone. | View appointments |
| `/account` | Account overview | Private customer account summary milestone. | Book another appointment |
| `/bookings` | Bookings alias | Customer appointment milestone outside account prefix. | View bookings |
| `/account/appointments` | Appointments | Customer appointment list milestone. | Find a braider |
| `/account/settings/profile` | Profile | Customer profile milestone. | Save profile |
| `/account/settings/security` | Security | Password, MFA, and sessions milestone. | Manage MFA |
| `/account/settings/privacy` | Privacy | Consent and policy history milestone. | Review policies |
| `/account/settings/danger` | Account deletion | Deletion workflow milestone. | Review deletion policy |
| `/support` | Support center | Authenticated support milestone. | Open a case |
| `/professional-application` | Professional application | Braider application milestone. | Start application |
| `/studio` | Studio today | Current professional work view milestone. | Open calendar |
| `/studio/calendar` | Studio calendar | Availability milestone. | Add blocked time |
| `/studio/appointments` | Studio appointments | Assigned appointment milestone. | Review appointments |
| `/studio/services` | Studio services | Service catalog milestone. | Create service |
| `/studio/portfolio` | Studio portfolio | Consent-aware media milestone. | Upload portfolio media |
| `/studio/earnings` | Studio earnings | Ledger and payout milestone. | Review payout status |
| `/studio/settings` | Studio settings | Professional profile and preferences milestone. | Update settings |
| `/admin` | Admin overview | Platform queue and health milestone. | Review applications |
| `/admin/applications` | Applications | Professional approval milestone. | Open queue |
| `/admin/braiders` | Braiders | Professional management milestone. | Review braiders |
| `/admin/appointments` | Appointment oversight | Admin appointment milestone. | Inspect appointments |
| `/admin/payments` | Payments | Payment issue and refund milestone. | Review issues |
| `/admin/support` | Support | Support queue milestone. | Open queue |
| `/admin/policies` | Policies | Policy version management milestone. | Create policy version |
| `/admin/audit` | Audit | Audit event milestone. | Review events |
| `/admin/system` | System | Health and readiness milestone. | Check readiness |

## Definition Of Done

Each production page needs 375px and 1280px layout verification, keyboard
navigation, visible focus states, loading/empty/error/success states, metadata,
OG image coverage, mobile Lighthouse 90+, and screen-reader navigation.
