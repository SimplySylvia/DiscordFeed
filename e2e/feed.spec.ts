import { test, expect } from '@playwright/test';

test.describe('Feed page', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Replace with a login helper or mock if needed
    await page.goto('/feed');
  });

  test('shows unread messages', async ({ page }) => {
    await expect(page.getByTestId('feed-list')).toBeVisible();
    const messages = page.getByTestId('feed-message');
    expect(await messages.count()).toBeGreaterThan(0);
  });

  test('infinite scroll loads more messages', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const messages = page.getByTestId('feed-message');
    expect(await messages.count()).toBeGreaterThan(10); // adjust as needed
  });

  test('mark as read updates UI', async ({ page }) => {
    const unread = page.getByTestId('feed-message-unread').first();
    await unread.click();
    // Optionally, check for class or badge disappearance
    await expect(unread).not.toBeVisible();
  });
});