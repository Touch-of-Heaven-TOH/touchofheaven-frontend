# Touch of Heaven — System Map

Written 27 September 2026, updated 28 September. Read from the code in
both repos; the client-home work is on open branches, marked below.

This is a map for editing the system yourself: which folder owns what, which
folder talks to which, what is finished, what is a shell, and where I am not
sure. Counts and paths were read from the code, not from memory. Where I am
guessing, it says so.

---

## 1. The shape of the whole thing

Two separate Next.js applications, two separate git repositories, talking over
HTTP. They do **not** share code — a type or helper needed by both is written
twice, once on each side.

```
   BROWSER
      |
      |  (1) page request
      v
Frontend_for_HOF        :3001      Next.js 16 App Router
  app/          routes and layouts (the URL structure)
  features/     the actual screens, grouped by area
  lib/          shared plumbing (api client, session, env)
  components/   generic UI reused everywhere
      |
      |  (2) fetch("/api/v1/...")  — cookies attached
      v
Backend_for_HOF         :3000      Next.js 16 App Router, used as an API only
  app/api/v1/   one folder per endpoint, each with route.ts
  modules/      the business logic, grouped by domain
  lib/          cross-cutting: auth, errors, audit, prisma, http envelope
  prisma/       schema.prisma + migrations
      |
      |  (3) Prisma
      v
PostgreSQL 18 + PostGIS :5432
Mailpit                 :8025      catches all outgoing email in development
```

**Size, as of today**

| | Count |
|---|---|
| Backend domain modules (`modules/*`) | 21 |
| Backend API routes (`app/api/v1/**/route.ts`) | 203 |
| Prisma models | 87 |
| Migrations | 42 |
| Frontend feature folders (`features/*`) | 17 |
| Frontend pages (`app/**/page.tsx`) | 118 |
| Frontend pages that are still shells | 15 |
| Backend routes no frontend file mentions | 28 |

---

## 2. How one request actually travels

Take "save my client profile". Follow it end to end — every feature works this
way, so if you learn this one you can read any of them.

1. **Page** — `app/(account)/account/settings/profile/page.tsx`
   A thin file. It sets `metadata` and renders one component. Almost every page
   in this codebase is three lines like this; the work lives in `features/`.

2. **Screen** — `features/account/settings/ProfileSettings.tsx`
   A `"use client"` component. Reads with SWR, writes on submit.

3. **Feature API module** — `features/account/settings/api.ts`
   Each feature area has one of these. It wraps the generic client so the
   screen never builds a URL by hand:
   ```ts
   export function accountFetcher<T>(path: string): Promise<T>   // for SWR reads
   export function accountRequest<T>(path, method, body)          // for writes
   export function errorMessage(error, fallback)                  // what to show a human
   ```

4. **Generic client** — `lib/api/browser.ts`
   Attaches cookies, adds the CSRF token on writes, unwraps the response
   envelope, throws `ApiClientError` on failure.

5. **Route handler** — `Backend_for_HOF/app/api/v1/customer/me/route.ts`
   Always the same five moves, in this order:
   ```ts
   export function PATCH(request: NextRequest) {
     return handleApiRequest(request, { csrf: true }, async (context) => {
       const input = await parseJsonBody(request, updateCustomerSchema);      // validate
       const { user, token, refreshedExpiresAt }
         = await requireAuthenticatedSession(request);                        // authenticate
       const result = await updateCustomer(user, input, meta);                // do the work
       const response = successResponse(result, context.requestId);           // envelope
       if (refreshedExpiresAt) setSessionCookie(response, token, ...);        // slide session
       return response;
     });
   }
   ```
   **Route handlers contain no business logic.** If you find an `if` about
   money or permissions in a `route.ts`, it is in the wrong file.

6. **Service** — `modules/customers/customer.service.ts`
   Permission checks, business rules, encryption, audit-log writes.

7. **Repository** — `modules/customers/customer.repository.ts`
   Prisma calls only. No rules.

