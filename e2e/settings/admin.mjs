import { chromium } from "playwright";
import {
  BASE,
  bodyText,
  called,
  createRecorder,
  instrument,
  open,
  reload,
  signIn,
  NAV_TIMEOUT,
  WAIT_TIMEOUT,
} from "../lib/harness.mjs";

/**
 * Admin settings, against the real backend, as the demo admin.
 *
 * This suite writes real platform settings (the fee, maintenance mode) and
 * puts them back afterwards. Run it against a development database only.
 */

const { check, issues, report } = createRecorder();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();
const state = instrument(page, issues);

try {
  // --------------------------------------------------- access control
  await signIn(page, state, "customer", "/bookings");
  await open(page, state, "/admin/settings");
  check("a signed-in client is redirected away from /admin", !page.url().includes("/admin"), page.url().replace(BASE, ""));

  await signIn(page, state, "admin", "/admin/settings");

  // ---------------------------------------------------------- landing
  await page.getByRole("heading", { name: "Settings", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  await page
    .waitForFunction(() => /Applications waiting\s*\n\s*\d/.test(document.body.innerText), undefined, { timeout: WAIT_TIMEOUT })
    .catch(() => undefined);
  check("landing: reads the real platform counts", called(state, "/admin/platform/stats"));
  let text = await bodyText(page);
  check(
    "landing: all four counts are real numbers",
    ["Applications waiting", "Open complaints", "Active providers", "Active clients"].every((label) =>
      new RegExp(`${label}\\s*\\n\\s*\\d`).test(text),
    ),
  );

  // ----------------------------------------------------- applications
  await open(page, state, "/admin/applications");
  await page.getByRole("heading", { name: "Provider applications", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("applications: reads the real queue", called(state, "/admin/professional-applications"));
  // The queue opens on Pending, which is legitimately empty when everything
  // has been decided, so audit the whole list.
  await page.getByRole("tab", { name: "All" }).click();
  await page.waitForTimeout(2500);
  await page.getByRole("table").waitFor({ timeout: 60_000 });
  const total = await page.locator("tbody tr").count();
  check("applications: real rows load", total > 0, `${total} rows`);
  check("applications: no unsubmitted drafts leak in", !(await bodyText(page)).includes("Half Filled"));
  await page.getByRole("tab", { name: "Approved" }).click();
  await page.waitForTimeout(2500);
  const shown = await page.locator("tbody tr").count();
  const approved = await page.locator("tbody tr").filter({ hasText: "Approved" }).count();
  check("applications: the status filter really filters", shown === approved, `${approved}/${shown}`);
  await page.getByRole("tab", { name: "All" }).click();
  await page.waitForTimeout(2000);

  // --------------------------------------------------------- one case
  await page.locator("tbody tr a").first().click();
  await page.waitForURL(/\/admin\/applications\/[0-9a-f-]{36}/, { timeout: WAIT_TIMEOUT });
  await page.waitForFunction(() => document.body.innerText.includes("Applicant"), undefined, { timeout: WAIT_TIMEOUT }).catch(() => undefined);
  check("review: the application details load", (await bodyText(page)).includes("Applicant"));
  // The address is stored encrypted; a reviewer has to be able to read it.
  check("review: the address is decrypted for the reviewer", /Location/.test(await bodyText(page)));

  // -------------------------------------------------- platform policy
  await open(page, state, "/admin/policies");
  await page.getByRole("heading", { name: "Platform policies", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("policies: reads the stored platform policy", called(state, "/admin/platform/policies"));
  const fee = page.getByLabel("Platform fee");
  const currentFee = (await fee.inputValue({ timeout: 60_000 })).trim();
  check("policies: current values pre-filled", currentFee.length > 0, `${currentFee}%`);
  const nextFee = currentFee === "11" ? "13" : "11";
  await fee.fill(nextFee);
  check("policies: changing the fee warns about future bookings", (await bodyText(page)).includes("every future booking"));
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("dialog").waitFor({ timeout: 30_000 });
  check("policies: a save is refused without a reason", await page.getByRole("button", { name: "Save and record" }).isDisabled());
  const note = `End-to-end check: fee to ${nextFee}%.`;
  await page.getByLabel(/Reason for the change/).fill(note);
  state.calls = [];
  await page.getByRole("button", { name: "Save and record" }).click();
  await page.getByText("Saved, and recorded in the audit log below.").waitFor({ timeout: 60_000 });
  check("policies: the save reaches PATCH /admin/platform/policies", called(state, "PATCH /api/v1/admin/platform/policies"));
  await page.getByText(note).waitFor({ timeout: 60_000 }).catch(() => undefined);
  check("policies: the change is recorded in the audit log", (await bodyText(page)).includes(note));
  await reload(page);
  check("policies: the change survives a reload", (await page.getByLabel("Platform fee").inputValue({ timeout: 60_000 })).trim() === nextFee);
  // Put the fee back where it was.
  await page.getByLabel("Platform fee").fill(currentFee);
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("dialog").waitFor({ timeout: 30_000 });
  await page.getByLabel(/Reason for the change/).fill("End-to-end check finished: restoring the original fee.");
  await page.getByRole("button", { name: "Save and record" }).click();
  await page.getByText("Saved, and recorded in the audit log below.").waitFor({ timeout: 60_000 }).catch(() => undefined);

  // ------------------------------------------------- system settings
  await open(page, state, "/admin/system");
  await page.getByRole("heading", { name: "System configuration", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("system: reads the stored configuration", called(state, "/admin/system/config"));
  check("system: warns that changes hit everyone", (await bodyText(page)).includes("take effect immediately"));
  const healthy = await page.getByText("Connected", { exact: true }).first().waitFor({ timeout: 60_000 }).then(() => true).catch(() => false);
  check("system: health reaches the database", healthy);

  const banner = "End-to-end check: scheduled maintenance.";
  await page.locator("li").filter({ hasText: "Maintenance mode" }).getByRole("button").click();
  await page.getByRole("dialog").waitFor({ timeout: 30_000 });
  check("system: the toggle confirms before applying", (await page.getByRole("dialog").innerText()).includes("Every visitor will see"));
  await page.getByLabel(/What should visitors see/).fill(banner);
  await page.getByLabel(/^Why\?/).fill("End-to-end check: confirming the public banner appears.");
  await page.getByRole("button", { name: "Yes, turn it on" }).click();
  await page.getByText("Maintenance mode is now on.").waitFor({ timeout: 60_000 });

  // The whole point of maintenance mode: a signed-out visitor sees it.
  const strangerContext = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const stranger = await strangerContext.newPage();
  await stranger.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  check("system: a signed-out visitor sees the banner", (await stranger.locator("body").innerText()).includes(banner));

  await open(page, state, "/admin/system");
  await page.locator("li").filter({ hasText: "Maintenance mode" }).getByRole("button").click();
  await page.getByRole("dialog").waitFor({ timeout: 30_000 });
  await page.getByLabel(/^Why\?/).fill("End-to-end check finished: restoring normal service.");
  await page.getByRole("button", { name: "Yes, turn it off" }).click();
  await page.getByText("Maintenance mode is now off.").waitFor({ timeout: 60_000 });

  await stranger.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  check("system: turning it off removes the banner", !(await stranger.locator("body").innerText()).includes(banner));
  await strangerContext.close();

  // ------------------------------------------------------------ mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, state, "/admin/applications");
  await page.getByRole("heading", { name: "Provider applications", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("applications: no sideways scrolling at 390px", overflow <= 0, `${overflow}px`);
  await page.getByRole("tab", { name: "All" }).click();
  await page.waitForTimeout(2500);
  check("applications: the table becomes cards on a phone", (await page.locator("ul[role=list] > li").count()) > 0);
} catch (error) {
  check("admin suite crashed", false, error.message.split("\n")[0]);
} finally {
  await browser.close();
}

process.exit(report("ADMIN"));
