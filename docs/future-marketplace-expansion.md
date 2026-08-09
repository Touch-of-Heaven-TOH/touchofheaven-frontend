# Future Marketplace Expansion

The current `/marketplace` route is a public preview only. Marketplace and
seller functionality should stay disabled until product,
inventory, cart, order, fulfillment, seller approval, commission, payout, and
marketplace administration flows are production-ready in the backend.

When activated, use separate feature modules:

| Module | Routes |
| --- | --- |
| Product catalog | `/marketplace`, `/marketplace/[category]`, `/marketplace/product/[slug]` |
| Cart and checkout | `/cart`, `/checkout`, `/checkout/success` |
| Orders | `/account/orders`, `/account/orders/[id]` |
| Seller center | `/seller`, `/seller/products`, `/seller/orders`, `/seller/payouts` |
| Marketplace admin | `/admin/marketplace`, `/admin/refunds`, `/admin/moderation` |

Do not link to fake shopping actions. Coming-soon public copy is acceptable only
when it does not imply users can purchase products today.