8. **Database**.

**The response envelope** — every endpoint answers this shape, which is why
`browserApiFetch` can unwrap everything uniformly:
```jsonc
{ "success": true,  "data": { ... },                          "requestId": "..." }
{ "success": false, "error": { "code": "...", "message": "..." }, "requestId": "..." }
```
`error.message` is written for a human to read. That is why the frontend shows
it as-is rather than substituting its own text.

---

## 3. The backend module pattern

Every folder in `modules/` follows the same file naming. Once you know it, you
can navigate a module you have never opened.

| File | Holds | May it talk to Prisma? |
|---|---|---|
| `*.schemas.ts` | Zod input validation, exported input types | no |
| `*.constants.ts` | Rate limits, TTLs, magic numbers | no |
| `*.repository.ts` | Prisma queries, nothing else | **yes, only here** |
| `*.service.ts` | Rules, permissions, orchestration, audit writes | no — calls the repository |
| `*.serializer.ts` | Shaping a DB row into an API response | no |
| `*-storage.ts` | Object-storage keys and signed URLs (R2) | no |

Rules that hold across the whole backend:

- **Only repositories import `prisma`.** A service that queries directly is a
  bug waiting to happen, because the permission check lives in the service and
  the query would bypass it.
- **Services own permissions.** The pattern is a local `requireAdmin(user, …)`
  or `assertBusinessAccess(…)` at the top of the function.
- **Every consequential write is audited** via `writeAuditLog` from
  `lib/audit/audit.service.ts`. This is deliberate — the platform moves money.
- **`import 'server-only'`** is the first line of every service and repository,
  so a client component importing one fails the build instead of leaking.

### Shared backend plumbing — `Backend_for_HOF/lib/`

| Folder | What it does |
|---|---|
| `http/` | `handleApiRequest` (the wrapper every route uses), `successResponse`, `createOptionsHandler` (CORS preflight) |
| `security/` | `requireAuthenticatedSession`, cookie handling, CSRF, location encryption (AES-256-GCM) |
| `authz/policy.ts` | `isAdmin(user)` and friends — role checks |
| `audit/` | `writeAuditLog` |
| `errors.ts` | `AppError({ code, message, statusCode })` — the message is user-facing |
| `env/schema.ts` | Zod validation of every environment variable at boot |
| `validation.ts` | `parseJsonBody(request, schema)` |
| `prisma.ts` | The single Prisma client (pg adapter) |
| `inngest/`, `email/`, `ai/`, `logging/` | Background jobs, mail, AI Studio calls, structured logs |

---

## 4. The frontend structure

### Route groups — `app/`

A folder in brackets, like `(account)`, groups routes under a shared layout
**without appearing in the URL**. This is how the app has five different chromes.

| Group | URLs | Layout guard | Chrome |
|---|---|---|---|
| `(public)` | `/`, `/explore`, `/businesses/…`, `/ai-studio`, `/marketplace` | none | public header/footer |
| `(auth)` | `/customer/sign-in`, `/business/sign-up`, `/mfa`, … | none | split-screen auth shell |
| `(client-onboarding)` | `/client-onboarding/[[...step]]` | signed in | wizard |
| `(booking)` | `/book/[[...step]]` | **guarded** | booking flow |
| `(account)` | `/account/…`, `/bookings`, `/messages`, `/disputes` | **guarded** | client workspace sidebar |
| `(business)` | `/business/setup/…` | **guarded** | setup wizard |
| `(business-studio)` | `/studio/…` | **guarded** | Studio sidebar + mobile bottom nav |
| `(admin)` | `/admin/…` | **guarded, ADMIN role** | Owner Console sidebar |

The guard is in each group's `layout.tsx`, calling `requireUser()` from
`lib/auth/session.ts`, which server-side fetches `/api/v1/auth/me` and
`redirect()`s to sign-in when there is no session. **There is no
`middleware.ts` doing auth** — it is per-layout.

