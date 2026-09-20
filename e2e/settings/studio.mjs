import { chromium } from "playwright";
import {
  bodyText,
  called,
  createRecorder,
  instrument,
  open,
  reload,
  signIn,
  WAIT_TIMEOUT,
} from "../lib/harness.mjs";

/** Studio settings, against the real backend, as the demo business owner. */

const { check, issues, report } = createRecorder();
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const state = instrument(page, issues);

try {
  await signIn(page, state, "owner", "/studio/settings");

  // ---------------------------------------------------------------- hub
  await page.getByRole("heading", { name: "Settings", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  await page
    .waitForFunction(() => /[1-9]\d*%/.test(document.body.innerText), undefined, { timeout: WAIT_TIMEOUT })
    .catch(() => undefined);
  check("hub: reads the real completion score", called(state, "GET /api/v1/braiders/profile/completion"));
  let text = await bodyText(page);
  check("hub: the score is a real number", Number(text.match(/(\d+)%/)?.[1]) > 0, text.match(/\d+%/)?.[0] ?? "none");
  check("hub: an owner sees the team section", text.includes("Team"));

  // --------------------------------------------------------- profile
  await open(page, state, "/studio/settings/profile");
  // The frame draws its heading before the profile arrives, so waiting on
  // the heading passes while the page is still a skeleton. Wait for a field.
  const businessName = page.getByLabel(/^Business name/).first();
  await businessName.waitFor({ timeout: WAIT_TIMEOUT });
  check("profile: reads the real profile", called(state, "GET /api/v1/braiders/profile"));
  check("profile: business name pre-filled", (await businessName.inputValue({ timeout: 60_000 })).trim().length > 0);
  check(
    "profile: the client-facing name is pre-filled",
    (await page.getByLabel(/^Name clients see/).first().inputValue({ timeout: 60_000 })).trim().length > 0,
  );

  const handle = page.getByLabel("Handle");
  const originalHandle = await handle.inputValue({ timeout: 60_000 });
  check("profile: handle pre-filled", originalHandle.trim().length > 0, originalHandle);
  state.calls = [];
  await handle.fill(`e2e-free-${Date.now()}`);
  await page.getByText("That handle is free.").waitFor({ timeout: 60_000 });
  check("profile: a free handle validates live", true);
  check("profile: the availability endpoint is really called", called(state, "/braiders/handle-availability"));
  await handle.fill("ab");
  await page.getByText("Use 3-60 lowercase letters, numbers or hyphens.").waitFor({ timeout: 45_000 });
  check("profile: a malformed handle is caught before the server", true);
  // Typing your own handle back is not a change, so the field goes idle
  // rather than re-validating; it must never be accused of being taken.
  await handle.fill(originalHandle);
  await page.waitForTimeout(2000);
  check("profile: your own handle is never reported as taken", (await page.getByText(/already in use|already applied/).count()) === 0);

  const preview = await page.getByRole("link", { name: /Preview my public profile/ }).getAttribute("href");
  check("profile: the preview opens the real public page", /^\/businesses\/[0-9a-f-]{36}$/.test(preview ?? ""), preview ?? "");

  const nextName = `Studio E2E ${Date.now() % 10_000}`;
  await businessName.fill(nextName);
  state.calls = [];
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Business profile saved.").waitFor({ timeout: 60_000 });
  check("profile: the save reaches PATCH /braiders/profile", called(state, "PATCH /api/v1/braiders/profile"));
  await reload(page);
  check(
    "profile: the change survives a reload",
    (await page.getByLabel(/^Business name/).first().inputValue({ timeout: 60_000 })) === nextName,
    nextName,
  );

  // -------------------------------------------------------- location
  await open(page, state, "/studio/settings/location");
  await page.getByRole("heading", { name: "Location & travel zones", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("location: reads the real locations", called(state, "/braiders/locations"));
  check("location: existing places are listed", /Salon|Studio|Douala/.test(await bodyText(page)));
  await page.getByRole("button", { name: "Add a place" }).click();
  const formOpen = await page.getByRole("dialog").waitFor({ timeout: 30_000 }).then(() => true).catch(() => false);
  check("location: the add-a-place form opens", formOpen);
  if (formOpen) {
    const dialog = page.getByRole("dialog");
    const search = dialog.getByLabel(/Search for the address|Find the address|Address/).first();
    if ((await search.count()) > 0) {
      await search.fill("Akwa Douala");
      await page.waitForTimeout(4000);
      const results =
        (await dialog.getByRole("option").count().catch(() => 0)) +
        (await dialog.getByRole("button", { name: /Douala|Akwa/ }).count().catch(() => 0));
      check("location: address search returns real suggestions", results > 0, `${results} results`);
    }
    await dialog.getByLabel(/What kind of place/).selectOption("PRIVATE_STUDIO").catch(() => undefined);
    check(
      "location: a private studio explains what clients will see",
      (await dialog.innerText()).includes("approximate"),
    );
    await page.getByRole("button", { name: "Cancel" }).click();
  }
  check("location: travel fees are marked as not wired up", /Coming soon/i.test(await bodyText(page)));

  // --------------------------------------------------- notifications
  await open(page, state, "/studio/settings/notifications");
  await page.getByRole("heading", { name: "Notifications", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("notifications: reads the stored preferences", called(state, "/notifications/preferences"));
  const row = page.locator("li").filter({ hasText: "Booking confirmed" }).first();
  const box = row.getByRole("checkbox").first();
  const before = await box.isChecked();
  state.calls = [];
  await box.click();
  await page.waitForTimeout(3000);
  check("notifications: a toggle writes immediately", called(state, "PATCH /api/v1/notifications/preferences"));
  await reload(page);
  const after = await page.locator("li").filter({ hasText: "Booking confirmed" }).first().getByRole("checkbox").first().isChecked();
  check("notifications: the change survives a reload", before !== after, `${before} -> ${after}`);

  // -------------------------------------------------------- policies
  await open(page, state, "/studio/settings/policies");
  await page.getByRole("heading", { name: "Policies", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("policies: reads the stored policy", called(state, "/braiders/policies"));
  const panel = page.locator("aside").filter({ hasText: "What clients see" }).first();
  await panel.waitFor({ timeout: 45_000 });
  const beforePreview = await panel.innerText();
  const notice = page.getByLabel(/Notice you ask for/);
  const current = (await notice.inputValue({ timeout: 60_000 })).trim();
  const next = current === "48" ? "36" : "48";
  await notice.fill(next);
  await page.waitForTimeout(500);
  const afterPreview = await panel.innerText();
  check("policies: the client-facing preview updates live", beforePreview !== afterPreview && afterPreview.includes(next), `${current} -> ${next}`);
  state.calls = [];
  await page.getByRole("button", { name: "Save policies" }).click();
  await page.getByText("Policies saved.").waitFor({ timeout: 60_000 });
  check("policies: the save reaches PATCH /braiders/policies", called(state, "PATCH /api/v1/braiders/policies"));
  await reload(page);
  check(
    "policies: the change survives a reload",
    (await page.locator("aside").filter({ hasText: "What clients see" }).first().innerText()).includes(next),
    `${next} hours`,
  );
} catch (error) {
  check("studio suite crashed", false, error.message.split("\n")[0]);
} finally {
  await browser.close();
}

process.exit(report("STUDIO"));
