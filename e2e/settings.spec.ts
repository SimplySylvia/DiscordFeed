import { test, expect } from '@playwright/test';

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Replace with a login helper or mock if needed
    await page.goto('/settings');
  });

  test('loads and displays user settings', async ({ page }) => {
    await expect(page.getByTestId('settings-heading')).toBeVisible();
  });

  test('can change theme', async ({ page }) => {
    await page.getByTestId('theme-select').selectOption('dark');
    // Optionally check for dark mode class or style
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('can update notification preferences', async ({ page }) => {
    await page.getByTestId('notifications-checkbox').check();
    await expect(page.getByTestId('notifications-checkbox')).toBeChecked();
  });
});