import { test, expect } from '@playwright/test';

test('user can navigate between pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /login/i }).click();
  // Simulate login or mock as needed

  await page.goto('/feed');
  await expect(page.getByTestId('feed-list')).toBeVisible();

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
});