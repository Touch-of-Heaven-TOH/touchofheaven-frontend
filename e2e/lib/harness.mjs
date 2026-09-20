/**
 * Shared plumbing for the end-to-end settings suites.
 *
 * These run against a real, running pair of servers (frontend on 3001,
 * backend on 3000) and a real database. They are deliberately not part of
 * `npm test`: that suite must stay runnable with nothing else switched on,
 * and these need the whole stack up. Run them with `npm run e2e:*`.
 *
 * Every timeout here is generous on purpose. The dev server compiles each
 * route the first time it is opened, and a cold route can take the better
 * part of a minute - a short timeout turns that into a fake failure.
 */

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3001";
export const API = process.env.E2E_API_URL ?? "http://localhost:3000";

/** Long enough to sit through a cold Turbopack compile. */
export const NAV_TIMEOUT = 240_000;
export const WAIT_TIMEOUT = 120_000;

export function createRecorder() {
  const rows = [];
  const issues = [];
  return {
    rows,
    issues,
    check(name, ok, detail = "") {
      rows.push({ name, ok, detail });
      console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
    },
    /** Returns the process exit code, so a suite ends on its own result. */
    report(label) {
      console.log("\n=== console errors and warnings ===");
      console.log(issues.length ? [...new Set(issues)].join("\n") : "none");
      const failed = rows.filter((r) => !r.ok);
      console.log(`\n${label} ${rows.length - failed.length}/${rows.length} passed`);
      for (const f of failed) console.log(`   FAIL ${f.name}${f.detail ? ` (${f.detail})` : ""}`);
      return failed.length > 0 ? 1 : 0;
    },
  };
}

/**
 * Wires a page up so a suite can ask two questions it otherwise could not:
 * which API calls a page made, and whether anything was logged to the
 * console. A settings page that renders correctly while calling nothing is
 * not connected, and this is how that gets caught.
 */
export function instrument(page, issues) {
  const state = { calls: [] };
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/v1/")) state.calls.push(`${request.method()} ${url.replace(API, "")}`);
  });
  page.on("console", (message) => {
    // A headless GPU warning says nothing about the application.
    if ((message.type() === "error" || message.type() === "warning") && !message.text().includes("GPU stall")) {
      issues.push(`${message.type()}: ${message.text().slice(0, 180)} @ ${page.url().replace(BASE, "")}`);
    }
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message.slice(0, 180)} @ ${page.url().replace(BASE, "")}`);
  });
  return state;
}

/** Navigates, clearing the recorded calls so `called()` describes this page. */
export async function open(page, state, path) {
  state.calls = [];
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      break;
    } catch (error) {
      // Headless Chromium occasionally drops the socket while a cold route
      // compiles. Retry before calling it a failure.
      if (attempt >= 2) throw error;
    }
  }
  await page.waitForLoadState("networkidle", { timeout: WAIT_TIMEOUT }).catch(() => undefined);
}

export async function reload(page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.reload({ waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      break;
    } catch (error) {
      if (attempt >= 2) throw error;
    }
  }
  await page.waitForLoadState("networkidle", { timeout: WAIT_TIMEOUT }).catch(() => undefined);
}

/** Signs in through the development preview route as one of the demo users. */
export async function signIn(page, state, as, next) {
  await open(page, state, `/dev/preview-sign-in?as=${as}&next=${encodeURIComponent(next)}`);
  await page.waitForURL((url) => !url.pathname.includes("preview-sign-in"), { timeout: WAIT_TIMEOUT });
}

export const bodyText = (page) => page.locator("body").innerText();
export const called = (state, fragment) => state.calls.some((call) => call.includes(fragment));
