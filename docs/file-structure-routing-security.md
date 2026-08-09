# Frontend File Structure, Routing & Security

This document reconciles `doc/TOH_Frontend_File_Structure_Routing_Security (1).docx`
(the original vision document for this repository) against what is actually
built, right now, in `Frontend_for_HOF`. It is not a restatement of the vision
doc — it is a record of which parts of that vision this codebase already
implements, which parts it implements *differently* and why, and which parts
describe product surface area (a marketplace, an AI try-on studio, a
Resolution Center, Stripe checkout, NextAuth, Supabase realtime) that has not
been built yet and is out of scope until product work actually schedules it.

Treat the vision doc as the origin of intent. Treat this document, and the
code it describes, as the current source of truth. Where they disagree, this
document explains why, so the next engineer doesn't have to reverse-engineer
the decision from a diff.

## Philosophy: Why Structure Is Security

The vision doc opens with a claim worth keeping intact, because it's correct
and because everything else in this file only matters if that claim is taken
seriously: a frontend file structure is not a filing system for code, it is
part of the application's attack surface. A route an attacker can predict is
a route they can probe. A client bundle that contains a secret is a secret
that no longer exists. A page that renders sensitive data before
authentication is confirmed is a data leak with a UI.

This codebase's actual security posture is built on the same three
commitments the vision doc describes, and this repository already enforces
all three in code, not just in intent:

- **No route reveals whether it is protected from its URL alone.** `/studio`
  does not contain the word "braider." `/admin` looks like any other route.
  Route groups — `(public)`, `(auth)`, `(booking)`, `(account)`, `(braider)`,
  `(admin)` — are invisible in the URL by Next.js App Router design (see
  "Route Groups" below). See `docs/frontend-threat-model.md` for the full
  threat/control mapping this claim is backed by.
- **No client-side code contains a server secret.** Every `NEXT_PUBLIC_*`
  variable is treated as public by definition — visible to anyone with
  DevTools open — and only values that are safe to be public ever get that
  prefix. See "Environment Variables" below for the actual list this
  repository uses today.
- **No page renders protected data before authentication is confirmed, and no
  denied request is told what it was denied from.** `proxy.ts` redirects,
  never returns `401`/`403`. See "The Security Gate" below.

This document exists so that a new engineer can read one file and understand
both the intended architecture and the deliberate, reasoned points where this
codebase diverges from an earlier planning document — instead of discovering
those divergences by surprise in a diff.

## Technology Baseline

The vision doc's technology table assumed a broader product scope (a
marketplace, an AI try-on studio, Stripe checkout, NextAuth, Supabase
realtime) than what has been built so far. The table below is what this
repository *actually* depends on today, cross-checked directly against
`package.json` — not what a future, fuller build-out might eventually need.

