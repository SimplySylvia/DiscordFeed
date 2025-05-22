import { test, expect } from '@playwright/test';

test('user can log out and is redirected', async ({ page }) => {
  // Simulate login or mock as needed
  await page.goto('/feed');
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByTestId('login-discord')).toBeVisible();
});