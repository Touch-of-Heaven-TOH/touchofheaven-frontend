import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { NearbyBraider, NearbyBraidersResponse } from '@/lib/discovery/types';

const ATLANTA = { latitude: 33.749, longitude: -84.388 };

const MOCK_BRAIDER: NearbyBraider = {
  id: 'location-e2e-1',
  kind: 'location',
  braiderId: 'braider-e2e-1',
  professionalName: 'Ada E2E Braids',
  bio: 'Specializing in knotless braids and locs.',
  locationLabel: 'Main Studio',
  locationModel: 'PUBLIC_SALON',
  isApproximateLocation: false,
  address: '123 Main St, Atlanta, GA',
  latitude: 33.749,
  longitude: -84.388,
  radiusMiles: null,
  photo: null,
  photos: [],
  specialties: ['Knotless Braids'],
  rating: { average: 4.8, count: 12 },
  nextAvailableSlotAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  nextAvailableSlotBucket: 'TODAY',
  acceptsNewClients: true,
  distanceKm: 1.2,
};

/**
 * Every test here mocks GET /api/v1/braiders/nearby at the network layer
 * instead of hitting a real Backend-of-TOH - this app never touches the
 * database directly (see the two-repo split in the root README), and its
 * own E2E suite shouldn't need a seeded backend database either. What's
 * under test is the frontend's own behavior given a valid API response,
 * not the API contract itself (that's Backend-of-TOH's
 * discovery-nearby.test.ts's job).
 */
async function mockNearbyBraiders(page: Page, braiders: NearbyBraider[]) {
  await page.route('**/api/v1/braiders/nearby*', async (route) => {
    const body: NearbyBraidersResponse = {
      braiders,
      total: braiders.length,
      searchCenter: { latitude: ATLANTA.latitude, longitude: ATLANTA.longitude },
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: body, requestId: 'e2e-mock' }),
    });
  });
}

test.describe('Braider discovery map', () => {
  test.use({
    geolocation: ATLANTA,
    permissions: ['geolocation'],
  });

  test('geolocation override -> select a result -> Book Now -> navigates toward /book/[braiderId]', async ({
    page,
  }) => {
    await mockNearbyBraiders(page, [MOCK_BRAIDER]);
    await page.goto('/map');

    // The map pin and the sidebar row select through the exact same
    // onBraiderSelect/onSelectBraider(id) contract (see BraiderMapProps's
    // doc comment) - the sidebar row is used here as the click target
    // because it's plain HTML, reachable without a real Google Maps API
    // key (none is configured in this environment), while a literal pin
    // click would require the live Maps SDK to have actually rendered one.
    const row = page.getByRole('button', { name: /Ada E2E Braids/ });
    await expect(row).toBeVisible();
    await row.click();

    const bookNowButton = page.getByRole('button', { name: 'Book Now' });
    await expect(bookNowButton).toBeVisible();
    await bookNowButton.click();

    // /book/[braiderId] is a protected route - proxy.ts redirects an
    // unauthenticated visitor to sign-in rather than 401/403 (see the
    // Security Foundation section of this repo's README), preserving the
    // original destination via callbackUrl. Landing here, not on a 404 or
    // a dead click, is what "Book Now navigates correctly" actually means
    // for a signed-out visitor - the exact braider id must survive the
    // redirect.
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=.*book%2Fbraider-e2e-1/);
  });

  test('selecting a result from the map pin highlights the matching sidebar row', async ({
    page,
  }) => {
    await mockNearbyBraiders(page, [MOCK_BRAIDER]);
    await page.goto('/map');

    const row = page.getByRole('button', { name: /Ada E2E Braids/ });
    await expect(row).toBeVisible();
    await row.click();

    await expect(row).toHaveAttribute('aria-current', 'true');
  });

  test('an empty result set shows the empty state, not a stale loading indicator', async ({
    page,
  }) => {
    await mockNearbyBraiders(page, []);
    await page.goto('/map');

    await expect(page.getByText('No braiders found nearby')).toBeVisible();
  });

  test('a broken API response surfaces a real error state, not a misleading empty one', async ({
    page,
  }) => {
    await page.route('**/api/v1/braiders/nearby*', async (route) => {
      await route.fulfill({ status: 500, contentType: 'text/plain', body: 'boom' });
    });
    await page.goto('/map');

    await expect(page.getByText("Couldn't load braiders")).toBeVisible();
    await expect(page.getByText('No braiders found nearby')).not.toBeVisible();
  });
});

test.describe('Braider discovery map - geolocation denied', () => {
  test.use({ permissions: [] });

  test('falls back to the default search origin instead of stalling forever', async ({
    page,
  }) => {
    await mockNearbyBraiders(page, [MOCK_BRAIDER]);
    await page.goto('/map');

    // No error banner, no permission dialog left hanging - see
    // useGeolocation's doc comment on why denied/timeout/unsupported are
    // all treated as "fall back silently," never a user-facing error.
    // Anchored to a leading digit so it can't also match the sr-only <h1>
    // ("Find braiders near you") or the "No braiders found nearby" empty
    // state - both contain "braider" and "near" too.
    await expect(page.getByText(/^\d+ braiders? near/i)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Braider discovery map - accessibility', () => {
  test.use({ geolocation: ATLANTA, permissions: ['geolocation'] });

  test('has no automatically detectable WCAG 2 A/AA violations', async ({ page }) => {
    await mockNearbyBraiders(page, [MOCK_BRAIDER]);
    await page.goto('/map');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