| Package | Version | Purpose | vs. vision doc |
| --- | --- | --- | --- |
| `next` | 16.3.0 | Framework — App Router, server components, edge `proxy.ts` | Doc assumed Next.js 15; this repo runs 16, whose App Router/edge model is a superset of what the doc describes. `middleware.ts` is named `proxy.ts` in Next 16 — see "The Security Gate." |
| `react` / `react-dom` | 19.2.8 | UI library | Matches. |
| `typescript` | ^5 | Strict type safety | Matches — strict mode, no `any` (see "Naming Conventions"). |
| `tailwindcss` | ^4 | Utility-first styling | Doc assumed Tailwind v3; this repo runs v4 (CSS-variable-driven theme, `@theme` tokens in `app/globals.css` / `styles/`). |
| `framer-motion` | ^13.0.0 | Animation and transitions | Matches. |
| `swr` | ^2.5.0 | Client-side data fetching with caching | Matches — see `hooks/useNearbyBraiders.ts` for the reference implementation (rounded-coordinate cache keys, `dedupingInterval`). |
| `@tanstack/react-virtual` | ^3.14.9 | Virtual scroll for long lists | Matches — see `components/map/BraiderListSidebar.tsx`. |
| `@googlemaps/js-api-loader` + `@googlemaps/markerclusterer` | ^2.1.1 / ^2.6.2 | Braider discovery map | **Deliberate deviation**: the doc specifies `mapbox-gl`. Mapbox account creation was not possible when this feature was built; Google Maps JS API was substituted with the owner's explicit sign-off. `next.config.ts`'s `images.remotePatterns` and `proxy.ts`'s CSP both allowlist `maps.googleapis.com`/`maps.gstatic.com` accordingly. Mapbox domains remain allowlisted in the CSP as a low-cost hedge, not because Mapbox is in use. |
| `lucide-react` | ^1.31.0 | Icon system | Matches. |
| `@axe-core/playwright` + `@playwright/test` | ^4.12.1 / ^1.62.1 | Accessibility scanning + E2E | Not in the original doc's table, added because "Definition of Done" (below) requires both and they need to actually run, not just be aspired to. |
| `vitest` + `@testing-library/react` + `jsdom` | ^4.1.10 / ^16.3.2 / ^29.1.1 | Unit/component testing | Same reasoning — the doc's Definition of Done implies a real test runner. |

Packages the vision doc lists that **are not installed**, because the product
surface they support hasn't been built yet, are covered in "Page Reference"
below rather than repeated here: `zustand`, `react-hook-form`, `zod` (frontend
copy — the backend owns validation and is the shared source of truth),
`@stripe/stripe-js`, `next-auth`, `@supabase/supabase-js`, `sharp`,
`clsx`/`tailwind-merge`, `date-fns`. Adding any of these should happen when the
feature that needs it is actually being built, not speculatively.

## Current File Structure

This is the real top-level layout on `main` today — not the vision doc's
aspirational tree. Two structural choices are worth calling out because they
depart from the vision doc on purpose, not by accident:

- **No `src/` wrapper.** `app/`, `components/`, `lib/`, etc. live at the
  repository root. The vision doc nests everything under `src/`; this repo's
  starter convention doesn't, and nothing about the security model depends on
  which one is used.
- **`middleware.ts` is `proxy.ts`.** Next.js 16 renamed the file (the
  exported function is also named `proxy`, not `middleware`). Same file, same
  responsibility, same "must be at the project root" requirement — see "The
  Security Gate" below.

