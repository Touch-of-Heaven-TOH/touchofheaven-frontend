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
 * The client home dashboard, against the real stack.
 *
 * Checks the things a screenshot cannot: that the page reads the real
 * endpoint, that every destination in the navigation exists, and that a
 * phone gets no sideways scroll.
 */

const { check, issues, report } = createRecorder();
const browser = await chromium.launch();

try {
  // ------------------------------------------------------------ desktop
  const desktop = await browser.newContext({ viewport: { width: 1536, height: 1000 } });
  const page = await desktop.newPage();
  const state = instrument(page, issues);

  await signIn(page, state, "customer", "/home");
  await page
    .getByRole("heading", { name: /Book beauty and wellness near you/ })
    .waitFor({ timeout: WAIT_TIMEOUT });

  // The hero renders before the payload arrives, so wait for something
  // only real data can produce.
  await page.locator('a[href*="category="]').first().waitFor({ timeout: WAIT_TIMEOUT });
  check("reads the real client home endpoint", called(state, "GET /api/v1/customer/home"));

  let text = await bodyText(page);
  check("the hero copy matches the design", text.includes("Discover trusted braiders"));
  check("the signed-in client is shown, not a log-in prompt", !text.includes("Log in"));

  const tiles = page.locator('a[href*="category="]');
  const tileCount = await tiles.count();
  check("category tiles come from the backend", tileCount > 0, `${tileCount} tiles`);
  // The whole tile is the target, not just the icon inside it.
  const tileBox = await tiles.first().boundingBox();
  check("a tile is a real target, not just its icon", (tileBox?.height ?? 0) >= 44, `${Math.round(tileBox?.height ?? 0)}px`);

  check("the desktop footer is present", text.includes("Privacy") || text.includes("Help Center"));

  // --------------------------------------------------- every destination
  for (const [label, path] of [
    ["home", "/home"],
    ["activity", "/activity"],
    ["saved", "/saved"],
    ["notifications", "/notifications"],
    ["profile", "/profile"],
  ]) {
    await open(page, state, path);
    const landed = page.url();
    const ok = !landed.includes("/customer/sign-in") && !(await bodyText(page)).includes("not part of the current");
    check(`${label} opens a real page`, ok, landed.replace(/^https?:\/\/[^/]+/, ""));
  }

  // Profile is a redirect to the settings page that already exists.
  check(
    "profile lands on the real profile page",
    page.url().includes("/account/settings/profile"),
    page.url().replace(/^https?:\/\/[^/]+/, ""),
  );

  // ------------------------------------------------- recently viewed
  await open(page, state, "/explore");
  const firstBusiness = page.locator('a[href^="/businesses/"]').first();
  await firstBusiness.waitFor({ timeout: WAIT_TIMEOUT }).catch(() => undefined);
  if ((await firstBusiness.count()) > 0) {
    const href = await firstBusiness.getAttribute("href");
    state.calls = [];
    await open(page, state, href);
    await page.waitForTimeout(3000);
    check(
      "opening a profile records the view",
      called(state, "POST /api/v1/customer/recently-viewed/"),
    );
  } else {
    check("opening a profile records the view", false, "no business to open");
  }

  // ------------------------------------------------------------- mobile
  const phone = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  const phoneState = instrument(phone, issues);
  await signIn(phone, phoneState, "customer", "/home");
  await phone
    .locator("nav[aria-label='Mobile client navigation']")
    .waitFor({ timeout: WAIT_TIMEOUT });

  const items = (
    await phone.locator("nav[aria-label='Mobile client navigation'] a").allInnerTexts()
  ).map((value) => value.trim());
  check("the bottom bar has exactly five destinations", items.length === 5, items.join(" | "));
  check(
    "they are in the order the design fixes",
    items.join(",") === "Home,Search,AI Studio,Activity,Profile",
    items.join(","),
  );
  check("AI Studio holds the centre", items[2] === "AI Studio");

  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("a phone gets no sideways scroll", overflow <= 1, `${overflow}px`);

  // The fixed bar must not sit on top of the last card.
  await phone.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await phone.waitForTimeout(600);
  const covered = await phone.evaluate(() => {
    const bar = document.querySelector("nav[aria-label='Mobile client navigation']");
    if (!bar) return null;
    const barTop = bar.getBoundingClientRect().top;
    // The last real card the client is meant to reach.
    const cards = [...document.querySelectorAll("section, li")]
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.height > 60 && rect.width > 60);
    const lowest = cards.sort((a, b) => b.bottom - a.bottom)[0];
    return lowest ? Math.round(lowest.bottom - barTop) : null;
  });
  check(
    "the bottom bar never covers the last card",
    covered === null || covered <= 0,
    covered === null ? "no cards" : `${covered}px overlap`,
  );

  await phone.close();
  await desktop.close();
} catch (error) {
  check("suite ran to the end", false, error.message.slice(0, 200));
} finally {
  await browser.close();
}

process.exit(report("client home:"));
