import { chromium } from "playwright";
import {
  bodyText,
  called,
  createRecorder,
  instrument,
  open,
  signIn,
  WAIT_TIMEOUT,
} from "../lib/harness.mjs";

/**
 * Client settings, against the real backend, as the demo client.
 *
 * Each page is reached by a direct navigation rather than by clicking
 * through the hub: repeated client-side navigation into the same route
 * raced the re-render and made label lookups flaky, which measured the
 * harness rather than the page.
 */

const { check, issues, report } = createRecorder();
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const state = instrument(page, issues);

try {
  await signIn(page, state, "customer", "/account/settings");

  // ---------------------------------------------------------------- hub
  await page.getByRole("heading", { name: "Settings", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  check("hub: reads the real profile", called(state, "/customer/me"));
  let text = await bodyText(page);
  check(
    "hub: every section is listed",
    ["Profile", "Beauty profile", "Addresses", "Payment methods", "Notifications", "Security", "Privacy", "Danger zone"].every(
      (section) => text.includes(section),
    ),
  );
  // The wording tracks the row, so it changes as the account fills in. What
  // matters is that a state is derived from real data and explained.
  const badges = (text.match(/Complete|Incomplete/g) ?? []).length;
  const reason = (text.match(/Still missing[^\n]*|Nothing filled in yet|All set[^\n]*/) ?? [""])[0];
  check("hub: completion badges come from real data", badges > 0 && reason.length > 0, reason.slice(0, 50));
  check(
    "hub: the breadcrumb does not repeat itself",
    (await page.locator('nav[aria-label="Breadcrumb"]').innerText()).split(/\s+/).filter((w) => w === "Settings").length === 1,
  );

  // ------------------------------------------------------------ profile
  await open(page, state, "/account/settings/profile");
  const name = page.getByLabel(/^Name/);
  await name.waitFor({ timeout: WAIT_TIMEOUT });
  check("profile: pre-filled from the database", (await name.inputValue({ timeout: 60_000 })).trim().length > 0);
  text = await bodyText(page);
  check("profile: the account email is shown", /@/.test(text));
  check("profile: the email is not editable", (await page.getByRole("textbox", { name: /^Email/ }).count()) === 0);
  check("profile: a photo control is present", (await page.locator('input[type="file"]').count()) > 0);

  const newName = `Audit ${Date.now() % 10_000}`;
  await name.fill(newName);
  state.calls = [];
  await page.getByRole("button", { name: "Save changes" }).click();
  const confirmed = await page.getByText(/saved/i).first().waitFor({ timeout: 60_000 }).then(() => true).catch(() => false);
  check("profile: the save reaches PATCH /customer/me", called(state, "PATCH /api/v1/customer/me"));
  check("profile: the save is confirmed on screen", confirmed);
  await open(page, state, "/account/settings/profile");
  await page.getByLabel(/^Name/).waitFor({ timeout: WAIT_TIMEOUT });
  check(
    "profile: the change survives a reload",
    (await page.getByLabel(/^Name/).inputValue({ timeout: 60_000 })) === newName,
    newName,
  );

  // ----------------------------------------------------- beauty profile
  await open(page, state, "/account/settings/beauty-profile");
  await page.getByRole("button", { name: /^Save/ }).first().waitFor({ timeout: WAIT_TIMEOUT });
  check("beauty: reads the stored beauty profile", called(state, "/customer/beauty-profile"));
  const chips = page.getByRole("button", { pressed: false });
  check("beauty: chips render", (await chips.count()) > 0, `${await chips.count()} chips`);
  const chipLabel = (await chips.first().innerText()).trim();
  await chips.first().click();
  check("beauty: a chosen chip becomes pressed", (await page.getByRole("button", { name: chipLabel, pressed: true }).count()) > 0, chipLabel);
  state.calls = [];
  await page.getByRole("button", { name: /^Save/ }).first().click();
  await page.getByText(/saved/i).first().waitFor({ timeout: 60_000 }).catch(() => undefined);
  check("beauty: the save reaches PATCH /customer/beauty-profile", called(state, "PATCH /api/v1/customer/beauty-profile"));
  await open(page, state, "/account/settings/beauty-profile");
  await page.getByRole("button", { name: /^Save/ }).first().waitFor({ timeout: WAIT_TIMEOUT });
  check("beauty: the choice survives a reload", (await page.getByRole("button", { name: chipLabel, pressed: true }).count()) > 0, chipLabel);

  // ------------------------------------------------------------ privacy
  await open(page, state, "/account/settings/privacy");
  await page.waitForFunction(() => /Download/i.test(document.body.innerText), undefined, { timeout: WAIT_TIMEOUT }).catch(() => undefined);
  check("privacy: reads the stored consents", called(state, "/customer/consents"));
  const switches = page.getByRole("switch");
  const boxes = page.getByRole("checkbox");
  const controls = (await switches.count()) + (await boxes.count());
  check("privacy: consent controls render", controls > 0, `${controls} controls`);
  state.calls = [];
  await ((await switches.count()) > 0 ? switches.first() : boxes.first()).click();
  await page.waitForTimeout(3000);
  check("privacy: a change is written immediately", called(state, "/customer/consents"));
  check("privacy: a data download is offered", /Download/i.test(await bodyText(page)));

  // -------------------------------------------------------- danger zone
  await open(page, state, "/account/settings/danger");
  const del = page.getByRole("button", { name: /Delete (my )?account/i }).first();
  await del.waitFor({ timeout: WAIT_TIMEOUT });
  check("danger: deletion is offered, not disabled", await del.isEnabled());
  await del.click();
  const dialog = await page.getByRole("dialog").waitFor({ timeout: 30_000 }).then(() => true).catch(() => false);
  check("danger: a confirmation step appears", dialog);
  if (dialog) {
    check("danger: it asks for the account email", /email/i.test(await page.getByRole("dialog").innerText()));
    // The commit button stays disabled until the typed email matches and a
    // password is given - deleting an account should take deliberate effort.
    const confirm = page.getByRole("button", { name: /Schedule deletion/i }).first();
    check("danger: deletion is blocked until email and password are given", await confirm.isDisabled().catch(() => false));
    await page.keyboard.press("Escape");
  }

  // ----------------------------------------------------- payment methods
  await open(page, state, "/account/settings/payment-methods");
  await page.waitForFunction(() => /card/i.test(document.body.innerText), undefined, { timeout: WAIT_TIMEOUT }).catch(() => undefined);
  text = await bodyText(page);
  check(
    "payments: says plainly that saving a card is not built yet",
    /No payment methods saved/i.test(text) && /isn.t switched on yet/i.test(text),
  );

  // ------------------------------- pages that predate the settings work
  for (const [label, path, marker] of [
    ["notifications", "/account/settings/notifications", /notification|email|sms/i],
    ["security", "/account/settings/security", /password|session|sign/i],
    ["addresses", "/account/settings/addresses", /address/i],
  ]) {
    await open(page, state, path);
    await page
      .waitForFunction((source) => new RegExp(source, "i").test(document.body.innerText), marker.source, { timeout: WAIT_TIMEOUT })
      .catch(() => undefined);
    check(`${label}: still renders`, marker.test(await bodyText(page)), path);
  }

  // ------------------------------------------------------------- mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, state, "/account/settings");
  await page.getByRole("heading", { name: "Settings", level: 1 }).waitFor({ timeout: WAIT_TIMEOUT });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("hub: no sideways scrolling at 375px", overflow <= 0, `${overflow}px`);
} catch (error) {
  check("client suite crashed", false, error.message.split("\n")[0]);
} finally {
  await browser.close();
}

process.exit(report("CLIENT"));
