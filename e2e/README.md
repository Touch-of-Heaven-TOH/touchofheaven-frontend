# End-to-end settings suites

These drive a real browser against a **running stack** — frontend on 3001,
backend on 3000, Postgres and Mailpit up — and check that every settings
page reads and writes real data.

They are not part of `npm test`. That suite must stay runnable with nothing
else switched on; these need the whole system running.

## Running them

Start everything first (see `RUNBOOK.md` at the repo root), then:

```bash
npm run e2e:client     # client account settings
npm run e2e:studio     # business studio settings
npm run e2e:admin      # admin settings
npm run e2e:settings   # all three, in order
```

Each prints one line per check and exits non-zero if anything failed:

```
PASS  profile: pre-filled from the database
PASS  profile: the save reaches PATCH /customer/me
FAIL  profile: the change survives a reload  (Nadia Fotso)

CLIENT 29/30 passed
   FAIL profile: the change survives a reload (Nadia Fotso)
```

## What they actually check

Not "does the page render". Each suite asserts, per page:

- the page **calls the endpoint it claims to** (requests are recorded, so a
  page that renders beautifully while calling nothing is caught)
- fields are **pre-filled from the database**, not blank
- a save **reaches the right endpoint** and **survives a reload**
- nothing is written to the browser console

## Before you run them

- **Use a development database.** The admin suite writes real platform
  settings — the platform fee and maintenance mode — and puts them back
  afterwards. It should never point at production.
- **The first run is slow.** The dev server compiles each route the first
  time it is opened; a cold route can take close to a minute. The timeouts
  here allow for that, so let it run.
- Override the URLs with `E2E_BASE_URL` and `E2E_API_URL` if your ports
  differ from 3001 and 3000.

## Demo data

The suites sign in through `/dev/preview-sign-in` as the demo client,
business owner and admin. If the admin application queue is empty, reset
the demo applications with, from the backend repo:

```bash
npm run demo:reset
```