### `features/` — where screens actually live

`app/` is the URL map; `features/` is the code. A page file should stay three
lines. Current folders and what owns them:

| Folder | Files | Owns |
|---|---|---|
| `features/home/` | 48 | The public marketing homepage and its sections |
| `features/studio/` | 52 | The entire provider Studio |
| `features/admin/` | 18 | Owner Console |
| `features/auth/` | 17 | Sign-in / sign-up / verify / reset, both audiences |
| `features/business-wizard/` | 17 | The 4-step "set up your business" flow |
| `features/account/` | 15 | Client settings + client portfolio |
| `features/discovery/` | 13 | Explore, map, business profiles |
| `features/ai-studio/` | 6 | AI Studio try-on |
| `features/bookings/` | 3 | "My bookings" and appointment detail |
| `features/resolution/` | 3 | Client-side disputes |
| `features/client-onboarding/` | 3 | First-run client wizard |
| `features/booking/` | 1 | **The whole booking flow, in one ~2,700-line file** |
| `features/messaging/` | 1 | Messages |
| `features/business-home/`, `features/businesses/`, `features/professional-application/`, `features/dev/` | 1–2 each | small |

### Shared frontend plumbing — `Frontend_for_HOF/lib/`

| Folder | What it does |
|---|---|
| `api/browser.ts` | The client-side fetch wrapper — cookies, CSRF, envelope unwrapping |
| `api/server.ts` | `serverApiFetch` — the same thing for server components |
| `api/errors.ts` | `ApiClientError` with `.code` and `.status` |
| `auth/session.ts` | `requireUser()`, the layout guard |
| `security/safe-return-url.ts` | Stops open-redirect via `callbackUrl` |
| `maps/` | MapLibre setup — **do not swap the library** |
| `reference-data/` | Country list etc., mirrored from the backend's own copy |
| `dev/preview-access.ts` | The `/dev/preview-sign-in` shortcut used for testing |

---

## 5. Module by module

Read this as: *backend folder → its routes → frontend folder → its pages →
does data actually flow?*

### 5.1 Registration and sign-in — **complete**

| | |
|---|---|
| Backend | `modules/auth/` — `auth.service.ts`, `mfa.*`, `oauth.*` |
| Routes | `auth/signup`, `auth/login`, `auth/logout`, `auth/verify-email`(+`/code`), `auth/forgot-password`, `auth/reset-password`, `auth/magic-code/*`, `auth/mfa/*`, `auth/sessions`, `auth/csrf`, `auth/oauth/*` |
| Frontend | `features/auth/` → `app/(auth)/` |
| Status | Connected both ways. |

Two audiences share one backend but have **separate screens**:
`features/auth/components/*` for customers, `features/auth/components/business/*`
for providers. `BusinessAuthShell.tsx` is the split-screen frame.

Sessions are an opaque cookie (`toh_session`) plus a CSRF cookie (`toh_csrf`),
not JWTs. Sessions slide — every authenticated response may re-issue the cookie,
which is what `setSessionCookie(response, token, refreshedExpiresAt)` is doing
in every route handler.

### 5.2 Client onboarding — **complete**

`features/client-onboarding/` → `app/(client-onboarding)/client-onboarding/[[...step]]`.
Calls `customer/me`, `customer/consents`, `customer/policies`,
`customer/policy-acceptances`, `notifications/preferences`. Backend is
`modules/customers/`.

### 5.3 Provider onboarding (the business wizard) — **complete**

| | |
|---|---|
| Backend | `modules/professional-applications/` — `wizard.service.ts`, `wizard.repository.ts`, `handle.service.ts`, `application-address.ts`, `country-data.ts`, `wizard-storage.ts` |
| Routes | `professional-applications/wizard`, `…/step-1`, `…/step-2`, `…/step-3`, `…/submit`, `…/handle-availability`, `…/logo/upload-url`, `…/documents/upload-url`, `…/documents/confirm` |
| Frontend | `features/business-wizard/` → `app/(business)/business/setup/[[...step]]` |
| Status | Connected. |

