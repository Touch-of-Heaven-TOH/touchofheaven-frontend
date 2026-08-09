# Accessibility Standard

Target WCAG 2.2 AA.

## Required

- Keyboard access for navigation, forms, dialogs, drawers, and map controls.
- Visible focus state for links, buttons, fields, and custom controls.
- Programmatic labels for all form fields.
- Clear loading, empty, success, and error states.
- Text contrast that passes AA in normal and large text contexts.
- Reduced-motion support for animation.
- Page metadata and useful titles for every route.

## Testing

Use manual keyboard passes at 375px and 1280px. Add Playwright and axe coverage
once the test dependencies are introduced.