```text
Frontend_for_HOF/
├── app/                          # Next.js App Router - every route lives here
│   ├── layout.tsx                  # root layout - HTML shell, fonts, providers
│   ├── globals.css                 # Tailwind v4 entry - imports styles/ tokens
│   ├── not-found.tsx               # global 404
│   ├── error.tsx / global-error.tsx# error boundaries (route-level / root-level)
│   ├── loading.tsx                 # global loading fallback
│   ├── icon.tsx / opengraph-image.tsx / manifest.ts   # generated SEO/PWA assets
│   ├── robots.ts / sitemap.ts      # dynamic - see "Route Security" below
│   ├── access-denied/page.tsx      # shown for a denied action, not a route probe
│   │
│   ├── (public)/                 # route group - no auth check, see "Route Groups"
│   │   ├── layout.tsx               # public chrome: PublicHeader + PublicFooter
│   │   ├── page.tsx                 # / - homepage
│   │   ├── about/, how-it-works/, contact/, beauty/, braiders/, map/,
│   │   │   marketplace/             # each a real page.tsx today (marketplace is
│   │   │                            # a preview page, not a shopping flow - see
│   │   │                            # docs/future-marketplace-expansion.md)
│   │   └── legal/
│   │       ├── page.tsx             # policy index
│   │       └── [policySlug]/page.tsx# one dynamic route serves every policy
│   │
│   ├── (auth)/                   # guest-only route group
│   │   ├── layout.tsx               # centered card, no main nav
│   │   └── sign-in/, sign-up/, verify-email/, forgot-password/,
│   │       reset-password/, mfa/, auth-error/
│   │
│   ├── (booking)/                # protected route group
│   │   ├── layout.tsx
│   │   └── book/[[...step]]/page.tsx  # ONE catch-all route drives the whole
│   │                                  # booking funnel (service -> time ->
│   │                                  # consultation -> review -> payment ->
│   │                                  # confirmation) via a `step` param, rather
│   │                                  # than a page.tsx per step. See "Naming
│   │                                  # Conventions" for why this pattern is
│   │                                  # used instead of the vision doc's
│   │                                  # one-folder-per-step layout.
│   │
│   ├── (account)/                # protected route group
│   │   ├── layout.tsx
│   │   ├── account/[[...section]]/page.tsx        # dashboard + every settings
│   │   │                                          # sub-page via one catch-all
│   │   ├── bookings/[[...appointmentId]]/page.tsx
│   │   ├── support/[[...caseId]]/page.tsx
│   │   └── professional-application/[[...section]]/page.tsx
│   │
│   ├── (braider)/                # protected route group - BRAIDER role
│   │   ├── layout.tsx
│   │   └── studio/[[...section]]/page.tsx  # Today/calendar/services/portfolio/
│   │                                       # earnings/settings, one catch-all
│   │
│   ├── (admin)/                  # protected route group - ADMIN role
│   │   ├── layout.tsx
│   │   └── admin/[[...section]]/page.tsx
│   │
│   └── api/v1/braiders/nearby/route.ts   # the one frontend-owned API route
│                                          # today - a public GET, no auth,
│                                          # rate-limited by IP. Everything else
│                                          # is a server/browser call straight to
│                                          # Backend-of-TOH; see lib/api/.
│
├── components/
│   ├── layout/                     # PublicHeader, PublicFooter, DashboardShell,
│   │                                # RouteStatusPage (the shared "coming soon /
│   │                                # not built yet" panel every catch-all
│   │                                # section renders until it's implemented)
│   ├── map/                        # BraiderMap, BraiderProfileCard,
│   │                                # BraiderListSidebar, MapSearchPanel,
│   │                                # MapPageClient, marker-content.ts
│   └── feedback/                   # shared feedback/toast-style components
│
├── features/                     # feature-scoped modules (api/components/schemas)
│   ├── home/                       # homepage section data + components
│   └── auth/                       # sign-in/sign-up form components
│
├── hooks/
│   ├── useGeolocation.ts           # all 6 permission states, 8s timeout
│   └── useNearbyBraiders.ts        # SWR wrapper around the nearby-braiders API
│
├── lib/
│   ├── api/                        # browser.ts, server.ts, errors.ts, shared.ts,
│   │                                # types.ts - the ONLY place fetch() is called
│   ├── auth/session.ts             # getCurrentUser/requireUser/requireRole -
│   │                                # server-only, calls Backend-of-TOH's
│   │                                # /api/v1/auth/me, never touches a database
│   ├── discovery/                  # types.ts, format.ts for the map feature
│   ├── env/                        # client.ts, server.ts - typed env accessors
│   ├── maps/                       # config.ts, loader.ts, geocoding.ts, types.ts
│   └── security/safe-return-url.ts # same-origin-only redirect validation
│
├── config/
│   ├── navigation.ts               # publicNavigation, role-aware nav items
│   ├── route-access.ts             # the source of truth proxy.ts and
│   │                                # docs/route-access-matrix.md are both
│   │                                # generated from / kept in sync with
│   │   site.ts                     # siteConfig (name, url, description)
│   ├── legal.ts                    # legalPolicies list backing /legal/*
│   └── page-content.ts             # RouteStatusPage copy per unbuilt section
│
├── types/                        # auth.ts, content.ts
├── styles/                       # tokens.css, typography.css, utilities.css
├── tests/                        # setup.ts (Vitest), e2e/ (Playwright specs)
├── docs/                         # this file and its siblings
├── public/                       # static assets - no secrets, ever
│
├── proxy.ts                      # THE SECURITY GATE - see next section
├── next.config.ts                # security headers, image domains
├── eslint.config.mjs             # flat ESLint config (Next.js 16 default)
├── vitest.config.mts             # unit/component test runner config
├── playwright.config.ts          # E2E config
├── tsconfig.json
├── package.json / package-lock.json
├── .env.example                  # committed template, no real values
├── .gitignore
└── README.md
```