How it works: a `DRAFT` application row is created on first open, each step
`PATCH`es its own fields (so "save & exit" needs no endpoint — everything is
already saved), and `submit` flips `DRAFT → PENDING`. The address is
`JSON.stringify`'d into a versioned envelope, then encrypted with
`encryptAddress()` into `addressCiphertext`/`addressIv`/`addressAuthTag`.
Identity documents go to a **private** bucket; the logo goes to the public one.

Admin approval (`admin/professional-applications/[id]/approve`) materialises
the real `BraiderProfile`, `BraiderLocation`, `Service` and `AvailabilityRule`
rows. That is the moment an application becomes a bookable business.

### 5.4 Discovery — **complete, reads real data**

`modules/discovery/` (+ `homepage.service.ts`, `location-privacy.ts`) →
`braiders/nearby`, `public/homepage`, `braiders/[braiderId]`.
Frontend: `features/discovery/` (`nearby.ts`, `business-data.ts`) →
`app/(public)/explore/*`, `/businesses/[businessId]/*`.

`location-privacy.ts` is what shifts the pin for private studios so a home
address is not exposed. **Do not change that logic.**

> `features/discovery/discovery-data.ts` is invented sample data. Discovery
> itself no longer uses it — but `features/booking/` and `features/bookings/`
> still do, as a fallback. See §7.

### 5.5 Booking — **connected, with a caveat**

| | |
|---|---|
| Backend | `modules/bookings/`, `modules/availability/` (`slot-generation.ts`, `hold.service.ts`) |
| Routes | `bookings`, `bookings/[id]`, `…/status`, `…/check-in`, `…/cancellation-quote`, `…/change-requests`, `…/consultation*`, `availability/holds`, `braiders/[id]/availability/slots`, `services/[id]/preview-price` |
| Frontend | `features/booking/components/BookingFlow.tsx` → `app/(booking)/book/[[...step]]` |
| Status | Connected. |

A slot is **held** (`availability/holds`) while the client finishes paying, so
two people cannot take the same time. Note `bookings/[id]/mock-confirm` — a
development shortcut that confirms a booking without real payment.

**Caveat:** `BookingFlow.tsx` is a single file of roughly 2,700 lines and falls
back to invented salons when live data fails to load. See §7.

### 5.6 Studio (the provider's app) — **the most complete area**

| | |
|---|---|
| Backend | `modules/business/` (20 files), `modules/braiders/`, `modules/services/`, `modules/availability/` |
| Routes | all of `business/*`, `braiders/*`, `services/*`, `availability/*` |
| Frontend | `features/studio/` → `app/(business-studio)/studio/*` (31 pages) |
| Status | Fully connected. No shells. |

`features/studio/components/` mirrors the sidebar one folder per section:
`overview/`, `calendar/`, `appointments/`, `clients/`, `waitlist/`, `services/`,
`availability/`, `team/`, `earnings/`, `portfolio/`, `analytics/`, `settings/`,
`help/`, plus `shell/` (sidebar, top bar, nav) and `ui/` (the design primitives).

If you are editing Studio UI, the primitives are in
`features/studio/components/ui/primitives.tsx` — `PageHeader`, `Card`, `Pill`,
`EmptyPanel`, `SkeletonRows`, `Segmented`, `KpiCard`. Use them rather than
inventing new styles.

One trap: the Studio toast is **called directly** —
`toast({ tone: "success", title: "…" })` — while the account-side toast is
`toast.success("…")`. They are different APIs.

### 5.7 Portfolio — **complete end to end as of today**

Three audiences, three folders, one consent model.

