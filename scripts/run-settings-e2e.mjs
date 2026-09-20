import { spawn } from "node:child_process";

/**
 * Runs the end-to-end settings checks as part of `npm test`, but only when
 * there is a stack for them to run against.
 *
 * They need the API, a database and the web app. On a machine where all of
 * that is up - which is the normal case while working on this - they run
 * and their failures are real failures. Where the API is not reachable,
 * such as CI, they are skipped with a message saying so.
 *
 * The alternative was making `npm test` fail without a database. That
 * turns a green suite into a red one for a reason that has nothing to do
 * with the code, and the usual result is that people stop running it.
 */

const API = process.env.E2E_API_URL ?? "http://localhost:3000";
const WEB = process.env.E2E_BASE_URL ?? "http://localhost:3001";

async function reachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    return response.ok;
  } catch {
    return false;
  }
}

const apiUp = await reachable(`${API}/api/v1/health/ready`);
const webUp = await reachable(WEB);

if (!apiUp || !webUp) {
  const missing = [!apiUp ? `the API at ${API}` : null, !webUp ? `the web app at ${WEB}` : null]
    .filter(Boolean)
    .join(" and ");
  console.log(
    [
      "",
      `Skipping the end-to-end settings checks: ${missing} ${missing.includes("and") ? "are" : "is"} not running.`,
      "",
      "They drive a real browser over the settings pages and need the whole",
      "stack up. To run them, start everything as described in RUNBOOK.md,",
      "then run `npm test` again - or `npm run e2e:settings` on its own.",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

console.log("\nRunning the end-to-end settings checks against the running stack...\n");

// shell: true because on Windows `npx` is a .cmd, which Node refuses to
// spawn directly (EINVAL).
const child = spawn("npx playwright test tests/e2e/settings.spec.ts", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, E2E_BASE_URL: WEB, E2E_API_URL: API },
});

child.on("exit", (code) => process.exit(code ?? 1));
