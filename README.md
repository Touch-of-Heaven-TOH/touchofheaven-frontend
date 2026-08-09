# Touch of Heaven Frontend

Customer, braider, and administrator web application for Touch of Heaven. Built
with Next.js 16 App Router, React 19, Tailwind CSS v4, and strict TypeScript.

The frontend consumes the backend through `/api/v1/*` only. It does not import
Prisma, query PostgreSQL, duplicate backend business rules, or store session,
MFA, access, or payment secrets in browser storage.

## Local Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Run the backend separately from `..\Backend_for_HOF`. In the default split local
setup, the backend runs at `http://localhost:3000` and this frontend runs at
`http://localhost:3001`.

## Environment

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Client | Public frontend origin. Visible in the browser bundle. |
| `NEXT_PUBLIC_API_URL` | Client | Public backend API origin used by browser requests. Visible in the browser bundle. |
| `BACKEND_INTERNAL_API_URL` | Server only | Optional server-side backend origin for Server Components. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key only. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Restricted Google Maps browser key. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Client | Google Maps Map ID for advanced markers. |

Never put database URLs, Stripe secrets, webhook secrets, service-role keys, R2
credentials, TOTP keys, email credentials, or Sentry upload tokens in
`NEXT_PUBLIC_*` variables.

## Security Foundation

- `proxy.ts` is the Next 16 edge gate. It sets nonce CSP/security headers and
  redirects protected routes instead of returning `401` or `403`.
- Protected route groups call `/api/v1/auth/me` server-side before rendering.
- Browser mutations use `lib/api/browser.ts`, which retrieves and sends CSRF.
- Server rendering uses `lib/api/server.ts`, which forwards incoming cookies.
- `robots.ts` blocks authenticated route families and `sitemap.ts` lists only
  public pages.

## Routes

- Public: `/`, `/about`, `/how-it-works`, `/braiders`, `/map`, `/beauty`,
  `/marketplace`, `/contact`, `/legal/*`
- Auth: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`,
  `/verify-email`, `/mfa`, `/auth-error`
- Booking: `/book`, `/book/[braiderId]`, `/book/[braiderId]/consultation`,
  `/book/[braiderId]/review`, `/book/[braiderId]/payment`, `/book/confirmation`
- Account: `/account`, `/account/appointments`, `/account/settings/*`
- Support and applications: `/support`, `/professional-application`
- Studio: `/studio`, `/studio/calendar`, `/studio/appointments`,
  `/studio/services`, `/studio/portfolio`, `/studio/earnings`, `/studio/settings`
- Admin: `/admin`, `/admin/applications`, `/admin/braiders`,
  `/admin/appointments`, `/admin/payments`, `/admin/support`, `/admin/policies`,
  `/admin/audit`, `/admin/system`

See `docs/architecture.md` and `docs/route-access-matrix.md` for the route
inventory and access rules.

## Scripts

```powershell
npm run dev
npm run lint
npm run build
```

Testing dependencies and scripts are not installed in this repository yet. Add
Vitest, Testing Library, Playwright, and axe before claiming the full production
definition of done.

## Documentation

- `docs/architecture.md`
- `docs/route-access-matrix.md`
- `docs/frontend-threat-model.md`
- `docs/api-contract.md`
- `docs/design-system.md`
- `docs/responsive-behaviour.md`
- `docs/accessibility-standard.md`
- `docs/analytics-and-privacy.md`
- `docs/error-handling.md`
- `docs/future-marketplace-expansion.md`
