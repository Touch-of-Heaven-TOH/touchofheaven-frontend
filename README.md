# Touch of Heaven — Frontend

The customer- and braider-facing web application for Touch of Heaven, built on Next.js 16 (App Router), React 19, and TypeScript. This app renders the platform's UI and talks to the backend exclusively over its public REST API — it never accesses PostgreSQL, Prisma, or any database directly.

## Related repositories

Touch of Heaven is split across two repositories under the [Touch-of-Heaven-TOH](https://github.com/Touch-of-Heaven-TOH) organization:

| Repository | Purpose |
| --- | --- |
| [`Backend-of-TOH`](https://github.com/Touch-of-Heaven-TOH/Backend-of-TOH) | Next.js API-only backend — Prisma/PostgreSQL, authentication, bookings, payments, and every `/api/v1/*` route this app calls. |
| [`touchofheaven-frontend`](https://github.com/Touch-of-Heaven-TOH/touchofheaven-frontend) (this repo) | The browser application — pages, components, and client-side data fetching against the backend's API. |

This app's `NEXT_PUBLIC_API_URL` (see below) points at a running instance of the backend. Both repos are developed together but deployed and versioned independently.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS v4
- Framer Motion for UI animation
- Google Maps JavaScript API + Geocoding API for the braider discovery map (see [`docs/map-feature.md`](./docs/map-feature.md) once the map feature lands)
- Vitest for unit/integration tests, Playwright for end-to-end tests
- ESLint (flat config) and Prettier

## Install and configure

```powershell
npm install
Copy-Item .env.example .env.local
```

Replace every placeholder in `.env.local`. Never commit `.env.local` — it's already covered by `.gitignore`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `http://localhost:3001` in development) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side Google Maps JavaScript API key, restricted to this app's domain(s) |

## Development

```powershell
npm run dev
```

Requires the backend (`Backend-of-TOH`) running separately and reachable at `NEXT_PUBLIC_API_URL`.

## Testing

```powershell
npm run test:unit
npm run test:e2e
```