Not yet present, and not needed until the work that requires them is actually
scheduled: `.github/` (no CI workflow or PR template yet - see "Definition of
Done"), `.husky/` (no pre-commit hook automation yet), `stores/` (no Zustand -
nothing needs cross-tree client state yet), a `src/` wrapper (not this
repo's convention).

## Route Groups and Why They Exist

This repository implements exactly the six route groups the vision doc
describes, with exactly the property that makes them worth having: Next.js
App Router route groups — folders in parentheses, `(public)`, `(auth)`,
`(booking)`, `(account)`, `(braider)`, `(admin)` — are invisible in the URL.
`/studio` doesn't contain the word "braider" anywhere in the path. `/admin`
looks like any other route. An attacker scanning URLs cannot tell from the
path alone whether a route is public, guest-only, or protected, or what role
it requires — that information lives only in `proxy.ts` and
`config/route-access.ts`, not in the URL.

| Group | Real routes today | Layout chrome |
| --- | --- | --- |
| `(public)` | `/`, `/about`, `/how-it-works`, `/braiders`, `/map`, `/beauty`, `/marketplace`, `/contact`, `/legal/*` | `PublicHeader` + `PublicFooter` (`components/layout/`) |
| `(auth)` | `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, `/reset-password`, `/mfa`, `/auth-error` | Centered card, no main nav |
| `(booking)` | `/book/[[...step]]` | Booking funnel chrome |
| `(account)` | `/account/[[...section]]`, `/bookings/[[...appointmentId]]`, `/support/[[...caseId]]`, `/professional-application/[[...section]]` | `DashboardShell` sidebar chrome |
| `(braider)` | `/studio/[[...section]]` | `DashboardShell` sidebar chrome, BRAIDER-role variant |
| `(admin)` | `/admin/[[...section]]` | `DashboardShell` sidebar chrome, ADMIN-role variant |

Each group's `layout.tsx` applies chrome appropriate to that context, exactly
as the vision doc describes — a developer who accidentally renders admin
content under `(public)` gets an immediate, visible layout break rather than
a silent leak.

**The route groups are organizational, not the security boundary.** Grouping
files this way makes the intent legible to a developer reading the tree, but
it enforces nothing by itself — Next.js route groups have no runtime
authorization behavior. The real boundary is two layers, both driven by the
single source of truth in `config/route-access.ts`:

1. `proxy.ts`, at the edge, before any page renders (see "The Security Gate").
2. Each protected group's own `layout.tsx`, which calls `requireUser()` -
   or, for `(braider)`/`(admin)`, `requireRole("BRAIDER" | "ADMIN", "/account")`
   - from `lib/auth/session.ts` before rendering `children`. Confirmed
   directly in the code: `app/(account)/layout.tsx`, `app/(braider)/layout.tsx`,
   and `app/(admin)/layout.tsx` all call this, all render through the shared
   `DashboardShell` component with a `tone` prop (`"account"` / `"studio"` /
   `"admin"`) for the visual distinction the vision doc asks for, and all set
   `robots: { index: false, follow: false }` in their own metadata as a second,
   independent line of defense alongside `app/robots.ts` (see "Route Security
   Table" below).

If `proxy.ts`'s cookie-presence check is ever wrong or bypassed, the layout's
server-side call to the backend's `/api/v1/auth/me` still blocks the render -
this is why "defense in depth" in `docs/frontend-threat-model.md` isn't just
a phrase, it's two independently-verifiable code paths.

## The Security Gate

`proxy.ts`, at the project root, is the single most important security file
in this repository - the vision doc is right to call the equivalent file out
this way. It runs on Vercel's Edge Runtime, before any page or layout
renders, matched against every request except static assets and Next's own
internal routes (see its `config.matcher`).

What it actually checks, in order, reading directly from the code:

1. **Guest-only routes with a session already present redirect to
   `/account`.** `startsWithRoute(pathname, guestOnlyRoutePrefixes) &&
   hasSession` - a signed-in visitor hitting `/sign-in` doesn't see the form
   again, they're sent to their account.
2. **`/mfa` with neither a pending-MFA cookie nor a session redirects to
   `/sign-in`.** You can't land on the MFA challenge screen out of nowhere.
3. **Protected routes without a session redirect to `/sign-in?callbackUrl=...`.**
   `startsWithRoute(pathname, protectedRoutePrefixes) && !hasSession` - the
   callback URL is the original path *and query string*, URL-encoded, so the
   visitor lands back exactly where they meant to go after signing in (see
   the map feature's E2E test for a concrete example: clicking "Book Now"
   while signed out lands on `/sign-in?callbackUrl=%2Fbook%2F...`, not a dead
   end).
4. **Every response, on every path, gets the full security header set** -
   see "Security Headers and CSP" below - via `withSecurityHeaders()`,
   whether the request was allowed, redirected, or fell through as neither
   explicitly public nor explicitly protected.

This codebase's session model is its own, not NextAuth (see "Environment
Variables" below), and that shapes how the proxy checks state: session
presence is read from **cookie presence only** - `toh_session` /
`__Host-toh_session` for a session, `toh_mfa_pending` / `__Host-toh_mfa_pending`
for the MFA-pending case - never decoded or verified at the edge. The proxy answers
"is a session cookie present," not "is this session valid" - that
verification happens in the layout's call to `/api/v1/auth/me`, which is the
backend, the only place that can actually check a session against its store.
This split matters: the edge check has to be cheap and cookie-only to run on
every request without a database round trip, and the backend check is the
one that's actually authoritative.

**Role checks do not happen in `proxy.ts` at all** in this implementation -
they happen in the layout (see "Route Groups" above). This is a real
deviation from the vision doc, which describes the middleware itself
checking for `BRAIDER`/`ADMIN` roles and MFA-completion state. The roles a
session holds aren't knowable from a cookie's presence alone without
decoding a JWT or calling the backend - and calling the backend from
the edge on every request defeats the edge's speed advantage. This codebase
resolves that by pushing role/MFA verification to the layout (still before
any protected content renders, still before the client receives anything),
and keeping the edge check limited to what a cookie's mere presence can
answer safely: "is *some* session active," "is *MFA* pending." Functionally
the same guarantee (nothing protected renders without the right role, MFA
completion is enforced for admin), implemented one layer later than the
vision doc specifies.

🔒 **The rule the vision doc states, this code follows exactly:** the proxy
never returns `401` or `403`. Every denial is a redirect - to `/sign-in`, to
`/account`, or (for `/mfa` reached without a pending state) back to
`/sign-in`. A `401`/`403` confirms a protected route exists; a redirect to
`/sign-in` tells an attacker nothing they didn't already know.

## Security Headers and CSP

Headers are set in two places, which is worth being explicit about since it
looks redundant at first read and isn't: `next.config.ts`'s `headers()`
function sets a baseline on every response including ones `proxy.ts` never
touches (static files, cached responses), and `proxy.ts`'s
`withSecurityHeaders()` sets the full set - including the CSP, which
`next.config.ts` cannot set because the CSP needs a fresh nonce generated
per-request, and only the proxy runs per-request early enough for that.

| Header | Value | Set in |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Both |
| `X-Frame-Options` | `DENY` | Both |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Both |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=(self)` | Both |
| `X-XSS-Protection` | `0` | `proxy.ts` only |
| `X-DNS-Prefetch-Control` | `on` | `proxy.ts` only |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | `proxy.ts` only, production only |
| `Content-Security-Policy` | nonce-based, see below | `proxy.ts` only |

Two small, deliberate differences from the vision doc's table, both stricter
than what it specifies, not weaker:

- **`Permissions-Policy` includes `payment=(self)`** in addition to the doc's
  `camera=()`/`microphone=()`/`geolocation=(self)` - added ahead of the
  booking/payment flow using Stripe Elements, which needs the Payment Request
  API available to `self`.
- **`Strict-Transport-Security` includes `preload`** in addition to the doc's
  `max-age=63072000; includeSubDomains` - opts into browser HSTS preload
  lists once the domain is submitted, not just header-driven HSTS.

`X-XSS-Protection: 0` was the one header the vision doc calls for that this
codebase didn't set until now - added directly to `proxy.ts` alongside this
documentation, since a real gap surfaced while writing this section is worth
fixing in the same breath, not just noting.

### Content Security Policy

The real CSP, built fresh per-request in `proxy.ts`'s `buildCsp(nonce)` (not
copied from the vision doc - read directly from the function):

