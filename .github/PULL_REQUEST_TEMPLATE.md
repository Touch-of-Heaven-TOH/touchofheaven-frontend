## What changed and why

<!-- One or two sentences. Link the issue/task if there is one. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck`, and `npm test` all pass locally
- [ ] No `NEXT_PUBLIC_*` variable added for a value that isn't safe to be public
- [ ] No component makes a direct database call or imports backend code
- [ ] No client component calls `fetch()` directly (goes through a hook + `lib/api/`)
- [ ] If a route's auth/role/MFA requirement changed, `config/route-access.ts`,
      `proxy.ts`, `docs/route-access-matrix.md`, and
      `docs/file-structure-routing-security.md` are all updated together
- [ ] If a new route was added, it's reflected in `app/sitemap.ts` (if public)
      or `app/robots.ts` (if it must stay unindexed)
- [ ] UI changes verified at 375px and 1280px, with visible keyboard focus
      states on every interactive element
- [ ] Loading, empty, and error states are all implemented, not just the
      happy path
