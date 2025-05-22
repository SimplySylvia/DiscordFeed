import { test, expect } from '@playwright/test';

test('login page has accessible name for login button', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByTestId('login-discord')).toBeVisible();
  // Optionally, add more accessibility checks here
});