| Audience | Backend | Routes | Frontend |
|---|---|---|---|
| Client's own looks | `modules/customers/client-portfolio.*` | `customer/portfolio*`, `customer/stats`, `customer/favorites` | `features/account/portfolio/` → `/account/portfolio` |
| Provider's own work | `modules/reviews/provider-portfolio.*` | `braiders/portfolio`, `…/consents`, `…/[mediaId]`, `…/reorder` | `features/studio/components/portfolio/` → `/studio/portfolio` |
| Admin decision | `modules/reviews/portfolio-moderation.*` | `admin/portfolio-media`, `…/approve`, `…/reject` | `features/admin/moderation/` → `/admin/moderation` |

**The rule that shapes all of it:** a provider does not own these photos. Each
one exists because a client agreed, on one finished appointment, that their
hair could be shown (`PortfolioConsent`), and each is checked before the public
sees it (`PortfolioMedia.moderationStatus`). The chain is:

```
appointment COMPLETED
  -> client grants PortfolioConsent
  -> provider uploads against that consent   (PENDING_REVIEW)
  -> admin approves                          (APPROVED)
  -> appears on the public profile
  -> client may revoke at any time           (disappears; provider is told why)
```

`assertBraiderCanUseConsent` in `review.service.ts` enforces that the consent
exists, belongs to that provider, is not revoked, and its appointment is
completed. Everything else depends on it.

### 5.7b Client home — **new, on open branches**

| | |
|---|---|
| Backend | `modules/customers/client-home.service.ts` |
| Routes | `customer/home` (the whole dashboard in one request), `customer/recently-viewed/[braiderId]` |
| Frontend | `features/client-home/` -> `app/(client)/home`, `/activity`, `/saved`, `/notifications`, `/profile` |
| Status | Connected. Backend PR #37, frontend PRs #49 and #50. |

`app/(client)/` is the signed-in client group. Its chrome comes from
`ClientShell` (in `features/discovery/DiscoveryShell.tsx`), the same frame
the public discovery pages use, so a client moving between home, explore
and a profile stays inside one shell.

Two things to know before editing it:

- **Route guarding lives in `proxy.ts`, via `config/route-access.ts`'s
  `protectedRoutePrefixes`.** A layout calling `requireUser()` is not
  enough on its own - the whole `(client)` group was reachable signed-out
  until those paths were added to that list.
- The phone's five destinations are fixed in `ClientShell`'s `mobileNav`:
  Home, Search, AI Studio, Activity, Profile. Market is deliberately not
  one of them; it lives in the header.

`ServiceCategory` now carries `iconKey`, `displayOrder` and `isActive`, so
the category tiles are administrator-controlled. The frontend owns the
artwork (`features/client-home/CategoryGrid.tsx`); the backend only says
which key to draw.

### 5.8 Account and settings — **connected except the landing page**

`modules/customers/` + `modules/users/deletion.*` →
`customer/me`, `customer/addresses`, `customer/beauty-profile`,
`customer/consents`, `notifications/preferences`, `auth/sessions`,
`auth/account/delete`.
Frontend `features/account/settings/` → `/account/settings/*` — all eight
sub-pages are real.

**`/account` itself is still a shell.** See §6.

### 5.9 Messaging, disputes, reviews, AI Studio

| Area | Backend | Frontend | Status |
|---|---|---|---|
| Messaging | `modules/messaging/` → `messaging/conversations*` | `features/messaging/` → `/messages`, `/studio/messages` | connected |
| Disputes (client) | `modules/resolution/` → `resolution/disputes*` | `features/resolution/` → `/disputes*` | connected for the client |
| AI Studio | `modules/studio/` + `modules/credits/` → `studio/generate`, `studio/credits`, `studio/sessions`, `studio/styles`, `studio/share` | `features/ai-studio/` → `/ai-studio` | connected |
| Reviews | `modules/reviews/review.service.ts` → `bookings/[id]/review`, `braiders/[id]/reviews`, `reviews/[id]/response` | read path only | **provider cannot reply — see §7** |

