import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  // A dev server's on-demand Turbopack compile for a route this test
  // suite hasn't hit yet can take well past Playwright's 30s default on
  // a slow filesystem (see webServer.timeout's comment below) - a real
  // CI run against a production build won't need this, but it costs
  // nothing there either.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        env: { ...process.env, DISABLE_HOME_BACKEND: 'true' },
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        // Generous: a cold Next.js dev server's first compile can run well
        // past a minute on a slow filesystem (see the "Slow filesystem
        // detected" warning next dev itself logs).
        timeout: 180_000,
      },
});
