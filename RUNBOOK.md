# Running Touch of Heaven locally

Everything you need to start the whole system by hand and test it end to
end, with no help and no internet beyond what npm already installed.

There are **four things** to start, in this order:

| # | Thing | Where it ends up | Why it is needed |
|---|---|---|---|
| 1 | PostgreSQL 18 | `localhost:5432` | all the data |
| 2 | Mailpit | `localhost:8025` | catches every email the app sends |
| 3 | Backend (API) | `localhost:3000` | every endpoint |
| 4 | Frontend (web) | `localhost:3001` | the site itself |

The two repos are separate. Throughout:

- **Backend** = `C:\Develop\Touch_of_Heaven\Backend_for_HOF`
- **Frontend** = `C:\Develop\Touch_of_Heaven\Frontend_for_HOF`

---

## 1. Start PostgreSQL

Normally it runs as a Windows service. Check first:

```powershell
Get-Service postgresql-x64-18
```

If it says `Running`, skip to step 2. If it says `Stopped`, start it —
**this needs an Administrator PowerShell**:

```powershell
Start-Service postgresql-x64-18
```

> If you get "Access is denied", you did not open PowerShell as
> Administrator. Right-click PowerShell → *Run as administrator*.

### If you cannot get Administrator rights

You can start the server directly as your own user instead. It works, but
it **does not survive a reboot** — you have to run it again each time:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" -w -t 90 start
```

If that says *"could not bind ... another postmaster already running"* but
nothing is actually on the port, it is a stale socket. Wait ten seconds and
run it again — it usually works on the second try.

### Confirm it is up

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h localhost -p 5432
```

You want: `localhost:5432 - accepting connections`.

---

## 2. Start Mailpit (the email catcher)

Nothing is sent to real inboxes in development. Mailpit pretends to be a
mail server and shows you everything the app tried to send — verification
emails, application decisions, booking confirmations.

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\axllent.mailpit_Microsoft.Winget.Source_8wekyb3d8bbwe\mailpit.exe"
```

Leave that window open. Open <http://localhost:8025> to read the mail.

> The backend is configured to send to `localhost:1025`, which is Mailpit's
> SMTP port. If Mailpit is not running, emails fail silently — the app
> records a `FAILED` notification rather than crashing, so a booking still
> works, you just get no email.

---

## 3. Start the backend

New terminal:

```powershell
cd C:\Develop\Touch_of_Heaven\Backend_for_HOF
npm install                  # first time, or after pulling
npx prisma generate          # after any schema change
npx prisma migrate deploy    # applies any new migrations
npm run dev
```

Wait for `✓ Ready` and `http://localhost:3000`.

### Confirm it is up

```powershell
curl http://localhost:3000/api/v1/health/ready
```

You want `"status":"ready"` and `"database":"ok"`. If the database is down
you get a 503 here — that is the fastest way to tell these two apart.

---

## 4. Start the frontend

Another new terminal. **The port matters** — the backend only accepts
browser requests from `localhost:3001`:

```powershell
cd C:\Develop\Touch_of_Heaven\Frontend_for_HOF
npm install                  # first time, or after pulling
npm run dev -- --port 3001
```

Open <http://localhost:3001>.

> **The first visit to any page is slow** — often 20–60 seconds. The dev
> server compiles each route the first time it is opened. It is not frozen.
> The second visit is instant.

---

## Testing it by hand

### Start at the page hub

<http://localhost:3001/dev> lists **every page in the app** and how far it
is built, with one-click sign-in for each role. This is the fastest way in.

Each page is tagged:

- **connected** — reads and writes real data
- **demo** — looks finished, shows made-up numbers
- **placeholder** — a description only
- **soon** — a designed "coming soon" page

### The three demo accounts

Sign in from `/dev`, or go straight to these links:

| Role | Link |
|---|---|
| Client (Nadia Fotso) | `/dev/preview-sign-in?as=customer&next=/account/settings` |
| Business owner (Amara) | `/dev/preview-sign-in?as=owner&next=/studio/settings` |
| Admin | `/dev/preview-sign-in?as=admin&next=/admin/settings` |

Signing in as one signs you out of the other — it is one browser session.
To be two people at once, use a normal window and a private window.

### A good end-to-end pass

1. **As the client** — `/account/settings`. Change your name, save, reload:
   the new name should still be there. Pick a hair type under *Beauty
   profile*, save, reload.
2. **As the business owner** — `/studio/settings`. Check the completion
   percentage is a real number. Change the business name, save, then press
   *Preview my public profile* — the public page should show your change.
3. **As the admin** — `/admin/applications`. Open an application, approve or
   reject it. Then check <http://localhost:8025>: the applicant's email is
   sitting there.
4. **Maintenance mode** — as the admin, `/admin/system`, switch maintenance
   on with a message. Open <http://localhost:3001> in a private window: the
   banner is there for a signed-out visitor. Switch it back off.

### If the admin queue is empty

Every application has been decided. Put them back:

```powershell
cd C:\Develop\Touch_of_Heaven\Backend_for_HOF
npm run demo:reset
```

---

## Running the automated checks

With everything above running:

```powershell
# Frontend
cd C:\Develop\Touch_of_Heaven\Frontend_for_HOF
npm run typecheck
npm run lint
npm test              # unit tests, no servers needed
npm run build         # must pass with zero errors
npm run e2e:settings  # drives a real browser over every settings page

# Backend
cd C:\Develop\Touch_of_Heaven\Backend_for_HOF
npm run typecheck
npm run lint
npm run test:all      # unit + integration, needs Postgres and Mailpit
```

`npm run e2e:settings` is the one that proves the front end and back end are
really talking to each other — see `e2e/README.md`.

---

## When something is wrong

**A page hangs on first load.** Normal. It is compiling. Give it a minute.

**Everything returns 401.** You are signed out. Sign in again from `/dev`.

**"Can't reach database server at localhost:5432".** Postgres is not
running — go back to step 1.

**The frontend loads but every panel shows an error.** The backend is not
running, or is on the wrong port. Check
`curl http://localhost:3000/api/v1/health/ready`.

**CORS errors in the browser console.** The frontend is not on port 3001.
Stop it and start it with `-- --port 3001`.

**"Another next dev server is already running".** An old one is still
holding the port. The message prints its PID; stop it with
`taskkill /PID <pid> /F`, then start again.

**A page shows old data after you changed something.** Reload once. If it
persists, the save genuinely did not happen — check the browser's Network
tab for the `PATCH` and what it answered.

**Prisma complains about a column that should exist.** The running server is
using a client generated before your schema change. Stop the backend, run
`npx prisma generate`, start it again.

---

## Stopping everything

`Ctrl+C` in each terminal. Postgres keeps running as a service unless you
started it with `pg_ctl`, in which case:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" stop
```

Your data stays on disk either way.