Note `modules/studio/` is the **AI Studio** (try-on, credits, styles). The
provider's business app is `modules/business/`. The word "studio" means two
different things in this codebase, which is the single most confusing naming
choice in the system.

---

## 6. What is not built

### 6.1 Shell pages — 15 of 118

They render `components/layout/RouteStatusPage.tsx`, which shows a title, a
description, and a "Backend contract:" line. They call no API. Content comes
from `config/page-content.ts`.

Three of them are fine — they are fallbacks inside catch-all routes that render
real components for known paths (`/bookings/[[...appointmentId]]`,
`/book/[[...step]]`, and the unknown-section case).

The remaining **12 are genuinely unbuilt**:

| Page | Backend available? | Work needed |
|---|---|---|
| `/account` | composable from existing endpoints | **frontend only** |
| `/admin/audit` | ✅ `admin/audit` exists | **frontend only** |
| `/admin/disputes`, `/admin/disputes/[caseId]` | ✅ mostly — `resolution/disputes` + `assign` + `decide` | **frontend mostly** |
| `/admin/payouts` | partial — `professional/payouts` is provider-scoped | frontend + some backend |
| `/support/[[...caseId]]` | ❌ none | full stack |
| `/admin/users`, `/admin/users/[userId]` | ❌ none | full stack |
| `/admin/businesses`, `/admin/businesses/[businessId]` | ❌ none | full stack |
| `/admin/payments` | ❌ none | full stack |
| `/admin/appointments` | ❌ none | full stack |
| `/admin/support` | ❌ none | full stack |

Start with the first three: they are frontend-only and close the most visible
gaps. `/account` matters most — a client signs in and lands on a shell.

### 6.2 The admin console's sample data

`features/admin/pages/AdminSectionPages.tsx` and
`features/admin/data/admin-console-data.ts` carry this comment:

> `// TODO: replace with real API — sample data (the metrics and rows below are invented)`

These render through `app/(admin)/admin/[[...section]]/page.tsx`. The sidebar
shows Bookings, Businesses, Clients, Marketplace, Orders, Products, Payouts &
Finance, Marketing, Reports & Analytics, Reviews, Disputes, Support Tickets —
**most of those numbers are invented.** The real admin pages are Applications,
Policies, Settings, System, and now Moderation.

### 6.3 Not wired

- `features/account/settings/PaymentMethodsSettings.tsx` — `// TODO: wire to Stripe payment methods API once endpoint exists`
- `features/studio/components/settings/LocationSettings.tsx:762` — `// TODO: wire to travel fee endpoint once created`
- `features/admin/platform/SystemHealth.tsx` — no backup schedule is recorded anywhere yet

---

## 7. What is built but not connected

**Closed since this was written:** a client can now leave a review, grant
and withdraw photo consent, save a professional, and have their profile
views recorded - all four were endpoints with no screen behind them. The
marketplace feature flag now actually switches the shop off server-side
rather than only changing a number on an admin screen.

**28 backend routes were not mentioned anywhere in the frontend** when
this was first written. Four of those
are correct — webhooks are called by Stripe and payment providers, and
`auth/oauth-internal/[...nextauth]` is internal. The rest are real gaps:

### The whole commerce module — 13 routes, zero frontend

```
commerce/cart              commerce/products
commerce/cart/items        commerce/products/[productId]
commerce/cart/items/[id]   commerce/products/[id]/variants
commerce/cart/merge        commerce/products/[id]/variants/[variantId]
commerce/categories        commerce/products/[id]/media
commerce/checkout          commerce/products/[id]/media/[mediaId]
commerce/orders            commerce/products/[id]/media/upload-url
commerce/orders/[orderId]
```

Meanwhile `app/(public)/marketplace/page.tsx` renders a **hardcoded array of
eight fake products**. A complete shop backend — cart, checkout, orders,
variants, product media, guest-cart merging — exists in `modules/commerce/` and
nothing calls it.

