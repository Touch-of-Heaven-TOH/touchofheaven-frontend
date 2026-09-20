import { expect, test, type Page } from "@playwright/test";

/**
 * The settings pages, end to end, through the real backend.
 *
 * These are the checks that cannot be made any other way: that a form
 * arrives filled in from the database, that saving it reaches the right
 * endpoint, and that the value is still there after a reload. A component
 * test can prove a form renders; only this can prove a save persists.
 *
 * They need the whole stack up - Postgres, the API on 3000 and the web app
 * on 3001. When the API is not reachable the file skips itself with a
 * message rather than failing, so `npm test` stays usable on a machine
 * where only the unit tests are wanted, and CI does not fail for want of a
 * database.
 */

const WEB = process.env.E2E_BASE_URL ?? "http://localhost:3001";
const API = process.env.E2E_API_URL ?? "http://localhost:3000";

/** A cold dev route can take most of a minute to compile on first hit. */
const SLOW = 180_000;
test.describe.configure({ mode: "serial", timeout: SLOW });

let apiReachable = false;

test.beforeAll(async () => {
  try {
    const response = await fetch(`${API}/api/v1/health/ready`, {
      signal: AbortSignal.timeout(20_000),
    });
    apiReachable = response.ok;
  } catch {
    apiReachable = false;
  }
});

test.beforeEach(() => {
  test.skip(
    !apiReachable,
    `The API at ${API} is not reachable, so the end-to-end settings checks cannot run. Start the stack (see RUNBOOK.md), then run this again.`,
  );
});

async function signIn(page: Page, as: "customer" | "owner" | "admin", next: string) {
  await page.goto(`${WEB}/dev/preview-sign-in?as=${as}&next=${encodeURIComponent(next)}`, {
    waitUntil: "domcontentloaded",
    timeout: SLOW,
  });
  await page.waitForURL((url) => !url.pathname.includes("preview-sign-in"), { timeout: SLOW });
}

async function open(page: Page, path: string) {
  await page.goto(`${WEB}${path}`, { waitUntil: "domcontentloaded", timeout: SLOW });
  await page.waitForLoadState("networkidle", { timeout: SLOW }).catch(() => undefined);
}

test.describe("client settings", () => {
  test("the profile saves and is still there after a reload", async ({ page }) => {
    await signIn(page, "customer", "/account/settings/profile");
    await open(page, "/account/settings/profile");

    // Waiting on a field, not a heading: the account shell draws its own
    // heading before the form has its data.
    const name = page.getByLabel(/^Name/);
    await name.waitFor({ timeout: SLOW });
    await expect(name).not.toHaveValue("", { timeout: 30_000 });

    const saved = `E2E ${Date.now() % 10_000}`;
    await name.fill(saved);

    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes("/api/v1/customer/me") && r.method() === "PATCH", {
        timeout: 60_000,
      }),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);
    expect(request.method()).toBe("PATCH");

    await open(page, "/account/settings/profile");
    await page.getByLabel(/^Name/).waitFor({ timeout: SLOW });
    await expect(page.getByLabel(/^Name/)).toHaveValue(saved, { timeout: 30_000 });
  });

  test("the beauty profile saves and is still there after a reload", async ({ page }) => {
    await signIn(page, "customer", "/account/settings/beauty-profile");
    await open(page, "/account/settings/beauty-profile");
    await page.getByRole("button", { name: /^Save/ }).first().waitFor({ timeout: SLOW });

    const chip = page.getByRole("button", { pressed: false }).first();
    const label = (await chip.innerText()).trim();
    await chip.click();
    await expect(page.getByRole("button", { name: label, pressed: true })).toBeVisible();

    await Promise.all([
      page.waitForRequest(
        (r) => r.url().includes("/api/v1/customer/beauty-profile") && r.method() === "PATCH",
        { timeout: 60_000 },
      ),
      page.getByRole("button", { name: /^Save/ }).first().click(),
    ]);

    await open(page, "/account/settings/beauty-profile");
    await page.getByRole("button", { name: /^Save/ }).first().waitFor({ timeout: SLOW });
    await expect(page.getByRole("button", { name: label, pressed: true })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("deleting an account needs the email typed back", async ({ page }) => {
    await signIn(page, "customer", "/account/settings/danger");
    await open(page, "/account/settings/danger");

    const start = page.getByRole("button", { name: /Delete (my )?account/i }).first();
    await start.waitFor({ timeout: SLOW });
    await expect(start).toBeEnabled();
    await start.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog).toContainText(/email/i);

    // The commit button stays disabled until the typed email matches and a
    // password is given. Deleting everything should take deliberate effort.
    await expect(page.getByRole("button", { name: /Schedule deletion/i }).first()).toBeDisabled();
  });
});

