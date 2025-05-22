import { test, expect } from '@playwright/test';

test('login button redirects to Discord OAuth', async ({ page }) => {
  await page.goto('/login');
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('login-discord').click(),
  ]);
  await expect(popup).toHaveURL(/discord.com\/oauth2/);
});