This is the largest single disconnect in the system, and probably the highest
value thing you could wire up: the backend work is already done.

There is also a dangling contract string in
`features/home/config/home-content.ts:184` pointing at
`/api/v1/marketplace/public/products` — **that route does not exist**. The real
one is `commerce/products`.

### Customer waitlist — 4 routes, zero frontend

`waitlist`, `waitlist/[entryId]`, `waitlist/offers/[offerId]/accept`,
`waitlist/offers/[offerId]/decline`.

The *business* side is fully built (`/studio/waitlist` → `business/waitlist*`),
so a provider can add someone to a waitlist and send an offer — but **the
client has no screen to accept or decline it.** The loop does not close.

### Smaller ones

| Route | Missing |
|---|---|
| `reviews/[reviewId]/response` | Provider cannot reply to a review anywhere in the UI |

| `customer/portfolio/collections`, `…/[collectionId]` | Collections exist in the backend; the client portfolio page has no UI for them |
| `customer/portfolio-consents` | Client cannot review or revoke their consents from their own account |
| `financial/ledger/accounts` | No screen |
| `auth/mfa/disable` | Setup and verify are wired; turning MFA off is not |

That last group matters more than it looks: **a client can grant portfolio
consent but has no screen to take it back.** The backend supports revocation
and the provider's page correctly shows a revoked photo — there is just no
client-facing control.

---

## 8. Where I am confused or unsure

Honest list. These are things I could not resolve from the code.

1. **The private/public storage split is decorative.** The schema constrains
   `PortfolioMedia.storageKey` to `private/portfolio-pending/%` or
   `public/portfolio/%`, implying approval moves the object. **No code has ever
   moved it.** `confirmPortfolioMediaUpload` writes `r2Url` as
   *publicBaseUrl + the pending key*, and the public endpoint serves that same
   URL. So an approved photo is served from a path named "private". I built an
   object-move step, found it contradicted the existing design, and removed it.
   **I do not know which half is intended.** Either the move should exist, or
   the constraint and the `private/` prefix are misleading and should go.

2. **Two things are called "studio".** `modules/studio/` is AI try-on;
   `(business-studio)` and `modules/business/` are the provider's app. I would
   rename one, but I do not know which name you consider canonical.

3. **`/admin/[[...section]]` overlaps the real admin pages.** A catch-all
   renders invented data for a dozen sections while specific routes render real
   pages. I cannot tell whether the catch-all is a design mock to build against
   or dead weight to delete.

4. **`professional-application/` vs `business-wizard/`.** Two frontend folders
   and two backend paths (`professional-applications` one-shot, and
   `professional-applications/wizard`) do overlapping jobs. Both work. I do not
   know if the old one still has users.

5. **Admin users / businesses / payments are product decisions, not coding
   ones.** What an admin may do to a user account — suspend, impersonate,
   force-reset, delete — is a policy question. I did not want to invent it.

6. **Reviews have no moderation.** Portfolio photos now do. Reviews are
   published as written. Whether that is intended, I do not know.

Not a worry, checked: `bookings/[appointmentId]/mock-confirm` confirms a
booking without payment, but `confirmMockAppointmentForDevelopment` in
`booking.service.ts:275` refuses unless `APP_ENV` is `development` or `test`
**and** `STRIPE_MODE` is not `live`. The guard is in the service rather than
the route — which is the right place, and worth knowing if you go looking for
it in `route.ts` and find nothing.

---

## 9. Traps that have cost real time

These have each bitten more than once.

1. **A stale dev-server route manifest.** After `git checkout`, a branch
   switch, or adding a new nested route folder, the running Next dev server
   keeps its old route list. Symptoms: a page you just wrote renders the *old*
   version, or a new endpoint returns **404** (which surfaces in the browser as
   a **CORS error**, because a 404 preflight has no CORS headers). This is what
   made `/studio/portfolio` appear to still say "Coming soon".
   **Fix: stop the dev server, delete `.next`, restart.** Do this after every
   branch switch.