```text
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic' https://js.stripe.com
  https://maps.googleapis.com https://maps.gstatic.com https://api.mapbox.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
  https://api.mapbox.com https://maps.googleapis.com;
img-src 'self' data: blob: https://*.cloudflare.com https://*.supabase.co
  https://*.mapbox.com https://*.stripe.com https://maps.googleapis.com
  https://maps.gstatic.com https://*.googleusercontent.com https://*.ggpht.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' {API_ORIGIN} https://api.stripe.com https://js.stripe.com
  https://api.mapbox.com https://events.mapbox.com https://*.supabase.co
  wss://*.supabase.co https://maps.googleapis.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;  # production only
```

In development only, `script-src` also includes `'unsafe-eval'` - Turbopack's
dev-mode HMR needs it, and `buildCsp()` only adds it when
`process.env.NODE_ENV === "development"`; it's absent from every production
response.

Notably broader than the vision doc's CSP, and for a specific reason: it
allowlists **both** Google Maps domains (`maps.googleapis.com`,
`maps.gstatic.com` — the map this app actually renders) **and** Mapbox
domains (`api.mapbox.com`, `events.mapbox.com`, `*.mapbox.com` — what the
vision doc specifies). The Mapbox entries are a low-cost hedge left in from
before the Google Maps switch, not evidence Mapbox is in use anywhere in this
codebase (see "Technology Baseline"). They cost nothing to leave allowlisted
and cost a diff to remove for no functional gain; whoever eventually
confirms Mapbox will never be used can clean them up along with the CSP's
`img-src`/`connect-src`/`script-src`/`style-src` Mapbox entries and
`next.config.ts`'s `*.mapbox.com` image remote pattern in one pass.

