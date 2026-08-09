# Route Access Matrix

Route discovery is not treated as security. The proxy provides fast redirects,
protected layouts perform server session checks, and the backend remains the
final authorization authority.

| Family | Routes | Auth | Roles | MFA | Denied redirect | Cache | Indexing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public | `/`, `/about`, `/how-it-works`, `/braiders`, `/map`, `/beauty`, `/contact`, `/legal/*` | No | Anyone | No | n/a | Public where backend permits | Index |
| Marketplace preview | `/marketplace` | No | Anyone | No | n/a | Static preview | Noindex |
| Auth | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auth-error` | Guest screens | Anyone | No | `/account` if already signed in | No-store | Noindex |
| MFA | `/mfa` | Pending MFA or signed-in session | Anyone | Challenge flow | `/sign-in` | No-store | Noindex |
| Booking | `/book`, `/book/*` | Yes | Customer-compatible signed-in user | Backend-enforced where needed | `/sign-in` | No-store | Noindex |
| Account | `/account`, `/account/*` | Yes | Signed-in account | Backend-enforced for sensitive actions | `/sign-in` | No-store | Noindex |
| Bookings alias | `/bookings`, `/bookings/*` | Yes | Signed-in account | Backend-enforced for sensitive actions | `/sign-in` | No-store | Noindex |
| Support | `/support`, `/support/*` | Yes | Signed-in account | Backend-enforced for sensitive actions | `/sign-in` | No-store | Noindex |
| Professional application | `/professional-application`, `/professional-application/*` | Yes | Signed-in account | Backend-enforced for sensitive actions | `/sign-in` | No-store | Noindex |
| Studio | `/studio`, `/studio/*` | Yes | `BRAIDER` | Backend-enforced | `/account` | No-store | Noindex |
| Admin | `/admin`, `/admin/*` | Yes | `ADMIN` | Required by policy and backend auth flows | `/account` | No-store | Noindex |

## Proxy Behavior

- Allows public pages through.
- Redirects unauthenticated protected routes to `/sign-in?callbackUrl=...`.
- Redirects signed-in users away from guest-only pages to `/account`.
- Redirects `/mfa` to `/sign-in` when neither a pending MFA cookie nor a
  session cookie is present.
- Sets CSP nonce and security headers on every matched response.
- Never returns `401` or `403`.

## Robots And Sitemap

`app/robots.ts` blocks `/account`, `/studio`, `/admin`, `/book`, `/checkout`,
and `/api`. `app/sitemap.ts` includes only public routes and public policies.
Authenticated routes must not enter the sitemap.
