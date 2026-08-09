import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('Homepage', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('renders the approved desktop experience without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /Your Beauty\. Your Culture\./ }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Book a Hairstyle/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Book top looks/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Find braiders near you/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('renders mobile navigation and homepage sections at 375px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Your Beauty/ })).toBeVisible();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile primary' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AI Studio' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('has no automatically detectable WCAG 2 A/AA violations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
