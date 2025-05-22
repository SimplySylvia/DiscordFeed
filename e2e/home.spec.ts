import { test, expect } from '@playwright/test';

test('homepage loads and shows get started button', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Discord Feed/i);
  await expect(page.getByTestId('get-started')).toBeVisible();
});