# Responsive Behaviour

The same routes and components serve mobile and desktop. Layout changes should
adapt the structure, not duplicate the application.

| Viewport | Expectations |
| --- | --- |
| 375px | Single-column content, usable nav drawer, 44px controls, no text overlap. |
| 768px | Two-column sections where helpful, dashboard nav remains scrollable. |
| 1280px | Stable dashboard sidebar, denser tables/cards, clear action alignment. |

## Required Checks

- Homepage first viewport shows brand, purpose, and booking action.
- Dashboard pages avoid unusable wide tables on mobile.
- Form labels, errors, and buttons remain readable at 375px.
- Fixed-format UI such as calendars, maps, and counters use stable dimensions.