⚠️ The nonce (`{NONCE}` above) is generated fresh per-request with
`crypto.getRandomValues()` at the edge - not `crypto.randomUUID()` as the
vision doc suggests, but the same property holds: a new, unguessable value
on every single response, never reused. `'unsafe-inline'` never appears in
`script-src`. `'strict-dynamic'` is present, which the vision doc's CSP
doesn't include - it lets the nonce'd root script propagate trust to the
scripts it dynamically loads (Next's own chunking depends on this) without
widening the static allowlist further.

## Route Security Table and robots/sitemap Rules

The full per-route-group table - auth requirement, role, MFA policy, denied
redirect, cache policy, indexing, and which backend endpoints each group
actually calls - already lives in `docs/route-access-matrix.md`, generated
from `config/route-access.ts`. That file is more granular than the vision
doc's version (it also tracks cache policy and the specific backend
endpoints each route family depends on), so it isn't duplicated here; treat
it as this section's detail table.

The one-line summary, matching the vision doc's own framing: every protected
family redirects to `/sign-in` when signed out except `(braider)` and
`(admin)`, which redirect to `/account` - silently, with no indication a
studio or admin section exists at all, exactly as the vision doc specifies
for `/studio`. `(admin)` is the only family with MFA policy set to
`required` rather than `backend-enforced`.