test.describe("studio settings", () => {
  test("handle validation answers free, malformed and taken", async ({ page }) => {
    await signIn(page, "owner", "/studio/settings/profile");
    await open(page, "/studio/settings/profile");

    const businessName = page.getByLabel(/^Business name/).first();
    await businessName.waitFor({ timeout: SLOW });
    await expect(businessName).not.toHaveValue("", { timeout: 30_000 });

    const handle = page.getByLabel("Handle");
    const original = await handle.inputValue();

    await handle.fill(`e2e-free-${Date.now()}`);
    await expect(page.getByText("That handle is free.")).toBeVisible({ timeout: 60_000 });

    await handle.fill("ab");
    await expect(page.getByText("Use 3-60 lowercase letters, numbers or hyphens.")).toBeVisible({
      timeout: 45_000,
    });

    // Putting your own handle back is not a change, so the field goes idle.
    // What must never happen is being told your own handle is taken.
    await handle.fill(original);
    await page.waitForTimeout(2000);
    await expect(page.getByText(/already in use|already applied/)).toHaveCount(0);
  });

  test("the policy preview updates as the form changes, and the change persists", async ({ page }) => {
    await signIn(page, "owner", "/studio/settings/policies");
    await open(page, "/studio/settings/policies");

    const preview = page.locator("aside").filter({ hasText: "What clients see" }).first();
    await preview.waitFor({ timeout: SLOW });
    const before = await preview.innerText();

    const notice = page.getByLabel(/Notice you ask for/);
    const current = (await notice.inputValue()).trim();
    const next = current === "48" ? "36" : "48";
    await notice.fill(next);

    // The panel is the point of the page: it has to move before anything is
    // saved, so a provider can see what a client will read.
    await expect(preview).toContainText(next, { timeout: 15_000 });
    expect(await preview.innerText()).not.toBe(before);

    await Promise.all([
      page.waitForRequest(
        (r) => r.url().includes("/api/v1/braiders/policies") && r.method() === "PATCH",
        { timeout: 60_000 },
      ),
      page.getByRole("button", { name: "Save policies" }).click(),
    ]);
    await expect(page.getByText("Policies saved.")).toBeVisible({ timeout: 60_000 });

    await open(page, "/studio/settings/policies");
    const reloaded = page.locator("aside").filter({ hasText: "What clients see" }).first();
    await reloaded.waitFor({ timeout: SLOW });
    await expect(reloaded).toContainText(next, { timeout: 30_000 });
  });
});

test.describe("admin settings", () => {
  /** Opens the first application still waiting for a decision. */
  async function openPendingApplication(page: Page) {
    await open(page, "/admin/applications");
    await page.getByRole("heading", { name: "Provider applications", level: 1 }).waitFor({ timeout: SLOW });
    const row = page.locator("tbody tr").filter({ hasText: "Pending" }).first();
    if ((await row.count()) === 0) return false;
    await row.locator("a").first().click();
    await page.waitForURL(/\/admin\/applications\/[0-9a-f-]{36}/, { timeout: SLOW });
    return true;
  }

  test("an application can be rejected, with a reason the applicant is sent", async ({ page }) => {
    await signIn(page, "admin", "/admin/applications");
    const found = await openPendingApplication(page);
    test.skip(!found, "No pending applications. Run `npm run demo:reset` in the backend repo.");

    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 30_000 });

    // A rejection is sent to the applicant word for word, so it cannot go
    // out empty.
    const confirm = page.getByRole("button", { name: "Yes, reject" });
    await expect(confirm).toBeDisabled();
    await page.getByLabel(/Why are you rejecting/).fill("End-to-end check: the address does not match the photos.");
    await expect(confirm).toBeEnabled();

    await Promise.all([
      page.waitForRequest((r) => r.url().includes("/reject") && r.method() === "POST", { timeout: 60_000 }),
      confirm.click(),
    ]);
    await expect(page.getByText("Rejected. We've emailed them your reason.")).toBeVisible({ timeout: 60_000 });

    await page.reload({ waitUntil: "domcontentloaded", timeout: SLOW });
    await expect(page.getByText("Rejected").first()).toBeVisible({ timeout: SLOW });
  });

  test("an application can be approved", async ({ page }) => {
    await signIn(page, "admin", "/admin/applications");
    const found = await openPendingApplication(page);
    test.skip(!found, "No pending applications. Run `npm run demo:reset` in the backend repo.");

    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 30_000 });

    await Promise.all([
      page.waitForRequest((r) => r.url().includes("/approve") && r.method() === "POST", { timeout: 60_000 }),
      page.getByRole("button", { name: "Yes, approve" }).click(),
    ]);
    await expect(page.getByText("Approved. Their Studio is open")).toBeVisible({ timeout: 90_000 });

    await page.reload({ waitUntil: "domcontentloaded", timeout: SLOW });
    await expect(page.getByText("Approved").first()).toBeVisible({ timeout: SLOW });
  });
});
