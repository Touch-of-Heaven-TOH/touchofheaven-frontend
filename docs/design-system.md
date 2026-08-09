# Design System

The design foundation lives in `styles/tokens.css`, `styles/typography.css`,
and `styles/utilities.css`.

## Tokens

| Token | Purpose |
| --- | --- |
| `--color-brand` | Primary CTAs, role accent, route labels. |
| `--color-accent` | Focus ring, secondary confirmation, interactive emphasis. |
| `--color-gold` | Premium appointment and brand highlight. |
| `--color-surface` | Cards, forms, panels, header. |
| `--color-page` | Page background. |
| `--color-text-primary` | Main text. |
| `--color-text-muted` | Supporting copy. |
| `--color-danger`, `--color-success`, `--color-warning` | State feedback. |

## Rules

- Prefer Server Components unless browser state or APIs are required.
- Use semantic tokens before raw colors.
- Keep cards at 8px radius or less.
- Controls must have visible focus states and 44px minimum touch targets.
- Respect `prefers-reduced-motion`.
- Do not use feature-explainer text inside tool surfaces when the UI itself can
  make the workflow clear.
