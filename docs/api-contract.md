# API Contract

The frontend consumes the existing backend under `NEXT_PUBLIC_API_URL` in the
browser and `BACKEND_INTERNAL_API_URL` on the server when set. Both clients use
the `/api/v1` REST contract and expect the backend response envelope:

```ts
type ApiEnvelope<T> =
  | { success: true; data: T; requestId: string }
  | {
      success: false;
      error: { code: string; message: string; details?: unknown };
      requestId: string;
    };
```

## Client Rules

- Browser mutations call `/api/v1/auth/csrf` first and send `X-CSRF-Token`.
- Browser requests use `credentials: "include"`.
- Server requests forward the incoming `Cookie` header.
- Account, booking, studio, admin, payment, support, and consultation data use
  no-store caching.
- Components do not call databases or backend modules directly.

## Endpoint Families

| Area | Backend endpoints |
| --- | --- |
| Auth | `/api/v1/auth/signup`, `/login`, `/logout`, `/logout-all`, `/me`, `/csrf`, `/verify-email`, `/forgot-password`, `/reset-password`, `/mfa/*`, `/oauth/*` |
| Discovery | `/api/v1/braiders/nearby`, `/api/v1/braiders/[braiderId]/services`, `/api/v1/braiders/[braiderId]/reviews` |
| Availability | `/api/v1/availability/rules`, `/blocked-periods`, `/holds`, `/api/v1/braiders/[braiderId]/availability/slots` |
| Bookings | `/api/v1/bookings`, `/api/v1/bookings/[appointmentId]`, `/consultation`, `/review`, `/status`, `/portfolio-consents` |
| Customer | `/api/v1/customer/account-summary`, `/me`, `/addresses`, `/consents`, `/policies`, `/policy-acceptances` |
| Braider | `/api/v1/braiders/profile`, `/locations`, `/service-areas`, `/portfolio` |
| Services | `/api/v1/services`, `/api/v1/services/[serviceId]`, `/media`, `/variations`, `/status` |
| Payments | `/api/v1/payments/mobile-money`, `/api/v1/payments/[paymentId]`, `/refresh` |
| Commerce | `/api/v1/commerce/cart`, `/categories`, `/products`, `/checkout`, `/orders` |
| Notifications | `/api/v1/notifications/preferences` |
| Health | `/api/v1/health/live`, `/api/v1/health/ready` |

Generated OpenAPI types should replace hand-maintained request/response shapes
once the backend exports an OpenAPI document.
