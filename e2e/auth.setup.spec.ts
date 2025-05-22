// e2e/auth.setup.spec.ts
import { test } from '@playwright/test';

test.describe.configure({ mode: 'serial' }); // optional, for serial execution

test.use({ browserName: 'chromium' }); // restricts to Chromium

test('authenticate and save storage state', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByTestId('login-discord').click();

  // Pause here so you can complete the login manually
  await page.pause();

  // After you finish login and land on /feed, resume the test (press 'Resume' in the Playwright UI)
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});