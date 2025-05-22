import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('shows error message on API failure', async ({ page }) => {
  await page.route('/api/servers', route => route.abort());
  await page.goto('/feed');
  await expect(page.getByText(/failed to load data/i)).toBeVisible();
});