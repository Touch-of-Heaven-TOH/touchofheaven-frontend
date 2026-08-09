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