**`app/robots.ts`** blocks exactly what the vision doc asks for - verified
directly against the file, not assumed:

```text
User-agent: *
Allow: /
Disallow: /account
Disallow: /studio
Disallow: /admin
Disallow: /book
Disallow: /checkout
Disallow: /api
Sitemap: https://touchofheavenafricanhairbraiding.com/sitemap.xml
```

**`app/sitemap.ts`** includes the homepage, `/about`, `/how-it-works`,
`/braiders`, `/beauty`, `/legal`, `/map`, `/contact`, and every slug in
`config/legal.ts`'s `legalPolicies` list. It does not include per-braider
profile pages, marketplace category/product pages, `/ai-studio`,
`/style-quiz`, `/community`, `/careers`, or `/press` - not because of an
oversight, but because none of those pages exist yet (see "Page Reference"
below). A sitemap can only be honest about pages that are real; adding
placeholder sitemap entries for routes that 404 would be worse than leaving
them out.

Both files independently enforce the same boundary `proxy.ts` and every
protected layout already enforce - a crawler that indexed `/account/settings/security`
would have learned something about this platform's structure that was never
meant to be public, even though the page itself would still correctly reject
an unauthenticated crawler. Defense in depth applies to discoverability, not
just access.

## Environment Variables

The vision doc lists 17 environment variables. This repository's
`.env.example` - the committed, real-values-never template every developer
copies to `.env.local` - lists 7, cross-checked against a grep for every
`process.env.*` reference in the codebase to confirm nothing used in code is
missing from the template and nothing in the template is unused:

| Variable | Server/Client | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Client | This frontend's own public origin. |
| `NEXT_PUBLIC_API_URL` | Client | Backend-of-TOH's public origin - every browser request target. |
| `BACKEND_INTERNAL_API_URL` | Server only | Optional private backend origin for server-rendered requests, if it ever needs to differ from the public API URL. |
| `DISABLE_HOME_BACKEND` | Server only | Local dev switch - renders the homepage's unavailable-state UI without calling the live backend. Not a production security-relevant variable. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key. Present in the template ahead of the booking payment flow being wired up - currently unused in code. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Google Maps JS API key, domain-restricted in the Google Cloud Console. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Client | Required for `AdvancedMarkerElement` (the map's custom photo pins) - the map renders its "coming soon" fallback without it even if the API key is valid. |

🔴 **Same rule as the vision doc, unchanged:** every `NEXT_PUBLIC_*` variable
ships in the browser bundle and is visible to anyone with DevTools open.
Nothing that grants elevated access belongs in one. This repository has no
secrets in `NEXT_PUBLIC_*` variables today - the two Google Maps values are
a domain-restricted browser key and a non-sensitive style/marker
configuration ID, and the Stripe key is a publishable key, which is public
by Stripe's own design.

The ten variables the vision doc lists that don't appear here -
`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`,
`NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`,
`REVALIDATE_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`,
`APPLE_CLIENT_ID`/`APPLE_CLIENT_SECRET` - all belong to integrations that
aren't built: this app doesn't use NextAuth (see "The Security Gate" for the
real session model), doesn't use Supabase realtime yet (its domains are
allowlisted in the CSP defensively, ahead of need), has no analytics or
error-tracking installed, has no ISR revalidation webhook, and has no OAuth
providers wired up (`/sign-in` is email/password only today). Add each
variable when the feature that needs it is actually being built, with its
own `.env.example` entry and description at the same time - not before.
