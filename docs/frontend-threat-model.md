# Frontend Threat Model

## Boundaries

The browser is untrusted. All sessions, roles, resource ownership, MFA state,
payment state, uploads, and private data access are verified by the backend.
Frontend checks improve user experience and reduce accidental exposure, but
they are never final authorization.

## Threats And Controls

| Threat | Frontend control | Backend authority |
| --- | --- | --- |
| Route probing | Proxy redirects instead of `401` or `403`. | Backend still rejects unauthorized requests. |
| XSS | Nonce CSP, no broad wildcards, controlled third-party domains. | Sanitization and safe response shaping. |
| CSRF | Browser API client retrieves `/api/v1/auth/csrf` and attaches `X-CSRF-Token` to mutations. | Cookie/header token comparison. |
| IDOR | Protected pages never assume changed IDs are valid. | Appointment, customer, braider, and admin endpoints verify ownership. |
| Open redirect | `safeReturnUrl` only accepts same-origin relative paths. | Backend validates callback destinations too. |
| Token theft | No session, MFA, access, or payment tokens in browser storage. | HTTP-only session cookies and rotation. |
| Payment leakage | Payment pages must use provider elements or mobile money provider flows. | Secrets and provider calls stay server-side. |
| Private location exposure | Public copy says public area only. | Backend controls precise vs approximate coordinates. |
| Consultation privacy | Consultation milestones are protected and no-store. | Private media uses backend-issued upload URLs. |
| Role escalation | No role fields in client forms. | Backend grants roles only through domain flows. |
| Supply chain | Keep dependency list intentional and run audit before release. | Release process blocks vulnerable builds. |

## CSP Sources

The proxy allowlists the app origin, backend API origin, Stripe, Supabase,
Mapbox, Google Maps, Google Fonts, and approved image storage domains. New
third-party scripts require a documented purpose and an explicit CSP update.