2. **Neither `dev` script pins a port.** Both are plain `next dev`, which
   defaults to 3000. Whichever starts first wins, so starting them together can
   put the frontend on 3000 and the backend on 3001 — everything then looks
   broken. Start the backend first, or:
   ```
   cd Backend_for_HOF  && PORT=3000 npm run dev
   cd Frontend_for_HOF && PORT=3001 npm run dev
   ```
   `CORS_ALLOWED_ORIGINS` in `Backend_for_HOF/.env.local` is `http://localhost:3001`
   only, so the frontend must be on 3001.

3. **Integration tests need Mailpit.** Without it ~220 of 240 fail with
   `ECONNREFUSED :8025`. That is not a code failure.

4. **Migrations must be diffed against the committed schema**, never a live
   database that is ahead:
   ```
   npx prisma migrate diff --from-schema <committed> --to-schema <current> --script
   ```
   Interactive `prisma migrate dev` does not work in this shell. Diffing
   against a live DB once generated a destructive migration.

5. **`exactOptionalPropertyTypes: true`.** Explicit `undefined` is not
   assignable. Use a per-field spread (`...(x !== undefined ? { x } : {})`) or
   type the field `?: T | undefined`.

6. **Real data that is merely empty, replaced by invented data.** This pattern
   has appeared three times — the discovery map, AI Studio, and still today in
   `BookingFlow.tsx` and `AppointmentDetails.tsx`, which fall back to invented
   salons from `discovery-data.ts` when a request fails. In a demo this shows
   fake businesses to a real user. An empty state is almost always better.

---

## 10. Suggested order of work

1. ~~`/account`~~ - done, and `/home` is now the real client dashboard.
2. `/admin/audit` — frontend only, endpoint exists.
3. ~~Remove the invented-salon fallbacks~~ - done.
4. `/admin/disputes` — backend is largely there.
5. **Wire the marketplace to `commerce/*`** — the biggest payoff, since the
   backend is finished.
6. Client waitlist screens, so provider offers can be accepted.
7. Client-facing consent revocation, so §7's gap closes.
8. The heavy admin pages, once you have decided what an admin may actually do.

---

## 11. Where things live, in one table

| I want to change… | Backend | Frontend |
|---|---|---|
| Sign-up / sign-in / MFA | `modules/auth/` | `features/auth/` → `app/(auth)/` |
| Client first-run | `modules/customers/` | `features/client-onboarding/` |
| Provider application | `modules/professional-applications/` | `features/business-wizard/` → `app/(business)/` |
| Search / map / profiles | `modules/discovery/`, `modules/braiders/` | `features/discovery/` → `app/(public)/` |
| Booking and payment | `modules/bookings/`, `modules/availability/`, `modules/payments/` | `features/booking/` → `app/(booking)/` |
| Provider app | `modules/business/`, `modules/services/` | `features/studio/` → `app/(business-studio)/` |
| Client account | `modules/customers/`, `modules/users/` | `features/account/` → `app/(account)/` |
| Portfolio (all three sides) | `modules/reviews/`, `modules/customers/client-portfolio.*` | `features/account/portfolio/`, `features/studio/components/portfolio/`, `features/admin/moderation/` |
| Shop | `modules/commerce/` | **nothing yet** — `app/(public)/marketplace` is hardcoded |
| Messages | `modules/messaging/` | `features/messaging/` |
| Disputes | `modules/resolution/` | `features/resolution/` (client only) |
| AI try-on | `modules/studio/`, `modules/credits/` | `features/ai-studio/` |
| Admin | `modules/platform/`, `modules/professional-applications/`, `modules/reviews/portfolio-moderation.*` | `features/admin/` → `app/(admin)/` |
| Email | `modules/notifications/`, `lib/email/` | — |
| Money ledger | `modules/ledger/`, `modules/payments/` | **nothing yet** |
