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

/**
 * The Studio portfolio, against the real backend, as the demo provider.
 *
 * Needs the demo data this seeder writes, or there is nothing to reorder:
 *   cd Backend_for_HOF && npm run demo:portfolio
 */

const { check, issues, report } = createRecorder();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();
const state = instrument(page, issues);

try {
  await signIn(page, state, "owner", "/studio/portfolio");

  // The heading renders before the data arrives, so waiting on it passes
  // against a skeleton. Wait for a real photo card instead.
  const cards = page.locator("ul[role=list] > li").filter({ has: page.locator("img, button") });
  await cards.first().waitFor({ timeout: WAIT_TIMEOUT });

  check("reads the provider's own portfolio", called(state, "GET /api/v1/braiders/portfolio"));
  check("reads the consents it may post from", called(state, "/braiders/portfolio/consents"));

  let text = await bodyText(page);
  check("the count is stated, not implied by colour", /Showing all \d+ photo/.test(text), text.match(/Showing[^.]*\./)?.[0] ?? "none");

  // ------------------------------------------------- moderation states
  check("an approved photo is named as live", text.includes("On your profile"));
  check("a waiting photo is named as in review", text.includes("In review"));
  check("a turned-down photo is named as such", text.includes("Not approved"));
  check(
    "a rejection says why, not just that it failed",
    text.includes("recognisable in the mirror"),
    text.match(/Another client[^.]*\./)?.[0] ?? "none",
  );

  const approved = await page.locator("img[src*='/images/']").count();
  check("approved photos load their real image", approved > 0, `${approved} image(s)`);

  // ------------------------------------------------------- filtering
  await page.getByRole("tab", { name: /Not approved/ }).click();
  await page.getByText(/Showing 1 of \d+ photos/).waitFor({ timeout: 45_000 });
  check("filtering to one status narrows the grid", (await cards.count()) === 1, `${await cards.count()} card(s)`);
  check(
    "it says the order cannot be changed while filtered",
    (await bodyText(page)).includes("Switch to All to change the order"),
  );
  await page.getByRole("tab", { name: /^All/ }).click();
  await page.getByText(/Showing all \d+ photo/).waitFor({ timeout: 45_000 });

  // -------------------------------------------------------- reorder
  // Drag is not the only way to reorder: WCAG 2.2 requires a
  // single-pointer alternative, so the buttons are the real control.
  const firstTitle = await cards.first().locator("p").first().innerText();
  const secondTitle = await cards.nth(1).locator("p").first().innerText();
  state.calls = [];
  await cards.nth(1).getByRole("button", { name: /Move .* earlier/ }).click();
  await page.getByText(`Moved "${secondTitle}" earlier.`).waitFor({ timeout: 60_000 });
  check("reordering calls the real endpoint", called(state, "PATCH /api/v1/braiders/portfolio/reorder"));
  check(
    "the moved photo is now first",
    (await cards.first().locator("p").first().innerText()) === secondTitle,
    `${secondTitle} vs ${firstTitle}`,
  );

  await reload(page);
  await cards.first().waitFor({ timeout: WAIT_TIMEOUT });
  check(
    "the new order survives a reload",
    (await cards.first().locator("p").first().innerText()) === secondTitle,
  );

  check(
    "the first photo cannot be moved earlier",
    await cards.first().getByRole("button", { name: /Move .* earlier/ }).getAttribute("aria-disabled") === "true",
  );

  // ------------------------------------------------- edit description
  const newText = `Waist-length knotless braids ${Date.now() % 10_000}`;
  await cards.first().getByRole("button", { name: /Edit the description/ }).click();
  const field = page.getByLabel("Describe the style");
  await field.waitFor({ timeout: 45_000 });
  await field.fill(newText);
  state.calls = [];
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Description saved.").waitFor({ timeout: 60_000 });
  check("the description saves against the real photo", called(state, "PATCH /api/v1/braiders/portfolio/"));

  await reload(page);
  await cards.first().waitFor({ timeout: WAIT_TIMEOUT });
  check("the new description persisted", (await bodyText(page)).includes(newText));

  // ------------------------------------------------------- consents
  check(
    "a finished appointment with no photo yet is offered",
    (await bodyText(page)).includes("Ready to post from"),
  );
  const addButton = page.getByRole("button", { name: "Add a photo" });
  check("adding a photo is available", (await addButton.getAttribute("aria-disabled")) !== "true");
  await addButton.click();
  const picker = page.getByLabel("Which appointment?");
  await picker.waitFor({ timeout: 45_000 });
  const options = await picker.locator("option").count();
  check("only consented appointments are listed", options > 1, `${options - 1} appointment(s)`);
  await page.getByRole("button", { name: "Cancel" }).click();

  // --------------------------------------------- delete is confirmed
  await cards.first().getByRole("button", { name: /^Remove/ }).click();
  await page.getByRole("heading", { name: "Remove this photo?" }).waitFor({ timeout: 45_000 });
  check("deleting asks first", true);
  await page.getByRole("button", { name: "Keep it" }).click();
  await page.getByRole("heading", { name: "Remove this photo?" }).waitFor({ state: "hidden", timeout: 45_000 });
  check("declining leaves the photo alone", (await cards.count()) > 0);

  // ---------------------------------------------------------- mobile
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const phoneState = instrument(phone, issues);
  await signIn(phone, phoneState, "owner", "/studio/portfolio");
  await phone.locator("ul[role=list] > li").first().waitFor({ timeout: WAIT_TIMEOUT });
  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("no sideways scrolling on a phone", overflow <= 1, `${overflow}px`);
  const small = await phone.evaluate(() =>
    [...document.querySelectorAll("button")]
      .filter((node) => node.offsetParent !== null)
      .map((node) => node.getBoundingClientRect())
      .filter((box) => box.height > 0 && (box.height < 44 || box.width < 44)).length,
  );
  check("every control is a real touch target", small === 0, `${small} under 44px`);
  await phone.close();

  text = await bodyText(page);
  check("the consent rule is explained, not assumed", text.includes("How a photo gets here"));
} catch (error) {
  check("suite ran to the end", false, error.message.slice(0, 200));
} finally {
  await browser.close();
}

process.exit(report("studio portfolio:"));
