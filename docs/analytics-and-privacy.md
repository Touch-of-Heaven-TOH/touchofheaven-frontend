# Analytics And Privacy

Analytics must never collect private appointment, consultation, address,
payment, support, admin, or policy-acceptance data.

Optional analytics scripts must not load until consent permits them. Essential
security cookies are required for authentication and CSRF protection and cannot
be disabled inside cookie preferences.

Allowed public analytics fields should be coarse:

- Route family, not private identifiers.
- Public discovery filters, not exact private address.
- Booking step name, not consultation content.
- Error category, not stack trace or raw backend payload.
